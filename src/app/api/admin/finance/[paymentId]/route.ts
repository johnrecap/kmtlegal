import { NextResponse } from "next/server";
import { adminPaymentWriteSchema, getAdminPaymentDetail, updateAdminPayment } from "@/server/admin/finance-report-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type PaymentRouteProps = {
  params: Promise<{
    paymentId: string;
  }>;
};

export async function GET(request: Request, { params }: PaymentRouteProps) {
  const requestId = getRequestId(request);
  const { paymentId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const payment = await getAdminPaymentDetail({
      actor: context.principal,
      paymentId
    });

    return NextResponse.json({ data: payment, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: PaymentRouteProps) {
  const requestId = getRequestId(request);
  const { paymentId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminPaymentWriteSchema, "Payment payload is invalid.");
    const payment = await updateAdminPayment({
      actor: context.principal,
      paymentId,
      body,
      request
    });

    return NextResponse.json({ data: payment, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
