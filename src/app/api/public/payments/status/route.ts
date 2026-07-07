import { NextResponse } from "next/server";
import { getPublicPaymentAttemptStatus } from "@/server/payments/payment-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const url = new URL(request.url);
    const attemptId = url.searchParams.get("attemptId") ?? "";
    const token = url.searchParams.get("token");
    const result = await getPublicPaymentAttemptStatus({ attemptId, token });
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "public-payment-status", method: "GET" });
  }
}
