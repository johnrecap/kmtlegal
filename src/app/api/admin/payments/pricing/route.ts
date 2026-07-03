import { NextResponse } from "next/server";
import {
  adminConsultationPricingRuleWriteSchema,
  createAdminConsultationPricingRule,
  listAdminConsultationPricingRules
} from "@/server/payments/pricing-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const url = new URL(request.url);
    const result = await listAdminConsultationPricingRules({
      actor: context.principal,
      query: Object.fromEntries(url.searchParams.entries())
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-pricing", method: "GET" });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminConsultationPricingRuleWriteSchema, "Pricing rule payload is invalid.");
    const result = await createAdminConsultationPricingRule({
      actor: context.principal,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-pricing", method: "POST" });
  }
}
