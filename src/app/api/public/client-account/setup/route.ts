import { NextResponse } from "next/server";
import { completePublicClientAccountSetup, publicClientAccountSetupSchema } from "@/server/portal/client-account-setup-service";
import { setSessionCookie } from "@/server/auth/session";
import { getIpAddress } from "@/server/auth/session-store";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, publicClientAccountSetupSchema, "Client account setup payload is invalid.");
    await enforceRateLimit(rateLimiters.login, `${body.email}:${getIpAddress(request) ?? "unknown"}`);

    const result = await completePublicClientAccountSetup({
      body,
      request,
      requestId
    });

    const response = NextResponse.json(
      {
        data: {
          user: result.user,
          redirectTo: result.redirectTo
        },
        requestId
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
    setSessionCookie(response, result.token);
    return response;
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "public-client-account-setup", method: "POST", locale: "ar" });
  }
}
