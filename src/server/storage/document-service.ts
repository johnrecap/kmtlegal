import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { captureAnalyticsEventBestEffort, fileSizeBucket, safeFileType } from "@/server/observability/analytics-service";
import { generateDocumentFileKey } from "./file-keys";
import { documentDownloadHeaders } from "./download-headers";
import { assertMalwareScanSafe } from "./malware-scan";
import { assertUploadAllowed } from "./upload-policy";
import { deletePrivateFileBestEffort, readPrivateFile, savePrivateFile } from "./vps-storage";
import { assertVerifiedServiceClient } from "@/server/services/service-request-service";

export const documentCategorySchema = z.enum(["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"]);
export const documentVisibilitySchema = z.enum(["CLIENT_VISIBLE", "STAFF_ONLY", "INTERNAL_ONLY"]);

export const documentUploadFieldsSchema = z.object({
  ownerClientId: uuidSchema.optional(),
  caseId: uuidSchema.optional(),
  serviceRequestId: uuidSchema.optional(),
  paymentId: uuidSchema.optional(),
  delivery: z.boolean().default(false),
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
  let paymentOwner: string | null = null;
  if (fields.paymentId) {
    if (fields.serviceRequestId || fields.caseId || fields.delivery) throw new ApiError(400, "VALIDATION_ERROR", "Payment evidence cannot be a delivery.");
    const payment = await prisma.payment.findFirst({ where: { id: fields.paymentId, client: { deletedAt: null }, ...(hasPermission(input.actor, "document.manage.any") ? {} : { clientId: input.actor.clientId ?? "00000000-0000-0000-0000-000000000000", client: { userId: input.actor.id, deletedAt: null } }) } });
    if (!payment || payment.status === "DRAFT" || (fields.ownerClientId && fields.ownerClientId !== payment.clientId)) throw new ApiError(404, "NOT_FOUND", "Payment not found.");
    paymentOwner = payment.clientId;
  }
  let serviceTarget: { clientId: string; assignedLawyerId: string | null; status: string } | null = null;
  if (fields.serviceRequestId) {
    serviceTarget = await prisma.serviceRequest.findUnique({ where: { id: fields.serviceRequestId }, select: { clientId: true, assignedLawyerId: true, status: true } });
    if (!serviceTarget || ["COMPLETED", "CANCELLED"].includes(serviceTarget.status)) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    const own = input.actor.roleName === "Client" && input.actor.clientId === serviceTarget.clientId;
    if (own) await assertVerifiedServiceClient(input.actor);
    const staff = hasPermission(input.actor, "document.manage.any") || (hasPermission(input.actor, "case.update.assigned") && serviceTarget.assignedLawyerId === input.actor.id);
    if ((!own && !staff) || (fields.delivery && (!staff || serviceTarget.status !== "IN_PROGRESS")) || fields.caseId || (fields.ownerClientId && fields.ownerClientId !== serviceTarget.clientId)) throw new ApiError(403, "PERMISSION_DENIED", "Request upload is not allowed.");
  } else {
    assertDocumentUploadPermission(input.actor, fields);
    if (fields.delivery) throw new ApiError(400, "VALIDATION_ERROR", "A delivery needs a service request.");
  }
  assertUploadAllowed(input.file);
  await assertMalwareScanSafe(input.file.bytes);

  const ownerClientId = paymentOwner ?? serviceTarget?.clientId ?? (
    input.actor.clientId && hasPermission(input.actor, "document.upload.self") && !hasPermission(input.actor, "document.manage.any")
      ? input.actor.clientId
      : fields.ownerClientId ?? null);

  await assertDocumentUploadTargets(input.actor, fields, ownerClientId);

  const fileKey = generateDocumentFileKey({
    fileName: input.file.fileName,
    mimeType: input.file.mimeType
  });

  await savePrivateFile({ fileKey, bytes: input.file.bytes });

  const document = await prisma.$transaction(async tx => {
    let deliveryVersion: number | null = null;
    if (fields.serviceRequestId) {
      await tx.$queryRaw`SELECT "id" FROM "service_requests" WHERE "id" = ${fields.serviceRequestId}::uuid FOR UPDATE`;
      const current = await tx.serviceRequest.findUniqueOrThrow({ where: { id: fields.serviceRequestId } });
      if (["COMPLETED", "CANCELLED"].includes(current.status) || (fields.delivery && current.status !== "IN_PROGRESS")) throw new ApiError(409, "CONFLICT", "The request changed during upload.");
      if (!hasPermission(input.actor, "document.manage.any") && input.actor.clientId !== current.clientId && !(hasPermission(input.actor, "case.update.assigned") && current.assignedLawyerId === input.actor.id)) throw new ApiError(403, "PERMISSION_DENIED", "Request assignment changed.");
      if (fields.delivery) deliveryVersion = ((await tx.document.aggregate({ where: { serviceRequestId: current.id }, _max: { deliveryVersion: true } }))._max.deliveryVersion ?? 0) + 1;
      await tx.serviceRequest.update({ where: { id: current.id }, data: { revision: { increment: 1 } } });
    }
    return tx.document.create({
      data: {
        ownerClientId,
        caseId: fields.caseId ?? null,
        serviceRequestId: fields.serviceRequestId,
        paymentId: fields.paymentId,
        deliveryVersion,
        uploadedById: input.actor.id,
        fileName: input.file.fileName,
        fileKey,
        fileType: input.file.mimeType,
        fileSize: input.file.sizeBytes,
        category: fields.paymentId ? "PAYMENT" : fields.category,
        visibility: fields.delivery ? "CLIENT_VISIBLE" : fields.visibility ?? (ownerClientId ? "CLIENT_VISIBLE" : "STAFF_ONLY")
      }
    });
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
    clientId: document.ownerClientId,
    caseId: document.caseId,
    documentId: document.id,
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
      serviceRequest: { select: { assignedLawyerId: true, client: { select: { userId: true } } } },
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
    clientId: document.ownerClientId,
    caseId: document.caseId,
    documentId: document.id,
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
  serviceRequest?: { assignedLawyerId: string | null; client: { userId: string | null } } | null;
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
    if (document.serviceRequest) return document.serviceRequest.assignedLawyerId === actor.id;
    return document.ownerClient?.assignedLawyerId === actor.id || document.case?.assignedLawyerId === actor.id;
  }

  return false;
}
