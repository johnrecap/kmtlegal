import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/server/payments/payment-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const rawBody = await request.text();
    const result = await handlePaymentWebhook({ request, rawBody, requestId });
    return NextResponse.json(
      {
        data: {
          accepted: true,
          eventId: result.event.id,
          idempotent: result.idempotent
        },
        requestId
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "payment-webhook-paytabs", method: "POST" });
  }
}
