import { NextResponse } from "next/server";
import { adminDocumentDeleteSchema, deleteAdminDocument } from "@/server/admin/task-document-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type DocumentActionRouteProps = {
  params: {
    documentId: string;
  };
};

export async function POST(request: Request, { params }: DocumentActionRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminDocumentDeleteSchema, "Document delete payload is invalid.");
    const document = await deleteAdminDocument({
      actor: context.principal,
      documentId: params.documentId,
      body,
      request
    });

    return NextResponse.json({ data: document, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
