import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { captureAnalyticsEventBestEffort, fileSizeBucket, safeFileType } from "@/server/observability/analytics-service";
import { generateDocumentFileKey } from "./file-keys";
import { documentDownloadHeaders } from "./download-headers";
import { assertUploadAllowed } from "./upload-policy";
import { deletePrivateFileBestEffort, readPrivateFile, savePrivateFile } from "./vps-storage";

export const documentCategorySchema = z.enum(["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"]);
export const documentVisibilitySchema = z.enum(["CLIENT_VISIBLE", "STAFF_ONLY", "INTERNAL_ONLY"]);

export const documentUploadFieldsSchema = z.object({
  ownerClientId: uuidSchema.optional(),
  caseId: uuidSchema.optional(),
  category: documentCategorySchema.default("OTHER"),
  visibility: documentVisibilitySchema.optional()
});

export type DocumentUploadFields = z.infer<typeof documentUploadFieldsSchema>;

export type DocumentUploadFile = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes: Buffer;
};

export async function uploadDocument(input: {
  actor: Principal;
  fields: unknown;
  file: DocumentUploadFile;
  request?: Request;
  requestId?: string;
}) {
  const fields = parseWithSchema(documentUploadFieldsSchema, input.fields, "Document upload fields are invalid.");
  assertDocumentUploadPermission(input.actor, fields);
  assertUploadAllowed(input.file);

  const ownerClientId =
    input.actor.clientId && hasPermission(input.actor, "document.upload.self") && !hasPermission(input.actor, "document.manage.any")
      ? input.actor.clientId
      : fields.ownerClientId ?? null;

  await assertDocumentUploadTargets(input.actor, fields, ownerClientId);

  const fileKey = generateDocumentFileKey({
    fileName: input.file.fileName,
    mimeType: input.file.mimeType
  });

  await savePrivateFile({ fileKey, bytes: input.file.bytes });

  const document = await prisma.document
    .create({
      data: {
        ownerClientId,
        caseId: fields.caseId ?? null,
        uploadedById: input.actor.id,
        fileName: input.file.fileName,
        fileKey,
        fileType: input.file.mimeType,
        fileSize: input.file.sizeBytes,
        category: fields.category,
        visibility: fields.visibility ?? (ownerClientId ? "CLIENT_VISIBLE" : "STAFF_ONLY")
      }
    })
    .catch(async (error: unknown) => {
      await deletePrivateFileBestEffort({ fileKey, requestId: input.requestId });
      throw error;
    });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "document.upload",
    resourceType: "Document",
    resourceId: document.id,
    metadata: {
      documentId: document.id,
      fileType: document.fileType,
      fileSize: document.fileSize,
      category: document.category,
      visibility: document.visibility,
      ownerClientId: document.ownerClientId,
      caseId: document.caseId
    },
    request: input.request,
    requestId: input.requestId
  });

  captureAnalyticsEventBestEffort({
    name: "document.upload_succeeded",
    source: input.actor.roleName === "Client" ? "PORTAL" : "ADMIN",
    outcome: "SUCCESS",
    actor: input.actor,
    requestId: input.requestId,
    properties: {
      fileType: safeFileType(document.fileType),
      sizeBucket: fileSizeBucket(document.fileSize),
      category: document.category,
      visibility: document.visibility,
      actorScope: input.actor.roleName === "Client" ? "client" : "staff",
      hasCase: Boolean(document.caseId),
      hasOwnerClient: Boolean(document.ownerClientId)
    }
  });

  return document;
}

function assertDocumentUploadPermission(actor: Principal, fields: DocumentUploadFields) {
  if (hasPermission(actor, "document.manage.any")) {
    return;
  }

  if (hasPermission(actor, "document.upload.self") && actor.clientId) {
    if (fields.ownerClientId && fields.ownerClientId !== actor.clientId) {
      throw new ApiError(403, "PERMISSION_DENIED", "Cannot upload documents for another client.");
    }
    return;
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Document upload permission is required.");
}

async function assertDocumentUploadTargets(actor: Principal, fields: DocumentUploadFields, ownerClientId: string | null) {
  const selfUpload = hasPermission(actor, "document.upload.self") && actor.clientId && !hasPermission(actor, "document.manage.any");

  if (ownerClientId) {
    const client = await prisma.client.findUnique({
      where: { id: ownerClientId },
      select: { id: true, userId: true, deletedAt: true }
    });

    if (!client || client.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Document owner client was not found.");
    }
    if (selfUpload && ownerClientId !== actor.clientId) {
      throw new ApiError(403, "PERMISSION_DENIED", "Cannot upload documents for another client.");
    }
  }

  if (fields.caseId) {
    const legalCase = await prisma.legalCase.findUnique({
      where: { id: fields.caseId },
      select: { id: true, clientId: true, deletedAt: true }
    });

    if (!legalCase || legalCase.deletedAt) {
      throw new ApiError(404, "NOT_FOUND", "Document case was not found.");
    }
    if (selfUpload && legalCase.clientId !== actor.clientId) {
      throw new ApiError(403, "PERMISSION_DENIED", "Cannot upload documents to another client's case.");
    }
    if (ownerClientId && ownerClientId !== legalCase.clientId) {
      throw new ApiError(400, "VALIDATION_ERROR", "Document owner client must match the selected case client.");
    }
  }
}

export async function getAuthorizedDocumentDownload(input: { actor: Principal; documentId: string; request?: Request }) {
  const documentId = parseWithSchema(uuidSchema, input.documentId, "Document id is invalid.");
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      ownerClient: {
        select: {
          id: true,
          userId: true,
          assignedLawyerId: true
        }
      },
      case: {
        select: {
          id: true,
          assignedLawyerId: true,
          client: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  if (!document || document.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Document was not found.");
  }

  if (!canReadDocument(input.actor, document)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Document download is not allowed.");
  }

  const bytes = await readPrivateFile({ fileKey: document.fileKey });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "document.download",
    resourceType: "Document",
    resourceId: document.id,
    metadata: {
      documentId: document.id,
      fileType: document.fileType,
      fileSize: document.fileSize,
      visibility: document.visibility,
      ownerClientId: document.ownerClientId,
      caseId: document.caseId
    },
    request: input.request
  });

  return {
    bytes,
    headers: documentDownloadHeaders({
      fileName: document.fileName,
      mimeType: document.fileType,
      sizeBytes: document.fileSize
    })
  };
}

type ReadableDocument = {
  visibility: string;
  ownerClient?: { userId?: string | null; assignedLawyerId?: string | null } | null;
  case?: {
    assignedLawyerId?: string | null;
    client?: { userId?: string | null } | null;
  } | null;
};

export function canReadDocument(actor: Principal, document: ReadableDocument) {
  if (hasPermission(actor, "document.manage.any")) {
    return true;
  }

  if (hasPermission(actor, "document.read.own")) {
    const ownerUserId = document.ownerClient?.userId ?? document.case?.client?.userId ?? null;
    if (ownerUserId === actor.id && document.visibility === "CLIENT_VISIBLE") {
      return true;
    }
  }

  if (hasPermission(actor, "document.read.assigned")) {
    return document.ownerClient?.assignedLawyerId === actor.id || document.case?.assignedLawyerId === actor.id;
  }

  return false;
}
