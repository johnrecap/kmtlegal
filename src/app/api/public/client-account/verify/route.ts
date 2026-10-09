import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { completeClientVerification, completeVerificationSchema } from "@/server/portal/client-verification-service";
import { jsonOk } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { getIpAddress } from "@/server/auth/session-store";
import { setSessionCookie, shouldUseSecureCookie } from "@/server/auth/session";
import { ASSISTANT_COOKIE } from "@/server/consultations/conversation-session-service";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await enforceRateLimit(rateLimiters.login, `client-verification:${getIpAddress(request) ?? "unknown"}`);
    const body = await parseJsonRequest(request, completeVerificationSchema);
    const result = await completeClientVerification({ ...body, request });
    const response = jsonOk({ verified: true });
    setSessionCookie(response, result.token);
    response.cookies.set(ASSISTANT_COOKIE, result.assistantCapability, { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookie(), path: "/", maxAge: 7 * 86400 });
    return response;
  } catch (error) { return phaseFiveErrorResponse(error, request); }
}
