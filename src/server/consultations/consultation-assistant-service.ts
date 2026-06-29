import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AI_REVIEW_DISCLAIMER, consultationAssistantOutputSchema, generateStructured } from "@/server/ai";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { getIpAddress } from "@/server/auth/session-store";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import {
  assertClientPortalAccess,
  listPortalAppointments,
  listPortalCases,
  listPortalDocuments,
  listPortalPayments,
  ownCaseWhere
} from "@/server/portal/client-portal-service";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema, parseWithSchema } from "@/server/validation/schemas";
import {
  assertPublicConsultationSlotAvailable,
  CONSULTATION_TIMEZONE,
  listPublicConsultationSlots,
  type ConsultationMode,
  type PublicConsultationSlot
} from "./consultation-availability-service";
import { publicConsultationReference } from "./consultation-service";

const DEFAULT_DURATION_MINUTES = 60;
const OFFICE_TIMEZONE = CONSULTATION_TIMEZONE;

const assistantActionSchema = z.enum([
  "answer_general",
  "collect_booking_fields",
  "book_consultation_appointment",
  "appointment_inquiry",
  "handoff_to_human"
]);

const availabilityPreferenceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  label: z.string().trim().max(80).optional().or(z.literal("")),
  timeWindow: z.enum(["MORNING", "AFTERNOON", "EVENING", "ANYTIME"]).optional().or(z.literal("")),
  fromTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  toTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal(""))
});
type AvailabilityPreference = z.infer<typeof availabilityPreferenceSchema>;

const publicAssistantDraftSchema = z.object({
  fullName: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  serviceCategory: z.string().trim().max(80).optional().or(z.literal("")),
  summary: z.string().trim().max(3000).optional().or(z.literal("")),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]).optional(),
  startsAt: z.string().trim().max(80).optional().or(z.literal("")),
  availabilityPreference: availabilityPreferenceSchema.optional()
});

export const publicConsultationAssistantSchema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),
  message: z.string().trim().min(1).max(2000),
  intent: assistantActionSchema.optional(),
  draft: publicAssistantDraftSchema.optional(),
  fullName: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  phone: z.string().trim().min(6).max(40).optional().or(z.literal("")),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  serviceCategory: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  summary: z.string().trim().max(3000).optional().or(z.literal("")),
  opposingPartyName: z.string().trim().max(160).optional().or(z.literal("")),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]).default("ONLINE"),
  startsAt: z.string().trim().max(80).optional().or(z.literal("")),
  selectedSlot: z.string().trim().max(80).optional().or(z.literal("")),
  availabilityPreference: availabilityPreferenceSchema.optional(),
  confirmBooking: z.boolean().optional(),
  reference: z.string().trim().max(40).optional().or(z.literal("")),
  consent: z.boolean().optional()
});

export const clientConsultationAssistantSchema = publicConsultationAssistantSchema.pick({
  locale: true,
  message: true,
  intent: true
});

export type PublicConsultationAssistantInput = z.infer<typeof publicConsultationAssistantSchema>;
export type ClientConsultationAssistantInput = z.infer<typeof clientConsultationAssistantSchema>;

export async function handlePublicConsultationAssistant(input: { body: unknown; request: Request; requestId: string }) {
  const body = parseWithSchema(publicConsultationAssistantSchema, input.body, "Consultation assistant payload is invalid.");
  const limitKey = getIpAddress(input.request) ?? canonicalPhone(body.phone || "") ?? "anonymous";
  enforceRateLimit(rateLimiters.ai, `public-consultation-assistant:${limitKey}`);

  if (isLegalAdviceRequest(body.message)) {
    return scopedPublicAssistantReply(body.locale, isLegalAdviceRequest(body.message));
  }

  if (body.intent === "appointment_inquiry" || body.reference) {
    const ai = await runAssistantAI({
      locale: body.locale,
      body,
      actorId: null,
      requestId: input.requestId
    });
    return publicAppointmentInquiry({ body, ai });
  }

  return handlePublicBookingConversation({ body, request: input.request, requestId: input.requestId });
}

async function handlePublicBookingConversation(input: {
  body: PublicConsultationAssistantInput;
  request: Request;
  requestId: string;
}) {
  const draft = mergeBookingDraft(input.body);
  const selectedSlot = input.body.selectedSlot || draft.startsAt || input.body.startsAt || "";
  const missingFields = requiredBookingFields({ ...input.body, ...draft, startsAt: selectedSlot });

  if (input.body.confirmBooking || (input.body.intent === "book_consultation_appointment" && input.body.consent === true && selectedSlot)) {
    const confirmMissing = requiredBookingFields({ ...input.body, ...draft, startsAt: selectedSlot });
    if (confirmMissing.length) {
      return bookingConversationResponse({
        locale: input.body.locale,
        draft,
        missingFields: confirmMissing,
        selectedSlot,
        message: bookingQuestionMessage(input.body.locale, confirmMissing[0])
      });
    }

    const bookingBody = {
      ...input.body,
      ...draft,
      startsAt: selectedSlot,
      consent: true
    };
    const ai = await runAssistantAI({
      locale: input.body.locale,
      body: bookingBody,
      actorId: null,
      requestId: input.requestId
    });
    return bookConsultationAppointment({ body: bookingBody, ai, request: input.request, requestId: input.requestId });
  }

  if (missingFields.length) {
    if (missingFields.includes("startsAt")) {
      const hasPreference = hasAvailabilityPreference(draft.availabilityPreference);
      if (!hasPreference && !wantsAlternativeSlots(input.body.message)) {
        return bookingConversationResponse({
          locale: input.body.locale,
          draft,
          missingFields,
          selectedSlot,
          needsAvailabilityPreference: true,
          slotWindow: availabilityWindowDto(draft.availabilityPreference),
          message: availabilityQuestionMessage(input.body.locale)
        });
      }

      const availableSlots = await listPublicConsultationSlots({
        mode: draft.preferredMode,
        limit: hasPreference ? 12 : 6,
        date: draft.availabilityPreference.date || undefined,
        fromTime: draft.availabilityPreference.fromTime || undefined,
        toTime: draft.availabilityPreference.toTime || undefined
      });

      const fallbackSlots =
        hasPreference && !availableSlots.length
          ? await listPublicConsultationSlots({ mode: draft.preferredMode, limit: 6 })
          : undefined;

      return bookingConversationResponse({
        locale: input.body.locale,
        draft,
        missingFields,
        selectedSlot,
        availableSlots: availableSlots.length ? availableSlots : fallbackSlots,
        slotWindow: availabilityWindowDto(draft.availabilityPreference, !availableSlots.length && Boolean(fallbackSlots?.length)),
        message: availableSlots.length ? slotSelectionMessage(input.body.locale, draft.availabilityPreference) : noSlotsForPreferenceMessage(input.body.locale)
      });
    }

    return bookingConversationResponse({
      locale: input.body.locale,
      draft,
      missingFields,
      selectedSlot,
      message: bookingFollowUpMessage(input.body.locale, missingFields[0], input.body.message)
    });
  }

  return bookingConversationResponse({
    locale: input.body.locale,
    draft,
    selectedSlot,
    missingFields: [],
    readyToConfirm: true,
    message: bookingConfirmMessage(input.body.locale, draft, selectedSlot)
  });
}

export async function handleClientConsultationAssistant(input: { actor: Principal; body: unknown; requestId: string }) {
  const body = parseWithSchema(clientConsultationAssistantSchema, input.body, "Client assistant payload is invalid.");
  assertClientPortalAccess(input.actor);

  enforceRateLimit(rateLimiters.ai, `client-consultation-assistant:${input.actor.id}`);
  const intent = clientOrganizerIntentFromMessage(body.message);

  if (intent === "out_of_scope" || intent === "forbidden_data") {
    return {
      action: intent,
      message: clientOrganizerMessage(body.locale, intent),
      disclaimer: clientOrganizerDisclaimer(body.locale),
      requestId: input.requestId
    };
  }

  if (intent === "sessions") {
    const sessions = await listClientSessions(input.actor);
    return {
      action: intent,
      message: sessions.length ? clientOrganizerMessage(body.locale, "sessions_found") : clientOrganizerMessage(body.locale, "sessions_empty"),
      sessions,
      disclaimer: clientOrganizerDisclaimer(body.locale),
      requestId: input.requestId
    };
  }

  if (intent === "cases") {
    const cases = (await listPortalCases(input.actor)).map(caseDto);
    return {
      action: intent,
      message: cases.length ? clientOrganizerMessage(body.locale, "cases_found") : clientOrganizerMessage(body.locale, "cases_empty"),
      cases,
      disclaimer: clientOrganizerDisclaimer(body.locale),
      requestId: input.requestId
    };
  }

  if (intent === "documents") {
    const documents = (await listPortalDocuments(input.actor)).map(documentDto);
    return {
      action: intent,
      message: documents.length ? clientOrganizerMessage(body.locale, "documents_found") : clientOrganizerMessage(body.locale, "documents_empty"),
      documents,
      disclaimer: clientOrganizerDisclaimer(body.locale),
      requestId: input.requestId
    };
  }

  if (intent === "payments") {
    const payments = (await listPortalPayments(input.actor)).map(paymentDto);
    return {
      action: intent,
      message: payments.length ? clientOrganizerMessage(body.locale, "payments_found") : clientOrganizerMessage(body.locale, "payments_empty"),
      payments,
      disclaimer: clientOrganizerDisclaimer(body.locale),
      requestId: input.requestId
    };
  }

  const appointments = (await listPortalAppointments(input.actor))
    .filter((appointment) => ["SCHEDULED", "RESCHEDULED"].includes(appointment.status) && appointment.startsAt >= new Date())
    .slice(0, 10)
    .map(appointmentDto);

  return {
    action: "appointment_inquiry" as const,
    message: appointments.length ? clientMessage(body.locale, "appointments_found") : clientMessage(body.locale, "appointments_empty"),
    appointments,
    disclaimer: clientOrganizerDisclaimer(body.locale),
    requestId: input.requestId
  };
}

async function runAssistantAI(input: {
  locale: "ar" | "en";
  body: unknown;
  actorId: string | null;
  requestId: string;
}) {
  return generateStructured({
    task: "consultation_assistant",
    locale: input.locale,
    input: {
      ...sanitizeAssistantInput(input.body),
      allowedActions: assistantActionSchema.options,
      bookingRules: {
        durationMinutes: DEFAULT_DURATION_MINUTES,
        timezone: OFFICE_TIMEZONE,
        officeHours: "Sunday-Thursday 10:00-17:00"
      }
    },
    schema: consultationAssistantOutputSchema,
    actorId: input.actorId,
    requestId: input.requestId
  });
}

function mergeBookingDraft(body: PublicConsultationAssistantInput) {
  const base = {
    fullName: body.draft?.fullName || body.fullName || "",
    phone: body.draft?.phone || body.phone || "",
    email: body.draft?.email || body.email || "",
    city: body.draft?.city || body.city || "",
    serviceCategory: body.draft?.serviceCategory || body.serviceCategory || "",
    summary: body.draft?.summary || body.summary || "",
    urgency: body.draft?.urgency || body.urgency || "NORMAL",
    preferredMode: body.draft?.preferredMode || body.preferredMode || "ONLINE",
    startsAt: body.draft?.startsAt || body.startsAt || body.selectedSlot || "",
    availabilityPreference: body.draft?.availabilityPreference || body.availabilityPreference || {}
  };
  return normalizeBookingDraft({
    ...base,
    ...extractBookingDetails(body.message, base)
  });
}

function normalizeBookingDraft(draft: {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  serviceCategory?: string;
  summary?: string;
  urgency?: string;
  preferredMode?: string;
  startsAt?: string;
  availabilityPreference?: Partial<z.infer<typeof availabilityPreferenceSchema>>;
}) {
  const availabilityPreference = normalizeAvailabilityPreference(draft.availabilityPreference);
  return {
    fullName: draft.fullName?.trim() ?? "",
    phone: draft.phone?.trim() ?? "",
    email: draft.email?.trim() ?? "",
    city: draft.city?.trim() ?? "",
    serviceCategory: draft.serviceCategory?.trim() ?? "",
    summary: draft.summary?.trim() ?? "",
    urgency: (["LOW", "NORMAL", "HIGH", "URGENT"].includes(draft.urgency ?? "") ? draft.urgency : "NORMAL") as PublicConsultationAssistantInput["urgency"],
    preferredMode: (["PHONE", "ONLINE", "OFFICE"].includes(draft.preferredMode ?? "") ? draft.preferredMode : "ONLINE") as ConsultationMode,
    startsAt: draft.startsAt?.trim() ?? "",
    availabilityPreference
  };
}

function extractBookingDetails(
  message: string,
  current: {
    fullName?: string;
    phone?: string;
    email?: string;
    city?: string;
    serviceCategory?: string;
    summary?: string;
    preferredMode?: string;
    urgency?: string;
    availabilityPreference?: Partial<z.infer<typeof availabilityPreferenceSchema>>;
  }
) {
  const text = message.trim();
  const normalized = normalizedAssistantText(text);
  const next: Partial<ReturnType<typeof normalizeBookingDraft>> = {};
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+|00)?\d[\d\s().-]{6,}\d/)?.[0];

  if (email && !current.email) {
    next.email = email.toLowerCase();
  }
  if (phone && !current.phone) {
    next.phone = phone.replace(/[^\d+]/g, "");
  }
  if (!current.serviceCategory) {
    const serviceCategory = serviceCategoryFromMessage(normalized);
    if (serviceCategory) {
      next.serviceCategory = serviceCategory;
    }
  }

  const preferredMode = preferredModeFromMessage(normalized);
  if (preferredMode) {
    next.preferredMode = preferredMode;
  }

  const urgency = urgencyFromMessage(normalized);
  if (urgency) {
    next.urgency = urgency;
  }

  const availabilityPreference = availabilityPreferenceFromMessage(text, current.availabilityPreference);
  if (hasAvailabilityPreference(availabilityPreference)) {
    next.availabilityPreference = availabilityPreference;
  }

  const name = nameFromMessage(text);
  if (name && !current.fullName) {
    next.fullName = name;
  } else if (!current.fullName && likelyNameOnly(text)) {
    next.fullName = text;
  }

  const summaryCandidate = text
    .replace(email ?? "", "")
    .replace(phone ?? "", "")
    .trim();
  if (!current.summary && summaryCandidate.length >= 20 && !likelyNameOnly(summaryCandidate)) {
    next.summary = summaryCandidate;
  }

  if (!current.city) {
    const city = cityFromMessage(text);
    if (city) {
      next.city = city;
    }
  }

  return next;
}

export function inferPublicConsultationServiceCategory(message: string) {
  return serviceCategoryFromMessage(normalizedAssistantText(message));
}

function serviceCategoryFromMessage(text: string) {
  if (
    containsAny(text, [
      "litigation",
      "dispute",
      "court",
      "case",
      "claim",
      "promissory note",
      "trust receipt",
      "receipt of trust",
      "cheque",
      "check",
      "debt",
      "criminal complaint",
      "نزاع",
      "قضية",
      "محكمة",
      "تقاضي",
      "ايصال امانه",
      "إيصال أمانة",
      "وصل امانه",
      "وصل أمانة",
      "امانه",
      "أمانة",
      "شيك",
      "دين",
      "مديونية",
      "مطالبة",
      "محضر",
      "بلاغ",
      "جنحة",
      "تبديد"
    ])
  ) {
    return "disputes";
  }
  if (containsAny(text, ["real estate", "property", "عقار", "شقة", "أرض", "ارض"])) {
    return "real-estate";
  }
  if (containsAny(text, ["employment", "employee", "work", "labor", "عمل", "موظف", "عامل"])) {
    return "employment";
  }
  if (containsAny(text, ["contract", "company", "corporate", "shareholder", "شركة", "عقد", "شركات", "تأسيس"])) {
    return "corporate";
  }
  return "";
}

function preferredModeFromMessage(text: string): ConsultationMode | "" {
  if (containsAny(text, ["phone", "call", "هاتف", "تليفون", "مكالمة"])) {
    return "PHONE";
  }
  if (containsAny(text, ["office", "visit", "مكتب", "زيارة"])) {
    return "OFFICE";
  }
  if (containsAny(text, ["online", "zoom", "video", "أونلاين", "اونلاين", "فيديو"])) {
    return "ONLINE";
  }
  return "";
}

function urgencyFromMessage(text: string) {
  if (containsAny(text, ["urgent", "asap", "عاجل", "ضروري"])) {
    return "URGENT";
  }
  if (containsAny(text, ["high", "important", "مهم"])) {
    return "HIGH";
  }
  if (containsAny(text, ["low", "not urgent", "غير عاجل"])) {
    return "LOW";
  }
  return "";
}

function nameFromMessage(text: string) {
  const match = text.match(/(?:my name is|i am|انا اسمي|اسمي|الاسم)\s+([^,،\n]+)/i);
  return match?.[1]?.trim().slice(0, 120) ?? "";
}

function cityFromMessage(text: string) {
  const match = text.match(/(?:city|مدينة|من)\s+([^,،\n]+)/i);
  return match?.[1]?.trim().slice(0, 80) ?? "";
}

function likelyNameOnly(text: string) {
  const value = text.trim();
  if (value.length < 2 || value.length > 80 || /[0-9@]/.test(value)) {
    return false;
  }
  return value.split(/\s+/).length <= 5;
}

function normalizeAvailabilityPreference(value?: Partial<AvailabilityPreference>): AvailabilityPreference {
  return {
    date: value?.date || "",
    label: value?.label || "",
    timeWindow: value?.timeWindow || "",
    fromTime: value?.fromTime || "",
    toTime: value?.toTime || ""
  };
}

function hasAvailabilityPreference(value?: Partial<AvailabilityPreference>) {
  return Boolean(value?.date || value?.fromTime || value?.toTime || value?.timeWindow);
}

function availabilityPreferenceFromMessage(message: string, current?: Partial<AvailabilityPreference>): AvailabilityPreference {
  const text = normalizedAssistantText(message);
  const next = normalizeAvailabilityPreference(current);
  const date = availabilityDateFromMessage(text);
  const timeWindow = availabilityWindowFromMessage(text);
  const explicitTime = availabilityTimeFromMessage(text);

  if (date.date) {
    next.date = date.date;
    next.label = date.label;
  }
  if (timeWindow.timeWindow) {
    next.timeWindow = timeWindow.timeWindow;
    next.fromTime = timeWindow.fromTime;
    next.toTime = timeWindow.toTime;
  }
  if (explicitTime.fromTime || explicitTime.toTime) {
    next.fromTime = explicitTime.fromTime || next.fromTime;
    next.toTime = explicitTime.toTime || next.toTime;
    next.timeWindow = "ANYTIME";
  }

  return next;
}

function availabilityDateFromMessage(text: string) {
  const today = cairoDateString(new Date());
  const digitText = toAsciiDigits(text);
  if (containsAny(text, ["today", "النهارده", "اليوم", "النهاردة"])) {
    return { date: today, label: "today" };
  }
  if (containsAny(text, ["tomorrow", "بكره", "بكرة", "غدا", "غدًا"])) {
    return { date: addCairoDays(today, 1), label: "tomorrow" };
  }

  const isoDate = digitText.match(/\b(20\d{2}-\d{2}-\d{2})\b/)?.[1];
  if (isoDate) {
    return { date: isoDate, label: isoDate };
  }

  const numericDate = numericDateFromMessage(digitText, today);
  if (numericDate) {
    return { date: numericDate, label: numericDate };
  }

  const weekday = weekdayFromMessage(text);
  if (weekday !== null) {
    const currentWeekday = cairoWeekday(today);
    const offset = (weekday - currentWeekday + 7) % 7 || 7;
    return { date: addCairoDays(today, offset), label: "weekday" };
  }

  return { date: "", label: "" };
}

function numericDateFromMessage(text: string, today: string) {
  const match = text.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](20\d{2}))?\b/);
  if (!match) {
    return "";
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3] || today.slice(0, 4));
  const candidate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const probe = new Date(`${candidate}T12:00:00+03:00`);
  if (!Number.isFinite(probe.getTime()) || cairoDateString(probe) !== candidate) {
    return "";
  }
  if (!match[3] && candidate < today) {
    return `${String(year + 1).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return candidate;
}

function weekdayFromMessage(text: string) {
  const weekdays = [
    ["sunday", "sun", "الاحد", "الأحد"],
    ["monday", "mon", "الاثنين", "الإثنين", "الاثنين"],
    ["tuesday", "tue", "الثلاثاء"],
    ["wednesday", "wed", "الاربعاء", "الأربعاء"],
    ["thursday", "thu", "الخميس"],
    ["friday", "fri", "الجمعه", "الجمعة"],
    ["saturday", "sat", "السبت"]
  ];
  const index = weekdays.findIndex((tokens) => containsAny(text, tokens));
  return index >= 0 ? index : null;
}

function availabilityWindowFromMessage(text: string): Pick<AvailabilityPreference, "timeWindow" | "fromTime" | "toTime"> {
  if (containsAny(text, ["morning", "الصبح", "صباح", "صباحا", "صباحًا"])) {
    return { timeWindow: "MORNING", fromTime: "09:00", toTime: "12:00" };
  }
  if (containsAny(text, ["afternoon", "بعد الضهر", "بعد الظهر", "الضهر", "الظهر"])) {
    return { timeWindow: "AFTERNOON", fromTime: "12:00", toTime: "17:00" };
  }
  if (containsAny(text, ["evening", "night", "بالليل", "المساء", "مساء", "ليل"])) {
    return { timeWindow: "EVENING", fromTime: "17:00", toTime: "21:00" };
  }
  return { timeWindow: "", fromTime: "", toTime: "" };
}

function availabilityTimeFromMessage(text: string): Pick<AvailabilityPreference, "fromTime" | "toTime"> {
  const digitText = toAsciiDigits(text);
  const after = digitText.match(/(?:after|بعد)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|ص|م)?/i);
  if (after) {
    return { fromTime: normalizeClockTime(after[1], after[2], after[3]), toTime: "" };
  }
  const before = digitText.match(/(?:before|قبل)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|ص|م)?/i);
  if (before) {
    return { fromTime: "", toTime: normalizeClockTime(before[1], before[2], before[3]) };
  }
  return { fromTime: "", toTime: "" };
}

function normalizeClockTime(hourValue = "0", minuteValue = "0", meridiemValue = "") {
  let hour = Number(hourValue);
  const minute = Number(minuteValue || "0");
  const meridiem = meridiemValue.toLowerCase();
  if ((meridiem === "pm" || meridiem === "م") && hour < 12) {
    hour += 12;
  }
  if ((meridiem === "am" || meridiem === "ص") && hour === 12) {
    hour = 0;
  }
  if (!meridiem && hour >= 1 && hour <= 7) {
    hour += 12;
  }
  return `${String(Math.min(Math.max(hour, 0), 23)).padStart(2, "0")}:${String(Math.min(Math.max(minute, 0), 59)).padStart(2, "0")}`;
}

function wantsAlternativeSlots(message: string) {
  const text = normalizedAssistantText(message);
  return containsAny(text, ["alternative", "alternatives", "nearest", "another time", "بدائل", "اقرب", "أقرب", "مواعيد تانيه", "مواعيد تانية"]);
}

function availabilityWindowDto(value?: AvailabilityPreference, alternatives = false) {
  return {
    date: value?.date || "",
    label: alternatives ? "nearest alternatives" : value?.label || "",
    timeWindow: value?.timeWindow || "",
    fromTime: value?.fromTime || "",
    toTime: value?.toTime || "",
    alternatives
  };
}

function cairoDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addCairoDays(date: string, offset: number) {
  const base = new Date(`${date}T12:00:00+03:00`);
  base.setUTCDate(base.getUTCDate() + offset);
  return cairoDateString(base);
}

function cairoWeekday(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OFFICE_TIMEZONE,
    weekday: "short"
  }).formatToParts(new Date(`${date}T12:00:00+03:00`));
  const day = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

function toAsciiDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function bookingConversationResponse(input: {
  locale: "ar" | "en";
  draft: ReturnType<typeof mergeBookingDraft>;
  message: string;
  missingFields: string[];
  selectedSlot?: string;
  availableSlots?: PublicConsultationSlot[];
  needsAvailabilityPreference?: boolean;
  slotWindow?: ReturnType<typeof availabilityWindowDto>;
  readyToConfirm?: boolean;
}) {
  return {
    action: "collect_booking_fields" as const,
    message: input.message,
    draft: {
      ...input.draft,
      startsAt: input.selectedSlot || input.draft.startsAt || ""
    },
    missingFields: input.missingFields,
    availableSlots: input.availableSlots,
    needsAvailabilityPreference: input.needsAvailabilityPreference ?? false,
    slotWindow: input.slotWindow,
    readyToConfirm: input.readyToConfirm ?? false,
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[input.locale]
  };
}

function bookingQuestionMessage(locale: "ar" | "en", field?: string) {
  const messages = {
    ar: {
      fullName: "تمام. اكتب اسمك الكامل كما تحب أن يظهر في طلب الاستشارة.",
      phone: "ما رقم الهاتف المناسب للتواصل معك؟",
      serviceCategory: "ما مجال الاستشارة الأقرب لطلبك؟ يمكنك كتابة شركات، نزاعات، عقارات، أو عمل.",
      summary: "اكتب ملخصًا قصيرًا لما تحتاجه من المكتب، بدون إرسال مستندات حساسة هنا.",
      startsAt: "اختر موعدًا مناسبًا من المواعيد المتاحة داخل المحادثة.",
      fallback: "أستطيع تنظيم حجز الاستشارة فقط. اكتب الاسم والهاتف ونوع الطلب وملخصًا قصيرًا."
    },
    en: {
      fullName: "Great. Please write your full name for the consultation request.",
      phone: "What phone number should the team use to contact you?",
      serviceCategory: "Which consultation area is closest to your request? You can write corporate, disputes, real estate, or employment.",
      summary: "Please write a short summary of what you need from the office. Do not send sensitive documents here.",
      startsAt: "Choose a suitable time from the available slots inside the chat.",
      fallback: "I can organize consultation booking only. Send your name, phone, request area, and a short summary."
    }
  };

  return messages[locale][(field as keyof (typeof messages)["en"]) || "fallback"] ?? messages[locale].fallback;
}

function bookingFollowUpMessage(locale: "ar" | "en", field: string | undefined, latestMessage: string) {
  if (shouldClarifyBookingField(field, latestMessage)) {
    return unclearBookingFieldMessage(locale, field);
  }
  return bookingQuestionMessage(locale, field);
}

function shouldClarifyBookingField(field: string | undefined, latestMessage: string) {
  const text = normalizedAssistantText(latestMessage);
  if (!field || text.length < 2) {
    return false;
  }
  if (containsAny(text, ["book consultation", "check reference", "حجز استشارة", "استعلام", "مرجع"])) {
    return false;
  }
  return field === "serviceCategory";
}

function unclearBookingFieldMessage(locale: "ar" | "en", field: string | undefined) {
  if (field === "serviceCategory") {
    return locale === "ar"
      ? "الإجابة مش واضحة بالنسبة لمجال الاستشارة. اكتب المجال الأقرب: نزاعات، شركات، عقارات، أو عمل. لو الموضوع إيصال أمانة أو شيك أو محضر، اختار نزاعات."
      : "I could not identify the request area from that answer. Write the closest area: disputes, corporate, real estate, or employment. For trust receipts, checks, claims, or complaints, choose disputes.";
  }
  return locale === "ar" ? "الإجابة مش واضحة. من فضلك أعد كتابة المطلوب بشكل أبسط." : "That answer is not clear. Please write it again more simply.";
}

function availabilityQuestionMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "يناسبك أنهي يوم للاستشارة؟ اكتب النهارده، بكره، يوم معين، أو فترة مثل بعد 3 أو الصبح."
    : "Which day works for the consultation: today, tomorrow, a specific day, or a time window like after 3 or morning?";
}

function slotSelectionMessage(locale: "ar" | "en", preference?: AvailabilityPreference) {
  const windowText = preference ? availabilityWindowLabel(preference, locale) : "";
  if (windowText) {
    return locale === "ar"
      ? `هذه المواعيد المتاحة لـ ${windowText}. اختر وقتًا مناسبًا، ثم سأعرض ملخص الحجز للتأكيد.`
      : `These are the available slots for ${windowText}. Choose a suitable time, then I will show the booking summary for confirmation.`;
  }
  return locale === "ar"
    ? "هذه أقرب المواعيد المتاحة. اختر موعدًا مناسبًا، ثم سأعرض لك ملخص الحجز للتأكيد."
    : "These are the nearest available slots. Choose a suitable time, then I will show the booking summary for confirmation.";
}

function noSlotsMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "لا توجد مواعيد متاحة ظاهرة حاليًا. يمكن لفريق المكتب مراجعة ساعات الاستشارات وإتاحة مواعيد جديدة."
    : "No consultation slots are currently visible. The office team can review availability and open new times.";
}

function noSlotsForPreferenceMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "لا توجد مواعيد متاحة في الوقت الذي اخترته. هذه أقرب بدائل ظاهرة الآن، ويمكنك اختيار وقت آخر أو كتابة يوم مختلف."
    : "No slots are available for the time you chose. These are the nearest visible alternatives; you can choose another time or write a different day.";
}

function availabilityWindowLabel(preference: AvailabilityPreference, locale: "ar" | "en") {
  const parts: string[] = [];
  if (preference.date) {
    parts.push(
      new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        dateStyle: "medium",
        timeZone: OFFICE_TIMEZONE
      }).format(new Date(`${preference.date}T12:00:00+03:00`))
    );
  }
  if (preference.fromTime && preference.toTime) {
    parts.push(locale === "ar" ? `من ${preference.fromTime} إلى ${preference.toTime}` : `${preference.fromTime}-${preference.toTime}`);
  } else if (preference.fromTime) {
    parts.push(locale === "ar" ? `بعد ${preference.fromTime}` : `after ${preference.fromTime}`);
  } else if (preference.toTime) {
    parts.push(locale === "ar" ? `قبل ${preference.toTime}` : `before ${preference.toTime}`);
  }
  return parts.join(locale === "ar" ? " " : " ");
}

function bookingConfirmMessage(locale: "ar" | "en", draft: ReturnType<typeof mergeBookingDraft>, selectedSlot: string) {
  const when = formatAssistantDate(selectedSlot, locale);
  if (locale === "ar") {
    return `سأحجز الاستشارة بهذه البيانات: ${draft.fullName}، ${draft.phone}، ${serviceCategoryLabel(draft.serviceCategory, locale)}، ${modeLabel(draft.preferredMode, locale)}، ${when}. اضغط تأكيد الحجز لإرسال الطلب للسكرتيرة.`;
  }
  return `I will book the consultation with these details: ${draft.fullName}, ${draft.phone}, ${serviceCategoryLabel(draft.serviceCategory, locale)}, ${modeLabel(draft.preferredMode, locale)}, ${when}. Confirm the booking to send it to the team.`;
}

function formatAssistantDate(value: string, locale: "ar" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: OFFICE_TIMEZONE
  }).format(date);
}

function serviceCategoryLabel(value: string, locale: "ar" | "en") {
  const labels = {
    ar: { corporate: "شركات وعقود", disputes: "نزاعات وتقاضي", "real-estate": "عقارات", employment: "عمل وامتثال" },
    en: { corporate: "corporate and contracts", disputes: "litigation and disputes", "real-estate": "real estate", employment: "employment" }
  };
  return labels[locale][value as keyof (typeof labels)["en"]] ?? value;
}

function modeLabel(value: string, locale: "ar" | "en") {
  const labels = {
    ar: { PHONE: "هاتف", ONLINE: "أونلاين", OFFICE: "في المكتب" },
    en: { PHONE: "phone", ONLINE: "online", OFFICE: "office" }
  };
  return labels[locale][value as keyof (typeof labels)["en"]] ?? value;
}

function scopedPublicAssistantReply(locale: "ar" | "en", isLegalQuestion: boolean) {
  return {
    action: isLegalQuestion ? ("handoff_to_human" as const) : ("collect_booking_fields" as const),
    message:
      locale === "ar"
        ? isLegalQuestion
          ? "لا أستطيع تقديم رأي أو تفسير قانوني هنا. أستطيع فقط مساعدتك في حجز استشارة أو الاستعلام عن موعد سابق، وسيراجع فريق المكتب التفاصيل."
          : "أستطيع مساعدتك في حجز استشارة أو الاستعلام عن موعد سابق فقط. ابدأ بالحجز أو اكتب رقم المرجع للاستعلام."
        : isLegalQuestion
          ? "I cannot provide legal opinions or legal interpretation here. I can only help book a consultation or check an existing booking reference for team review."
          : "I can help book a consultation or check an existing booking reference only. Start a booking or send your reference to inquire.",
    missingFields: ["fullName", "phone", "serviceCategory", "summary"],
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[locale]
  };
}

type ClientOrganizerIntent = "appointments" | "sessions" | "cases" | "documents" | "payments" | "out_of_scope" | "forbidden_data";

export function clientOrganizerIntentFromMessage(message: string): ClientOrganizerIntent {
  const text = normalizedAssistantText(message);
  if (isLegalAdviceRequest(text)) {
    return "out_of_scope";
  }
  if (isCrossClientDataRequest(text)) {
    return "forbidden_data";
  }
  if (containsAny(text, ["جلس", "محكم", "session", "hearing", "court"])) {
    return "sessions";
  }
  if (containsAny(text, ["مستند", "وثيق", "ملف", "document", "file"])) {
    return "documents";
  }
  if (containsAny(text, ["مدفوع", "فاتور", "دفع", "payment", "invoice", "paid"])) {
    return "payments";
  }
  if (containsAny(text, ["قض", "ملف القضية", "case", "matter"])) {
    return "cases";
  }
  return "appointments";
}

export function isLegalAdviceRequest(message: string) {
  const text = normalizedAssistantText(message);
  return containsAny(text, [
    "اعمل ايه",
    "اعمل إيه",
    "أعمل ايه",
    "أعمل إيه",
    "رايك",
    "رأيك",
    "هكسب",
    "اكسب",
    "هل اكسب",
    "هل هكسب",
    "فسر",
    "تفسير الحكم",
    "تفسير قانوني",
    "موقفى القانوني",
    "موقفي القانوني",
    "legal advice",
    "what should i do",
    "will i win",
    "case outcome",
    "interpret the judgment",
    "interpret judgment",
    "legal opinion"
  ]);
}

export function isCrossClientDataRequest(message: string) {
  const text = normalizedAssistantText(message);
  return containsAny(text, [
    "عميل اخر",
    "عميل تاني",
    "عميل ثاني",
    "قضيه غير مملوكه",
    "قضيه لا تخصني",
    "قضيه مش بتاعتي",
    "ملف لا يخصني",
    "not mine",
    "other client",
    "another client",
    "someone else",
    "not my case"
  ]);
}

function normalizedAssistantText(message: string) {
  return message
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function containsAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(normalizedAssistantText(needle)));
}

async function listClientSessions(actor: Principal) {
  const cases = await prisma.legalCase.findMany({
    where: ownCaseWhere(actor),
    select: {
      id: true,
      title: true,
      internalFileNumber: true,
      sessions: {
        orderBy: { sessionDate: "desc" },
        take: 20,
        select: {
          id: true,
          courtName: true,
          sessionDate: true,
          decision: true,
          nextSessionDate: true
        }
      }
    },
    orderBy: [{ nextSessionAt: "asc" }, { createdAt: "desc" }]
  });

  return cases
    .flatMap((legalCase) => legalCase.sessions.map((session) => sessionDto(session, legalCase)))
    .sort((left, right) => new Date(right.sessionDate).getTime() - new Date(left.sessionDate).getTime())
    .slice(0, 20);
}

async function bookConsultationAppointment(input: {
  body: PublicConsultationAssistantInput;
  ai: Awaited<ReturnType<typeof runAssistantAI>>;
  request: Request;
  requestId: string;
}) {
  const missing = requiredBookingFields(input.body);
  if (missing.length) {
    return {
      action: "collect_booking_fields" as const,
      message: missingFieldsMessage(input.body.locale, missing),
      missingFields: missing,
      reviewRequired: input.ai.reviewRequired,
      disclaimer: AI_REVIEW_DISCLAIMER[input.body.locale],
      ai: aiMetadata(input.ai)
    };
  }
  if (input.body.consent !== true) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client consent is required before booking a consultation appointment.");
  }

  const startsAt = parseBookingDate(input.body.startsAt!);
  const slot = await assertPublicConsultationSlotAvailable({
    startsAt,
    mode: input.body.preferredMode
  });
  const endsAt = new Date(slot.endsAt);
  await assertNoBookingDuplicate(input.body);
  await assertNoSlotConflict(startsAt, endsAt);

  const phoneCanonical = canonicalPhone(input.body.phone!);
  const result = await prisma.$transaction(async (tx) => {
    const client = await upsertAssistantClient(tx, input.body, phoneCanonical);
    const consultation = await tx.consultationRequest.create({
      data: {
        clientId: client.id,
        fullName: input.body.fullName!,
        phone: input.body.phone!,
        phoneCanonical,
        email: input.body.email || null,
        city: input.body.city || null,
        serviceCategory: input.body.serviceCategory!,
        summary: input.body.summary!,
        opposingPartyName: input.body.opposingPartyName || null,
        urgency: input.body.urgency,
        preferredMode: input.body.preferredMode,
        status: "SCHEDULED",
        aiClassification: {
          assistantAction: input.ai.output.action,
          reviewRequired: input.ai.reviewRequired,
          requestId: input.ai.requestId
        },
        aiSummary: input.ai.output.message
      }
    });

    const appointment = await tx.appointment.create({
      data: {
        clientId: client.id,
        consultationRequestId: consultation.id,
        title: appointmentTitle(input.body.locale, consultation.id),
        type: "CONSULTATION",
        mode: input.body.preferredMode,
        startsAt,
        endsAt,
        status: "SCHEDULED",
        notes: "Booked by public consultation assistant."
      }
    });

    return { client, consultation, appointment };
  });

  await appendAuditLogBestEffort({
    actorId: null,
    action: "consultation.assistant_book",
    resourceType: "Appointment",
    resourceId: result.appointment.id,
    clientId: result.client.id,
    appointmentId: result.appointment.id,
    metadata: {
      consultationRequestId: result.consultation.id,
      reference: publicConsultationReference(result.consultation.id),
      serviceCategory: result.consultation.serviceCategory,
      urgency: result.consultation.urgency,
      mode: result.appointment.mode,
      startsAt: result.appointment.startsAt.toISOString(),
      source: "public-assistant"
    },
    request: input.request,
    requestId: input.requestId
  });

  return {
    action: "book_consultation_appointment" as const,
    message: bookedMessage(input.body.locale),
    reference: publicConsultationReference(result.consultation.id),
    appointment: appointmentDto(result.appointment),
    reviewRequired: input.ai.reviewRequired,
    disclaimer: AI_REVIEW_DISCLAIMER[input.body.locale],
    ai: aiMetadata(input.ai)
  };
}

async function publicAppointmentInquiry(input: {
  body: PublicConsultationAssistantInput;
  ai: Awaited<ReturnType<typeof runAssistantAI>>;
}) {
  const reference = input.body.reference?.trim();
  const phoneCanonical = canonicalPhone(input.body.phone || "");
  const email = input.body.email?.trim().toLowerCase();
  if (!reference || (!phoneCanonical && !email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Reference plus matching phone or email are required.");
  }

  const suffix = normalizeReference(reference);
  const consultation = await findConsultationByReference(suffix);

  if (!consultation || !matchesVerifiedContact(consultation, phoneCanonical, email)) {
    throw new ApiError(404, "NOT_FOUND", "No verified consultation appointment was found.");
  }

  return {
    action: "appointment_inquiry" as const,
    message: consultation.appointments.length
      ? clientMessage(input.body.locale, "appointments_found")
      : clientMessage(input.body.locale, "appointments_empty"),
    reference: publicConsultationReference(consultation.id),
    appointments: consultation.appointments.map(appointmentDto),
    reviewRequired: input.ai.reviewRequired,
    disclaimer: AI_REVIEW_DISCLAIMER[input.body.locale],
    ai: aiMetadata(input.ai)
  };
}

async function findConsultationByReference(suffix: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text AS id
    FROM consultation_requests
    WHERE id::text LIKE ${`${suffix.toLowerCase()}%`}
    ORDER BY "createdAt" DESC
    LIMIT 2
  `;

  if (rows.length > 1) {
    throw new ApiError(409, "CONFLICT", "Consultation reference is ambiguous.");
  }
  if (!rows[0]) {
    return null;
  }

  return prisma.consultationRequest.findUnique({
    where: { id: rows[0].id },
    include: {
      appointments: {
        where: { type: "CONSULTATION" },
        orderBy: { startsAt: "asc" }
      }
    }
  });
}

function requiredBookingFields(body: PublicConsultationAssistantInput) {
  const missing: string[] = [];
  if (!body.fullName) missing.push("fullName");
  if (!body.phone) missing.push("phone");
  if (!body.serviceCategory) missing.push("serviceCategory");
  if (!body.summary || body.summary.trim().length < 20) missing.push("summary");
  if (!body.startsAt) missing.push("startsAt");
  return missing;
}

function parseBookingDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", "Appointment date is invalid.");
  }
  if (parsed <= new Date()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Appointment date must be in the future.");
  }
  return parsed;
}

async function assertNoSlotConflict(startsAt: Date, endsAt: Date) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      type: "CONSULTATION",
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    },
    select: { id: true }
  });

  if (conflict) {
    throw new ApiError(409, "CONFLICT", "This consultation slot is already booked.");
  }
}

async function assertNoBookingDuplicate(body: PublicConsultationAssistantInput) {
  const phoneCanonical = canonicalPhone(body.phone || "");
  const contactFilters: Prisma.ConsultationRequestWhereInput[] = [phoneCanonical ? { phoneCanonical } : { phone: body.phone! }];
  if (body.email) {
    contactFilters.push({ email: body.email });
  }

  const recentDuplicate = await prisma.consultationRequest.findFirst({
    where: {
      serviceCategory: body.serviceCategory!,
      status: "SCHEDULED",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      OR: contactFilters
    },
    select: { id: true }
  });

  if (recentDuplicate) {
    throw new ApiError(409, "CONFLICT", "A scheduled consultation already exists for this contact and service area.");
  }
}

async function upsertAssistantClient(tx: Prisma.TransactionClient, body: PublicConsultationAssistantInput, phoneCanonical: string | null) {
  const contactFilters: Prisma.ClientWhereInput[] = [phoneCanonical ? { phoneCanonical } : { phone: body.phone! }];
  if (body.email) {
    contactFilters.push({ email: body.email });
  }

  const existing = await tx.client.findFirst({
    where: {
      deletedAt: null,
      OR: contactFilters
    },
    orderBy: { updatedAt: "desc" }
  });

  if (existing) {
    return tx.client.update({
      where: { id: existing.id },
      data: {
        fullName: body.fullName!,
        phone: body.phone!,
        phoneCanonical,
        email: body.email || existing.email,
        city: body.city || existing.city,
        source: existing.source || "ai-assistant",
        status: existing.status === "ARCHIVED" ? "ARCHIVED" : "LEAD"
      }
    });
  }

  return tx.client.create({
    data: {
      fullName: body.fullName!,
      phone: body.phone!,
      phoneCanonical,
      email: body.email || null,
      city: body.city || null,
      source: "ai-assistant",
      status: "LEAD"
    }
  });
}

function appointmentDto(appointment: {
  id: string;
  title: string;
  type: string;
  mode: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  lawyer?: { id: string; name: string } | null;
  case?: { id: string; internalFileNumber: string; title: string } | null;
}) {
  return {
    id: appointment.id,
    title: appointment.title,
    type: appointment.type,
    mode: appointment.mode,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
    lawyer: appointment.lawyer ?? null,
    case: appointment.case ?? null
  };
}

function caseDto(legalCase: {
  id: string;
  internalFileNumber: string;
  title: string;
  status: string;
  priority: string;
  nextSessionAt: Date | null;
  assignedLawyer?: { id: string; name: string } | null;
}) {
  return {
    id: legalCase.id,
    internalFileNumber: legalCase.internalFileNumber,
    title: legalCase.title,
    status: legalCase.status,
    priority: legalCase.priority,
    nextSessionAt: legalCase.nextSessionAt?.toISOString() ?? null,
    assignedLawyer: legalCase.assignedLawyer ?? null
  };
}

function sessionDto(
  session: {
    id: string;
    courtName: string | null;
    sessionDate: Date;
    decision: string | null;
    nextSessionDate: Date | null;
  },
  legalCase: { id: string; title: string; internalFileNumber: string }
) {
  return {
    id: session.id,
    courtName: session.courtName,
    sessionDate: session.sessionDate.toISOString(),
    decision: session.decision,
    nextSessionDate: session.nextSessionDate?.toISOString() ?? null,
    case: {
      id: legalCase.id,
      title: legalCase.title,
      internalFileNumber: legalCase.internalFileNumber
    }
  };
}

function documentDto(document: {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  status: string;
  createdAt: Date;
  case?: { id: string; title: string; internalFileNumber: string } | null;
}) {
  return {
    id: document.id,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    category: document.category,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    case: document.case ?? null
  };
}

function paymentDto(payment: {
  id: string;
  invoiceNumber: string;
  amount: Prisma.Decimal | number | string;
  currency: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  case?: { id: string; title: string; internalFileNumber: string } | null;
}) {
  return {
    id: payment.id,
    invoiceNumber: payment.invoiceNumber,
    amount: String(payment.amount),
    currency: payment.currency,
    status: payment.status,
    issueDate: payment.issueDate.toISOString(),
    dueDate: payment.dueDate?.toISOString() ?? null,
    paidAt: payment.paidAt?.toISOString() ?? null,
    case: payment.case ?? null
  };
}

function normalizeReference(reference: string) {
  const suffix = reference.trim().toUpperCase().replace(/^CONS-/, "");
  if (!/^[0-9A-F]{8}$/.test(suffix)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Consultation reference is invalid.");
  }
  return suffix;
}

function matchesVerifiedContact(
  consultation: { phone: string; phoneCanonical: string | null; email: string | null },
  phoneCanonical: string | null,
  email: string | undefined
) {
  const storedPhone = consultation.phoneCanonical ?? canonicalPhone(consultation.phone);
  const phoneMatches = Boolean(phoneCanonical && storedPhone && phoneCanonical === storedPhone);
  const emailMatches = Boolean(email && consultation.email && consultation.email.toLowerCase() === email);
  return phoneMatches || emailMatches;
}

function appointmentTitle(locale: "ar" | "en", consultationId: string) {
  const reference = publicConsultationReference(consultationId);
  return locale === "ar" ? `موعد استشارة ${reference}` : `Consultation appointment ${reference}`;
}

function bookedMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "تم حجز موعد الاستشارة. استخدم رقم المرجع للاستعلام عن الموعد."
    : "The consultation appointment has been booked. Use the reference to inquire about the appointment.";
}

function missingFieldsMessage(locale: "ar" | "en", fields: string[]) {
  return locale === "ar"
    ? `أحتاج هذه البيانات قبل الحجز: ${fields.join(", ")}.`
    : `I need these fields before booking: ${fields.join(", ")}.`;
}

function clientMessage(locale: "ar" | "en", key: "appointments_found" | "appointments_empty") {
  if (key === "appointments_empty") {
    return locale === "ar" ? "لا توجد مواعيد استشارة قادمة مطابقة." : "No upcoming consultation appointments were found.";
  }
  return locale === "ar" ? "هذه مواعيد الاستشارة المتاحة لك." : "These are your consultation appointments.";
}

function clientOrganizerMessage(
  locale: "ar" | "en",
  key:
    | "out_of_scope"
    | "forbidden_data"
    | "sessions_found"
    | "sessions_empty"
    | "cases_found"
    | "cases_empty"
    | "documents_found"
    | "documents_empty"
    | "payments_found"
    | "payments_empty"
) {
  const messages = {
    ar: {
      out_of_scope:
        "لا أستطيع تقديم رأي قانوني أو توقع نتيجة أو تفسير حكم. أستطيع فقط تنظيم بيانات حسابك ومساعدتك في معرفة المواعيد والجلسات والمستندات والمدفوعات الظاهرة لك.",
      forbidden_data: "لا أستطيع عرض بيانات عميل آخر أو قضية غير ظاهرة في حسابك. أستطيع فقط استخدام البيانات المملوكة لحسابك الحالي.",
      sessions_found: "هذه الجلسات الظاهرة في حسابك الآن.",
      sessions_empty: "لا توجد جلسات ظاهرة في حسابك حاليًا.",
      cases_found: "هذه القضايا الظاهرة في حسابك الآن، بدون أي تحليل قانوني.",
      cases_empty: "لا توجد قضايا ظاهرة في حسابك حاليًا.",
      documents_found: "هذه المستندات المرئية لك الآن.",
      documents_empty: "لا توجد مستندات مرئية لك الآن.",
      payments_found: "هذه المدفوعات الظاهرة في بوابتك الآن.",
      payments_empty: "لا توجد مدفوعات ظاهرة في بوابتك حاليًا."
    },
    en: {
      out_of_scope:
        "I cannot provide legal opinions, predict outcomes, or interpret judgments. I can only organize the data visible in your account: appointments, sessions, cases, documents, and payments.",
      forbidden_data: "I cannot show another client's data or a case that is not visible in your account. I can only use data owned by your current account.",
      sessions_found: "These are the sessions currently visible in your account.",
      sessions_empty: "No sessions are currently visible in your account.",
      cases_found: "These are the cases currently visible in your account, without legal analysis.",
      cases_empty: "No cases are currently visible in your account.",
      documents_found: "These are the documents currently visible to you.",
      documents_empty: "No documents are currently visible to you.",
      payments_found: "These are the payments currently visible in your portal.",
      payments_empty: "No payments are currently visible in your portal."
    }
  };

  return messages[locale][key];
}

function clientOrganizerDisclaimer(locale: "ar" | "en") {
  return locale === "ar"
    ? "مساعد تنظيمي فقط، وليس محاميًا ولا يقدم استشارة قانونية."
    : "Organizational assistant only. It is not a lawyer and does not provide legal advice.";
}

function aiMetadata(ai: Awaited<ReturnType<typeof runAssistantAI>>) {
  return {
    provider: ai.provider,
    model: ai.model,
    requestId: ai.requestId,
    latencyMs: ai.latencyMs
  };
}

function sanitizeAssistantInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }
  const copy = { ...(value as Record<string, unknown>) };
  delete copy.password;
  return copy;
}
