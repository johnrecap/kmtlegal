import { NextResponse } from "next/server";
import { getAuthContextFromRequest, getIpAddress } from "@/server/auth/session-store";
import { type Principal } from "@/server/auth/policy";
import { ApiError, errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { captureAnalyticsEventBestEffort, fileSizeBucket, safeFileType } from "@/server/observability/analytics-service";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { uploadDocument } from "@/server/storage/document-service";
import { assertMultipartContentLengthAllowed } from "@/server/storage/upload-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let actor: Principal | null = null;
  let uploadAttempt:
    | {
        fileType?: string;
        sizeBytes?: number;
        category?: string;
      }
    | null = null;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    actor = context.principal;

    await enforceRateLimit(rateLimiters.upload, `${context.principal.id}:${getIpAddress(request) ?? "unknown"}`);
    assertMultipartContentLengthAllowed(request.headers.get("content-length"));

    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return jsonError(400, "VALIDATION_ERROR", "Multipart form data is required.", requestId);
    }

    const formFile = formData.get("file");
    if (!isFileLike(formFile)) {
      return jsonError(400, "VALIDATION_ERROR", "A file field is required.", requestId);
    }
    uploadAttempt = {
      fileType: formFile.type,
      sizeBytes: formFile.size,
      category: stringField(formData, "category") ?? "OTHER"
    };

    const bytes = Buffer.from(await formFile.arrayBuffer());
    const document = await uploadDocument({
      actor: context.principal,
      fields: {
        ownerClientId: stringField(formData, "ownerClientId"),
        caseId: stringField(formData, "caseId"),
        category: stringField(formData, "category") ?? "OTHER",
        visibility: stringField(formData, "visibility")
      },
      file: {
        fileName: formFile.name,
        mimeType: formFile.type,
        sizeBytes: formFile.size,
        bytes
      },
      request,
      requestId
    });

    return NextResponse.json(
      {
        data: {
          id: document.id,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          category: document.category,
          status: document.status,
          visibility: document.visibility,
          createdAt: document.createdAt
        },
        requestId
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    if (actor) {
      captureAnalyticsEventBestEffort({
        name: "document.upload_failed",
        source: actor.roleName === "Client" ? "PORTAL" : "ADMIN",
        outcome: "FAILURE",
        actor,
        requestId,
        properties: {
          errorCode: error instanceof ApiError ? error.code : "INTERNAL_ERROR",
          httpStatus: error instanceof ApiError ? error.status : 500,
          fileType: safeFileType(uploadAttempt?.fileType),
          sizeBucket: fileSizeBucket(uploadAttempt?.sizeBytes),
          category: uploadAttempt?.category ?? "OTHER",
          actorScope: actor.roleName === "Client" ? "client" : "staff"
        }
      });
    }
    return errorToResponse(error, requestId);
  }
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "type" in value &&
    "size" in value
  );
}
