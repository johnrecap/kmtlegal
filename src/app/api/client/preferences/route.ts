import { NextResponse } from "next/server";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { clientPreferenceSchema, updateClientPreferences } from "@/server/portal/client-portal-service";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(
      request,
      clientPreferenceSchema,
      "Client preference payload is invalid."
    );
    const preference = await updateClientPreferences({
      actor: context.principal,
      body,
      request,
      requestId
    });
    return NextResponse.json(
      { data: preference, requestId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
