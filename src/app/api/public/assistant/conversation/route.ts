import { phaseFiveErrorResponse } from "@/server/http/phase-five-errors";
import { z } from "zod";
import { getAuthContextFromRequest, getIpAddress } from "@/server/auth/session-store";
import { setSessionCookie, shouldUseSecureCookie } from "@/server/auth/session";
import { getRequestId, jsonOk, ApiError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { ASSISTANT_COOKIE, changeAssistantDialogue, assistantCapability, createAssistantSession, readAssistantSession, sendAssistantMessage } from "@/server/consultations/conversation-session-service";
import { attachAuthenticatedClient, submitConversationRequest } from "@/server/consultations/conversation-submission-service";
import { conversationMessageSchema, intakeDraftSchema } from "@/server/consultations/conversation-contract";
import { startClientVerification, startVerificationSchema } from "@/server/portal/client-verification-service";
import { directBookingInputSchema, listDirectBookingSlots, mutateDirectBooking } from "@/server/consultations/direct-booking-service";
import { consultationSlotFilterSchema } from "@/server/consultations/consultation-availability-service";
import { ownAssistantSession } from "@/server/consultations/conversation-session-service";
import { officeContactSchema, setOfficeContact } from "@/server/consultations/office-contact-service";
import { clientRegistrationSchema, registerConversationClient } from "@/server/portal/client-registration-service";

export const dynamic = "force-dynamic";
const actions = z.discriminatedUnion("action", [
  directBookingInputSchema,
  officeContactSchema,
  z.strictObject({ action: z.literal("booking_slots"), ...consultationSlotFilterSchema.shape }),
  z.strictObject({ action: z.literal("set_locale"), locale: z.enum(["ar", "en"]) }),
  z.strictObject({ action: z.literal("begin_booking"), service: intakeDraftSchema.shape.service }),
  z.strictObject({ action: z.literal("return_inquiry") }),
  z.strictObject({ action: z.literal("account_access") }),
  z.strictObject({ action: z.literal("start"), locale: z.enum(["ar", "en"]), service: intakeDraftSchema.shape.service }),
  z.strictObject({ action: z.literal("restart"), locale: z.enum(["ar", "en"]), service: intakeDraftSchema.shape.service }),
  conversationMessageSchema.extend({ action: z.literal("message") }),
  startVerificationSchema.extend({ action: z.literal("verify") }),
  clientRegistrationSchema.safeExtend({ action: z.literal("register") }),
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
    const modeAction = ["begin_booking", "return_inquiry", "account_access", "booking_slots", "set_locale", "set_office_contact"].includes(body.action);
    // Reversible mode changes must not consume the five-request booking quota.
    const limiter = body.action === "register" ? rateLimiters.login : body.action === "message" ? rateLimiters.ai : modeAction ? rateLimiters.conversation : rateLimiters.booking;
    await enforceRateLimit(limiter, `assistant-v2:${auth?.principal.id ?? getIpAddress(request) ?? "unknown"}`);
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
    if (body.action === "register") {
      await enforceRateLimit(rateLimiters.login, `assistant-signup-email:${body.email}`);
      const registered = await registerConversationClient({ capability: token, body: {
        revision: body.revision, fullName: body.fullName, phone: body.phone, email: body.email, password: body.password, confirmPassword: body.confirmPassword
      }, actor: auth?.principal, request });
      const response = jsonOk(await readAssistantSession(token, registered.principal));
      setSessionCookie(response, registered.token);
      return response;
    }
    if (body.action === "set_office_contact") return jsonOk(await setOfficeContact(token, body, auth?.principal));
    if (body.action === "booking_slots") {
      const session = await readAssistantSession(token, auth?.principal);
      return jsonOk(await listDirectBookingSlots(body.date, session.booking?.appointments[0]?.id, { fromTime: body.fromTime, toTime: body.toTime }));
    }
    if (body.action === "set_locale") {
      const session = await ownAssistantSession(token, auth?.principal);
      const { prisma } = await import("@/server/db/prisma");
      const updated = await prisma.assistantSession.updateMany({ where: { id: session.id, revision: session.revision, leaseId: null }, data: { locale: body.locale, revision: { increment: 1 } } });
      if (!updated.count) throw new ApiError(409, "CONFLICT", "Conversation changed.");
      return jsonOk(await readAssistantSession(token, auth?.principal));
    }
    if (["confirm_booking", "reschedule_booking", "cancel_booking", "request_callback"].includes(body.action)) {
      await mutateDirectBooking(token, directBookingInputSchema.parse(body), auth?.principal);
      return jsonOk(await readAssistantSession(token, auth?.principal));
    }
    if (body.action === "begin_booking" || body.action === "return_inquiry" || body.action === "account_access") return jsonOk(await changeAssistantDialogue(token, body.action, auth?.principal, body.action === "begin_booking" ? body.service : undefined));
    if (body.action === "message") return jsonOk(await sendAssistantMessage({ ...body, token, actor: auth?.principal, requestId, assertIdentity: async () => {
      if (!auth) return;
      const current = await getAuthContextFromRequest(request);
      if (!current || current.principal.id !== auth.principal.id || current.principal.clientId !== auth.principal.clientId) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    } }));
    if (body.action === "verify") {
      await enforceRateLimit(rateLimiters.login, `assistant-email:${body.email}`);
      return jsonOk(await startClientVerification({ capability: token, email: body.email, purpose: body.purpose, actor: auth?.principal }));
    }
    if (!auth) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    if (body.action === "attach") return jsonOk(await attachAuthenticatedClient(token, auth.principal));
    return jsonOk(await submitConversationRequest({ token, actor: auth.principal, revision: body.revision }));
  } catch (error) { return phaseFiveErrorResponse(error, request); }
}
