import { NextResponse } from "next/server";
import { replayAdminPaymentWebhookEvent } from "@/server/payments/payment-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type WebhookReplayRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function POST(request: Request, { params }: WebhookReplayRouteProps) {
  const requestId = getRequestId(request);
  const { eventId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const result = await replayAdminPaymentWebhookEvent({
      actor: context.principal,
      eventId,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-webhook-replay", method: "POST" });
  }
}
