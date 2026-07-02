import { NextResponse } from "next/server";
import { adminDocumentUpdateSchema, updateAdminDocument } from "@/server/admin/task-document-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type DocumentRouteProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function PATCH(request: Request, { params }: DocumentRouteProps) {
  const requestId = getRequestId(request);
  const { documentId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminDocumentUpdateSchema, "Document payload is invalid.");
    const document = await updateAdminDocument({
      actor: context.principal,
      documentId,
      body,
      request
    });

    return NextResponse.json({ data: document, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
