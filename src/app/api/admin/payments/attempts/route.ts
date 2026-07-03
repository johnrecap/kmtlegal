import { NextResponse } from "next/server";
import { listAdminPaymentAttempts } from "@/server/payments/payment-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const url = new URL(request.url);
    const result = await listAdminPaymentAttempts({
      actor: context.principal,
      query: Object.fromEntries(url.searchParams.entries())
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-attempts", method: "GET" });
  }
}
