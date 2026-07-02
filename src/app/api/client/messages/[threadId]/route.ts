import { NextResponse } from "next/server";
import { getClientConversationDetail } from "@/server/conversations/conversation-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type ClientMessageRouteProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function GET(request: Request, { params }: ClientMessageRouteProps) {
  const requestId = getRequestId(request);
  const { threadId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const result = await getClientConversationDetail({
      actor: context.principal,
      threadId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "client.messages.detail", method: "GET" });
  }
}
