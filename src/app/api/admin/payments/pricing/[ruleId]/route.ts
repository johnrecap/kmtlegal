import { NextResponse } from "next/server";
import { adminConsultationPricingRuleWriteSchema, updateAdminConsultationPricingRule } from "@/server/payments/pricing-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type PricingRuleRouteProps = {
  params: Promise<{
    ruleId: string;
  }>;
};

export async function PATCH(request: Request, { params }: PricingRuleRouteProps) {
  const requestId = getRequestId(request);
  const { ruleId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminConsultationPricingRuleWriteSchema, "Pricing rule payload is invalid.");
    const result = await updateAdminConsultationPricingRule({
      actor: context.principal,
      ruleId,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-pricing-detail", method: "PATCH" });
  }
}
