import { NextResponse } from "next/server";
import {
  adminPaymentGatewaySettingsSchema,
  getAdminPaymentGatewaySettings,
  updateAdminPaymentGatewaySettings
} from "@/server/payments/payment-settings-service";
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

    const result = await getAdminPaymentGatewaySettings({ actor: context.principal });
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-settings", method: "GET" });
  }
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminPaymentGatewaySettingsSchema, "Payment gateway setting payload is invalid.");
    const result = await updateAdminPaymentGatewaySettings({
      actor: context.principal,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin-payment-settings", method: "PATCH" });
  }
}
