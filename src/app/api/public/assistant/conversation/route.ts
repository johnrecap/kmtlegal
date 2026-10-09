import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { z } from "zod";
import { getAuthContextFromRequest, getIpAddress } from "@/server/auth/session-store";
import { shouldUseSecureCookie } from "@/server/auth/session";
import { getRequestId, jsonOk, ApiError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { ASSISTANT_COOKIE, assistantCapability, createAssistantSession, readAssistantSession, sendAssistantMessage } from "@/server/consultations/conversation-session-service";
import { attachAuthenticatedClient, submitConversationRequest } from "@/server/consultations/conversation-submission-service";
import { conversationMessageSchema, intakeDraftSchema } from "@/server/consultations/conversation-contract";
import { startClientVerification, startVerificationSchema } from "@/server/portal/client-verification-service";

export const dynamic = "force-dynamic";
const actions = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("start"), locale: z.enum(["ar", "en"]), service: intakeDraftSchema.shape.service }),
  z.strictObject({ action: z.literal("restart"), locale: z.enum(["ar", "en"]), service: intakeDraftSchema.shape.service }),
  conversationMessageSchema.extend({ action: z.literal("message") }),
  startVerificationSchema.extend({ action: z.literal("verify") }),
  z.strictObject({ action: z.literal("attach") }),
  z.strictObject({ action: z.literal("submit"), revision: z.number().int().nonnegative(), confirmed: z.literal(true) })
]);

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    const token = assistantCapability(request);
    if (!token) return jsonOk(null);
    const auth = await getAuthContextFromRequest(request);
    return jsonOk(await readAssistantSession(token, auth?.principal));
  } catch (error) { return phaseFiveErrorResponse(error, request); }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const body = await parseJsonRequest(request, actions);
    const auth = await getAuthContextFromRequest(request);
    await enforceRateLimit(body.action === "message" ? rateLimiters.ai : rateLimiters.booking, `assistant-v2:${auth?.principal.id ?? getIpAddress(request) ?? "unknown"}`);
    let token = assistantCapability(request);
    if (body.action === "start" || body.action === "restart") {
      if (token && body.action === "start") {
        try { return jsonOk(await readAssistantSession(token, auth?.principal)); }
        catch (error) { if (!(error instanceof ApiError) || error.code !== "AUTH_REQUIRED") throw error; }
      }
      token = await createAssistantSession(body.locale, auth?.principal, body.service);
      const response = jsonOk(await readAssistantSession(token, auth?.principal));
      response.cookies.set(ASSISTANT_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookie(), path: "/", maxAge: 7 * 86400 });
      return response;
    }
    if (!token) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    if (body.action === "message") return jsonOk(await sendAssistantMessage({ ...body, token, actor: auth?.principal, requestId }));
    if (body.action === "verify") {
      await enforceRateLimit(rateLimiters.login, `assistant-email:${body.email}`);
      return jsonOk(await startClientVerification({ capability: token, email: body.email, purpose: body.purpose, actor: auth?.principal }));
    }
    if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    if (body.action === "attach") return jsonOk(await attachAuthenticatedClient(token, auth.principal));
    return jsonOk(await submitConversationRequest({ token, actor: auth.principal, revision: body.revision }));
  } catch (error) { return phaseFiveErrorResponse(error, request); }
}
