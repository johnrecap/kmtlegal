import { NextResponse } from "next/server";
import { conversationMessageCreateSchema, replyAdminConversation } from "@/server/conversations/conversation-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type AdminMessageRouteProps = {
  params: {
    threadId: string;
  };
};

export async function POST(request: Request, { params }: AdminMessageRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, conversationMessageCreateSchema, "Conversation message payload is invalid.");
    const result = await replyAdminConversation({
      actor: context.principal,
      threadId: params.threadId,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.messages.reply", method: "POST" });
  }
}
