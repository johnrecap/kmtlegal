import { z } from "zod";
import type { PublicLocale } from "@/lib/public-locale";
import type { LegalSource } from "@/lib/legal-assistant";
import type { DirectBooking } from "./direct-booking-panel";
import type { OfficeContact } from "./office-contact-dialog";

export type ConversationState = {
  proposals?: Array<{ id: string; messageId: string; preview: { title: string; lines: string[] }; status: "PENDING" | "COMPLETED" | "CANCELLED" | "STALE"; expiresAt: string }>;
  locale: PublicLocale; handoffState: "NONE" | "QUEUED" | "CLAIMED"; booking: DirectBooking | null;
  dialogue: { mode: "INQUIRY" | "BOOKING"; offerShown: boolean; consentAt: string | null; accountAccess: boolean; bookingFormRequestId?: string };
  draft: Record<string, string | null>; revision: number; accountReady: boolean; humanOwned: boolean; submitted: boolean;
  turns: Array<{ messageId: string; recipient?: "ASSISTANT" | "OFFICE"; userText: string; assistantText: string | null; status: string; errorCode?: string | null; createdAt?: string; updatedAt?: string; sources?: LegalSource[] }>;
  staffMessages?: Array<{ id: string; body: string; createdAt: string }>;
  closed?: boolean; messageLimitReached?: boolean; officeThreadStatus?: string | null; officeContact?: OfficeContact | null; expiresAt?: string;
};

const timestamp = z.string().refine(value => Number.isFinite(Date.parse(value)));
const appointmentSchema = z.object({ id: z.string(), startsAt: timestamp, endsAt: timestamp, status: z.string(), lawyer: z.object({ name: z.string() }).nullable() });
const bookingSchema = z.object({ confirmationSource: z.string(), contactChannel: z.string(), publicReference: z.string().nullable(), fullName: z.string(), phone: z.string().nullable(), appointments: z.array(appointmentSchema) });
const conversationSchema = z.object({
  proposals: z.array(z.object({ id: z.string().uuid(), messageId: z.string().uuid(), preview: z.object({ title: z.string(), lines: z.array(z.string()) }), status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "STALE"]), expiresAt: timestamp })).optional(),
  locale: z.enum(["ar", "en"]), revision: z.number().int().nonnegative(),
  handoffState: z.enum(["NONE", "QUEUED", "CLAIMED"]), booking: bookingSchema.nullable(),
  draft: z.object({ fullName: z.string().nullable().optional(), phone: z.string().nullable().optional(), email: z.string().nullable().optional(), service: z.string().nullable().optional(), contactChannel: z.string().nullable().optional(), requestedStartsAt: z.string().nullable().optional() }).passthrough(),
  accountReady: z.boolean(), humanOwned: z.boolean(), submitted: z.boolean(),
  dialogue: z.object({ mode: z.enum(["INQUIRY", "BOOKING"]), offerShown: z.boolean(), consentAt: z.string().nullable(), accountAccess: z.boolean(), bookingFormRequestId: z.string().uuid().optional() }),
  turns: z.array(z.object({ messageId: z.string().min(1), recipient: z.enum(["ASSISTANT", "OFFICE"]).optional(), userText: z.string(), assistantText: z.string().nullable(), status: z.enum(["PENDING", "FAILED", "COMPLETED", "HUMAN"]), errorCode: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/).nullable().optional() })),
  staffMessages: z.array(z.object({ id: z.string(), body: z.string(), createdAt: timestamp })).optional(),
  closed: z.boolean().optional(), messageLimitReached: z.boolean().optional(), expiresAt: timestamp.optional(), officeThreadStatus: z.string().nullable().optional(),
  officeContact: z.object({ phone: z.string(), contactChannel: z.string(), consentedAt: timestamp }).nullable().optional()
});
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(`${value}T12:00:00Z`)));
const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/);
const hours = z.object({ start: clock, end: clock });
const slotSchema = z.object({ id: z.string(), startsAt: timestamp, endsAt: timestamp, mode: z.literal("PHONE") });
const daySchema = z.object({ date: calendarDate, status: z.enum(["AVAILABLE", "CLOSED_WEEKLY", "CLOSED_EXCEPTION", "MODE_UNAVAILABLE", "FULL", "LEAD_TIME", "OUTSIDE_WINDOW", "UNPUBLISHED", "NO_STAFF", "NO_SLOTS", "OUTSIDE_HOURS"]), hours: hours.nullable(), closedPeriods: z.array(hours) });
const availabilitySchema = z.object({ published: z.boolean(), timezone: z.literal("Africa/Cairo"), now: timestamp, slotDurationMinutes: z.number().positive(),
  slots: z.array(slotSchema), selectedDay: daySchema, days: z.array(daySchema), window: z.object({ startsOn: calendarDate, endsOn: calendarDate }),
  weeklyHours: z.array(z.object({ weekday: z.number().int().min(0).max(6), enabled: z.boolean(), hours: hours.nullable() })),
  nearestSlot: slotSchema.nullable(), suggestedSlots: z.array(slotSchema), hasAvailability: z.boolean()
});
const envelopeSchema = z.object({ data: z.unknown() });
const errorSchema = z.object({ error: z.object({ code: z.string().optional(), requestId: z.string().optional() }) });

export class ConversationRequestError extends Error {
  constructor(public readonly kind: "HTTP" | "TIMEOUT" | "NETWORK" | "INVALID_RESPONSE", public readonly status?: number,
    public readonly code?: string, public readonly requestId?: string) {
    super("Conversation request failed.");
    this.name = "ConversationRequestError";
  }
}

/** One attempt only. Recovery decisions belong to the conversation/booking consumer. */
export async function conversationRequest<T = ConversationState | null>(body?: Record<string, unknown>, locale: PublicLocale = "ar"): Promise<T> {
  const controller = new AbortController();
  const budget = body?.action === "message" ? 75_000 : 20_000;
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new ConversationRequestError("TIMEOUT")); }, budget);
  });
  const request = async () => {
    const response = await fetch("/api/public/assistant/conversation", {
      method: body ? "POST" : "GET", cache: "no-store", credentials: "same-origin", signal: controller.signal,
      headers: { "x-kmt-locale": locale, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    // An HTML proxy error must retain HTTP status even though its body is not JSON.
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const parsed = errorSchema.safeParse(payload);
      const failure = parsed.success ? parsed.data.error : undefined;
      const code = failure?.code && /^[A-Z][A-Z0-9_]{0,63}$/.test(failure.code) ? failure.code : undefined;
      const requestId = failure?.requestId && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(failure.requestId) ? failure.requestId : undefined;
      throw new ConversationRequestError("HTTP", response.status, code, requestId);
    }
    const envelope = envelopeSchema.safeParse(payload);
    if (!envelope.success || !payload || typeof payload !== "object" || !("data" in payload)) throw new ConversationRequestError("INVALID_RESPONSE", response.status);
    const snapshot = envelope.data.data;
    if (snapshot === null && !body) return null as T;
    const schema = body?.action === "booking_slots" ? availabilitySchema : conversationSchema;
    if (!schema.safeParse(snapshot).success) throw new ConversationRequestError("INVALID_RESPONSE", response.status);
    return snapshot as T;
  };
  try { return await Promise.race([request(), deadline]); }
  catch (error) {
    if (error instanceof ConversationRequestError) throw error;
    throw new ConversationRequestError(controller.signal.aborted ? "TIMEOUT" : "NETWORK");
  } finally { clearTimeout(timer!); }
}
