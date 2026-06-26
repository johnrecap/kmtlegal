import { NextResponse } from "next/server";
import { adminContactMessageStatusUpdateSchema, updateAdminContactMessageStatus } from "@/server/admin/contact-message-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: { messageId: string } }) {
  const requestId = getRequestId(request);

  try {
    const authContext = await getAuthContextFromRequest(request);
    if (!authContext) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminContactMessageStatusUpdateSchema, "Contact message status payload is invalid.");
    const message = await updateAdminContactMessageStatus({
      actor: authContext.principal,
      messageId: context.params.messageId,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: message, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.contact-messages", method: "PATCH" });
  }
}
