import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AI_REVIEW_DISCLAIMER, bookingIntakeExtractionOutputSchema, generateStructured } from "@/server/ai";
import { createConsultationReviewNotifications } from "@/server/admin/notification-service";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { getIpAddress } from "@/server/auth/session-store";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { createConsultationPaymentAttempt } from "@/server/payments/payment-service";
import { consultationPriceDto, resolveConsultationPrice } from "@/server/payments/pricing-service";
import {
  assertClientPortalAccess,
  listPortalAppointments,
  listPortalCases,
  listPortalDocuments,
  listPortalPayments,
  ownCaseWhere
} from "@/server/portal/client-portal-service";
import { publicClientAccountSetupTarget } from "@/server/portal/client-account-setup-service";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema, parseWithSchema } from "@/server/validation/schemas";
import {
  assertPublicConsultationSlotAvailable,
  CONSULTATION_TIMEZONE,
  listPublicConsultationSlots,
  type ConsultationMode,
  type PublicConsultationSlot
} from "./consultation-availability-service";
import { getPublicConsultationBookingMode } from "./consultation-booking-settings";
import { publicConsultationReference } from "./consultation-service";

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

export const publicConsultationCheckoutSchema = publicConsultationAssistantSchema
  .pick({
    locale: true,
    message: true,
    draft: true,
    selectedSlot: true,
    fullName: true,
    phone: true,
    email: true,
    city: true,
    serviceCategory: true,
    summary: true,
    opposingPartyName: true,
    urgency: true,
    preferredMode: true,
    startsAt: true,
    consent: true
  })
  .extend({
    confirmPayment: z.literal(true)
  });

export type PublicConsultationAssistantInput = z.infer<typeof publicConsultationAssistantSchema>;
export type ClientConsultationAssistantInput = z.infer<typeof clientConsultationAssistantSchema>;
export type PublicConsultationCheckoutInput = z.infer<typeof publicConsultationCheckoutSchema>;
type BookingIntakeExtraction = z.infer<typeof bookingIntakeExtractionOutputSchema>;
type BookingDraft = ReturnType<typeof normalizeBookingDraft>;
type BookingMergeResult = {
  draft: BookingDraft;
  aiUnavailable: boolean;
  lowConfidence: boolean;
  legalAdviceRequested: boolean;
  clarifyingQuestion?: string;
  extraction?: BookingIntakeExtraction;
};

const BOOKING_AI_CONFIDENCE_THRESHOLD = 0.55;
const BOOKING_AI_FIELD_CONFIDENCE_THRESHOLD = 0.5;
const DEFAULT_ASSISTANT_SERVICE_CATEGORY = "legal-consultation";
const BOOKING_SUMMARY_MIN_LENGTH = 20;
const GENERIC_BOOKING_SUMMARY_TOKENS = new Set([
  "a",
  "an",
  "and",
  "appointment",
  "asap",
  "book",
  "booking",
  "consultation",
  "general",
  "help",
  "need",
  "office",
  "please",
  "request",
  "review",
  "the",
  "to",
  "urgent",
  "user",
  "wants",
  "with",
  "about",
  "اريد",
  "استشاره",
  "استشارة",
  "استشارات",
  "احجز",
  "او",
  "المكتب",
  "الي",
  "الى",
  "حابه",
  "حابب",
  "حجز",
  "جدا",
  "ضروري",
  "طلب",
  "عامه",
  "عايز",
  "عايزه",
  "عن",
  "علي",
  "على",
  "في",
  "محتاج",
  "محتاجه",
  "مراجعه",
  "موعد",
  "من",
  "موضوع",
  "و"
]);

export async function handlePublicConsultationAssistant(input: { body: unknown; request: Request; requestId: string }) {
  const body = parseWithSchema(publicConsultationAssistantSchema, input.body, "Consultation assistant payload is invalid.");
  const limitKey = getIpAddress(input.request) ?? canonicalPhone(body.phone || "") ?? "anonymous";
  enforceRateLimit(rateLimiters.ai, `public-consultation-assistant:${limitKey}`);

  if (isLegalAdviceRequest(body.message)) {
    return scopedPublicAssistantReply(body.locale, isLegalAdviceRequest(body.message));
  }

  if (body.intent === "appointment_inquiry" || body.reference) {
    return publicAppointmentInquiry({ body, requestId: input.requestId });
  }

  return handlePublicBookingConversation({ body, request: input.request, requestId: input.requestId });
}

async function handlePublicBookingConversation(input: {
  body: PublicConsultationAssistantInput;
  request: Request;
  requestId: string;
}) {
  const bookingMode = await getPublicConsultationBookingMode();
  const mergeResult = await mergeBookingDraftWithAi(input.body, input.requestId);
  if (mergeResult.legalAdviceRequested) {
    return scopedPublicAssistantReply(input.body.locale, true);
  }

  const draft = mergeResult.draft;
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

    const selectedSlotError = publicBookingSlotConfirmationError(input.body.locale, selectedSlot);
    if (selectedSlotError) {
      const nextDraft = normalizeBookingDraft({ ...draft, startsAt: "" });
      return bookingConversationResponse({
        locale: input.body.locale,
        draft: nextDraft,
        missingFields: ["startsAt"],
        selectedSlot: "",
        needsAvailabilityPreference: true,
        slotWindow: availabilityWindowDto(nextDraft.availabilityPreference),
        message: selectedSlotError
      });
    }

    const bookingBody = {
      ...input.body,
      ...draft,
      serviceCategory: assistantServiceCategory(draft.serviceCategory),
      startsAt: selectedSlot,
      consent: true
    };
    try {
      if (bookingMode === "AI_CHAT_FREE") {
        return await createFreeConsultationBooking({ body: bookingBody, request: input.request, requestId: input.requestId });
      }
      return await prepareConsultationPaymentReview({ body: bookingBody, requestId: input.requestId });
    } catch (error) {
      if (isRecoverableBookingSlotError(error)) {
        return recoverBookingSlotSelection({
          locale: input.body.locale,
          draft,
          message: recoveredSlotSelectionMessage(input.body.locale, true)
        });
      }
      if (isDuplicateBookingError(error)) {
        return bookingConversationResponse({
          locale: input.body.locale,
          draft,
          missingFields: [],
          selectedSlot,
          message: duplicateBookingConversationMessage(input.body.locale)
        });
      }
      throw error;
    }
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
          message: isAmbiguousAvailabilityMessage(input.body.message)
            ? ambiguousAvailabilityQuestionMessage(input.body.locale)
            : availabilityQuestionMessage(input.body.locale)
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

    const firstNonSlotMissing = missingFields.find((field) => field !== "startsAt");
    if ((mergeResult.aiUnavailable || mergeResult.lowConfidence) && firstNonSlotMissing) {
      return bookingConversationResponse({
        locale: input.body.locale,
        draft,
        missingFields,
        selectedSlot,
        message: bookingFollowUpMessage(input.body.locale, firstNonSlotMissing, input.body.message, mergeResult)
      });
    }

    return bookingConversationResponse({
      locale: input.body.locale,
      draft,
      missingFields,
      selectedSlot,
      message: bookingFollowUpMessage(input.body.locale, missingFields[0], input.body.message, mergeResult)
    });
  }

  return bookingConversationResponse({
    locale: input.body.locale,
    draft,
    selectedSlot,
    missingFields: [],
    readyToConfirm: true,
    message: bookingConfirmMessage(input.body.locale, draft, selectedSlot, bookingMode === "AI_CHAT_PAID")
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

function mergeBookingDraft(body: PublicConsultationAssistantInput) {
  const base = baseBookingDraft(body);
  return normalizeBookingDraft({
    ...base,
    ...extractBookingDetails(body.message, base)
  });
}

async function mergeBookingDraftWithAi(body: PublicConsultationAssistantInput, requestId: string): Promise<BookingMergeResult> {
  const base = baseBookingDraft(body);
  const fallbackDraft = normalizeBookingDraft({
    ...base,
    ...extractBookingDetails(body.message, base)
  });

  if (shouldBypassBookingAi(body)) {
    return {
      draft: fallbackDraft,
      aiUnavailable: false,
      lowConfidence: false,
      legalAdviceRequested: false
    };
  }

  const extraction = await extractBookingIntakeWithAi(body, normalizeBookingDraft(base), requestId);
  if (!extraction) {
    return {
      draft: fallbackDraft,
      aiUnavailable: true,
      lowConfidence: false,
      legalAdviceRequested: false
    };
  }

  if (extraction.legalAdviceRequested || extraction.intent === "legal_advice") {
    return {
      draft: normalizeBookingDraft(base),
      aiUnavailable: false,
      lowConfidence: false,
      legalAdviceRequested: true,
      extraction
    };
  }

  const aiDraft = bookingDraftFromAiExtraction(extraction, fallbackDraft);
  const mergedDraft = normalizeBookingDraft({
    ...fallbackDraft,
    ...aiDraft
  });

  return {
    draft: mergedDraft,
    aiUnavailable: false,
    lowConfidence: extraction.confidence < BOOKING_AI_CONFIDENCE_THRESHOLD,
    legalAdviceRequested: false,
    clarifyingQuestion: extraction.needsClarification ? extraction.clarifyingQuestion?.trim() : undefined,
    extraction
  };
}

function shouldBypassBookingAi(body: PublicConsultationAssistantInput) {
  return Boolean(body.confirmBooking || body.selectedSlot || shouldBypassBookingAiForMessage(body.message));
}

export function shouldBypassBookingAiForMessage(message: string) {
  return isAvailabilityOnlyMessage(message);
}

export function publicBookingAvailabilityPreferenceFromMessage(
  message: string,
  current?: Partial<AvailabilityPreference>,
  now = new Date()
) {
  return availabilityPreferenceFromMessage(message, current, now);
}

export function isInformativeBookingSummary(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length < BOOKING_SUMMARY_MIN_LENGTH || isAvailabilityOnlyMessage(trimmed) || likelyNameOnly(trimmed)) {
    return false;
  }

  const normalized = normalizedAssistantText(trimmed)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return false;
  }

  const meaningfulTokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !GENERIC_BOOKING_SUMMARY_TOKENS.has(token));

  return meaningfulTokens.join("").length >= 8;
}

function baseBookingDraft(body: PublicConsultationAssistantInput) {
  return {
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
  const fullName = draft.fullName?.trim() ?? "";
  const phone = draft.phone?.trim() ?? "";
  const summary = draft.summary?.trim() ?? "";
  return {
    fullName: isInvalidBookingFullName(fullName) ? "" : fullName,
    phone: isValidBookingPhone(phone) ? phone : "",
    email: draft.email?.trim() ?? "",
    city: draft.city?.trim() ?? "",
    serviceCategory: draft.serviceCategory?.trim() ?? "",
    summary: isInformativeBookingSummary(summary) ? summary : "",
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
  } else if (!current.fullName && likelyNameOnly(text) && !isInvalidBookingFullName(text) && !isAvailabilityOnlyMessage(text)) {
    next.fullName = text;
  }

  const summaryCandidate = text
    .replace(email ?? "", "")
    .replace(phone ?? "", "")
    .trim();
  if (!current.summary && isInformativeBookingSummary(summaryCandidate)) {
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

async function extractBookingIntakeWithAi(
  body: PublicConsultationAssistantInput,
  currentDraft: BookingDraft,
  requestId: string
): Promise<BookingIntakeExtraction | null> {
  try {
    const result = await generateStructured({
      task: "booking_intake_extraction",
      locale: body.locale,
      input: bookingIntakeExtractionInput(body, currentDraft),
      schema: bookingIntakeExtractionOutputSchema,
      safetyPolicy: {
        requireHumanReview: true,
        prohibitLegalAdvice: true,
        redactBeforeLogging: true
      },
      requestId,
      recordRun: false
    });

    return result.output;
  } catch (error) {
    console.warn("Booking intake AI extraction fell back to deterministic intake.", {
      requestId,
      code: error instanceof ApiError ? error.code : "AI_EXTRACTION_FAILED"
    });
    return null;
  }
}

function bookingIntakeExtractionInput(body: PublicConsultationAssistantInput, currentDraft: BookingDraft) {
  return {
    locale: body.locale,
    userMessage: body.message,
    currentDraft,
    today: new Date().toISOString(),
    timezone: OFFICE_TIMEZONE,
    allowedServiceCategories: [
      {
        value: "legal-consultation",
        description: "General legal consultation, criminal/civil/commercial/family/labor disputes, litigation, complaints, police reports."
      },
      {
        value: "corporate-business-services",
        description: "Companies, commercial contracts, governance, compliance, incorporation, shareholders, business disputes."
      },
      {
        value: "real-estate-legal-support",
        description: "Real estate review, leases, ownership, sale or purchase contracts, landlord/tenant matters."
      },
      {
        value: "claims-collections",
        description: "Financial claims, debt collection, cheques, trust receipts, settlements, invoices, notices."
      }
    ],
    outputRules: [
      "Return strict JSON only.",
      "Extract only what the client actually provided or clearly implied.",
      "Do not invent names, phone numbers, appointment slots, prices, legal opinions, or payment status.",
      "Use null for unknown fields.",
      "Set legalAdviceRequested true when the user asks for a legal opinion, prediction, interpretation, or what action to take.",
      "Use serviceCategory only from allowedServiceCategories.",
      "Use availabilityPreference for relative or preferred times; do not set a final booked slot."
    ],
    outputShape: {
      intent: "booking | reference_inquiry | legal_advice | unclear",
      fields: {
        fullName: "string | null",
        phone: "string | null",
        email: "string | null",
        city: "string | null",
        serviceCategory: "allowed category | null",
        summary: "short client matter summary | null",
        urgency: "LOW | NORMAL | HIGH | URGENT | null",
        preferredMode: "PHONE | ONLINE | OFFICE | null",
        availabilityPreference: {
          date: "YYYY-MM-DD | null",
          label: "string | null",
          timeWindow: "MORNING | AFTERNOON | EVENING | ANYTIME | null",
          fromTime: "HH:mm | null",
          toTime: "HH:mm | null"
        }
      },
      fieldConfidence: "0..1 confidence per field",
      confidence: "0..1 overall confidence",
      needsClarification: "boolean",
      clarifyingQuestion: "one short question in the user's language, or null",
      legalAdviceRequested: "boolean",
      reviewNote: "short internal note that lawyer review is required"
    }
  };
}

function bookingDraftFromAiExtraction(
  extraction: BookingIntakeExtraction,
  current: ReturnType<typeof baseBookingDraft>
): Partial<ReturnType<typeof normalizeBookingDraft>> {
  if (extraction.confidence < BOOKING_AI_CONFIDENCE_THRESHOLD) {
    return {};
  }

  const fields = extraction.fields ?? {};
  const next: Partial<ReturnType<typeof normalizeBookingDraft>> = {};

  if (!current.fullName && trustedBookingAiField(extraction, "fullName") && fields.fullName && !isInvalidBookingFullName(fields.fullName)) {
    next.fullName = fields.fullName;
  }
  if (!current.phone && trustedBookingAiField(extraction, "phone") && fields.phone && isValidBookingPhone(fields.phone)) {
    next.phone = fields.phone.replace(/[^\d+]/g, "");
  }
  if (!current.email && trustedBookingAiField(extraction, "email") && fields.email) {
    next.email = fields.email;
  }
  if (!current.city && trustedBookingAiField(extraction, "city") && fields.city) {
    next.city = fields.city;
  }
  if (!current.serviceCategory && trustedBookingAiField(extraction, "serviceCategory") && fields.serviceCategory) {
    next.serviceCategory = fields.serviceCategory;
  }
  if (!current.summary && trustedBookingAiField(extraction, "summary") && fields.summary && isInformativeBookingSummary(fields.summary)) {
    next.summary = fields.summary;
  }
  if (trustedBookingAiField(extraction, "urgency") && fields.urgency) {
    next.urgency = fields.urgency;
  }
  if (trustedBookingAiField(extraction, "preferredMode") && fields.preferredMode) {
    next.preferredMode = fields.preferredMode;
  }
  if (trustedBookingAiField(extraction, "availabilityPreference") && fields.availabilityPreference) {
    next.availabilityPreference = normalizeAvailabilityPreference({
      date: fields.availabilityPreference.date ?? undefined,
      label: fields.availabilityPreference.label ?? undefined,
      timeWindow: fields.availabilityPreference.timeWindow ?? undefined,
      fromTime: fields.availabilityPreference.fromTime ?? undefined,
      toTime: fields.availabilityPreference.toTime ?? undefined
    });
  }

  return next;
}

function trustedBookingAiField(extraction: BookingIntakeExtraction, field: keyof BookingIntakeExtraction["fieldConfidence"]) {
  return (
    extraction.confidence >= BOOKING_AI_CONFIDENCE_THRESHOLD &&
    (extraction.fieldConfidence?.[field] ?? 0) >= BOOKING_AI_FIELD_CONFIDENCE_THRESHOLD
  );
}

export function inferPublicConsultationServiceCategory(message: string) {
  return serviceCategoryFromMessage(normalizedAssistantText(message));
}

function serviceCategoryFromMessage(text: string) {
  if (
    containsAny(text, [
      "claim",
      "claims",
      "collection",
      "collections",
      "debt collection",
      "legal notice",
      "notice",
      "promissory note",
      "trust receipt",
      "receipt of trust",
      "cheque",
      "check",
      "debt",
      "settlement",
      "invoice",
      "تحصيل",
      "مطالبة",
      "مطالبات",
      "تسوية",
      "تسويات",
      "انذار",
      "إنذار",
      "إنذارات",
      "ايصال امانه",
      "إيصال أمانة",
      "وصل امانه",
      "وصل أمانة",
      "امانه",
      "أمانة",
      "شيك",
      "دين",
      "مديونية",
      "فاتورة"
    ])
  ) {
    return "claims-collections";
  }
  if (
    containsAny(text, [
      "real estate",
      "property",
      "lease",
      "landlord",
      "tenant",
      "sale contract",
      "purchase contract",
      "due diligence",
      "عقار",
      "عقاري",
      "شقة",
      "أرض",
      "ارض",
      "ايجار",
      "إيجار",
      "بيع",
      "شراء",
      "ملكية"
    ])
  ) {
    return "real-estate-legal-support";
  }
  if (
    containsAny(text, [
      "company formation",
      "contract drafting",
      "contract review",
      "governance",
      "compliance",
      "business dispute",
      "company",
      "corporate",
      "shareholder",
      "contract",
      "تأسيس شركة",
      "تاسيس شركة",
      "شركة",
      "شركات",
      "صياغة عقد",
      "صياغة العقود",
      "مراجعة عقد",
      "مراجعة العقود",
      "حوكمة",
      "امتثال",
      "نزاع تجاري",
      "منازعات تجارية",
      "عقد"
    ])
  ) {
    return "corporate-business-services";
  }
  if (
    containsAny(text, [
      "legal consultation",
      "criminal",
      "civil",
      "commercial legal",
      "family",
      "labor",
      "employment",
      "employee",
      "work",
      "litigation",
      "dispute",
      "court",
      "case",
      "complaint",
      "استشارة قانونية",
      "استشاره قانونيه",
      "جنائي",
      "جنائية",
      "مدني",
      "مدنية",
      "تجاري",
      "تجارية",
      "أسرة",
      "اسرة",
      "أسرية",
      "اسرية",
      "عمالي",
      "عمالية",
      "عمل",
      "موظف",
      "عامل",
      "نزاع",
      "قضية",
      "محكمة",
      "تقاضي",
      "محضر",
      "بلاغ",
      "جنحة",
      "تبديد"
    ])
  ) {
    return "legal-consultation";
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
  const normalized = normalizedAssistantText(value);
  if (
    serviceCategoryFromMessage(normalized) ||
    containsAny(normalized, ["مشكل", "ضريب", "دعوه", "دعوى", "محامي", "مخالف", "اتهام", "بلاغ", "محضر", "dispute", "tax", "lawyer", "claim"])
  ) {
    return false;
  }
  return value.split(/\s+/).length <= 5;
}

function isInvalidBookingFullName(value: string) {
  const normalized = normalizedAssistantText(value);
  if (!normalized) {
    return false;
  }
  if (isValidBookingPhone(value)) {
    return true;
  }
  if (
    containsAny(normalized, [
      "book consultation",
      "book appointment",
      "check reference",
      "corporate law",
      "litigation",
      "حجز استشارة",
      "حجز الموعد",
      "استعلام عن مرجع",
      "قانون الشركات",
      "التقاضي"
    ])
  ) {
    return true;
  }
  return Boolean(serviceCategoryFromMessage(normalized));
}

function isValidBookingPhone(value: string | null | undefined) {
  const phone = canonicalPhone(value);
  return Boolean(phone && phone.length >= 6);
}

function isAvailabilityOnlyMessage(value: string) {
  const text = value.trim();
  if (!text || text.length > 80 || /[@]/.test(text)) {
    return false;
  }
  const withoutDigits = toAsciiDigits(text).replace(/\d/g, "").trim();
  const hasPreference = hasAvailabilityPreference(availabilityPreferenceFromMessage(text));
  const hasAmbiguousAvailability = isAmbiguousAvailabilityMessage(text);
  return (hasPreference || hasAmbiguousAvailability) && withoutDigits.split(/\s+/).filter(Boolean).length <= 5;
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

function availabilityPreferenceFromMessage(message: string, current?: Partial<AvailabilityPreference>, now = new Date()): AvailabilityPreference {
  const text = normalizedAssistantText(message);
  const next = normalizeAvailabilityPreference(current);
  const date = availabilityDateFromMessage(text, now);
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

function availabilityDateFromMessage(text: string, now = new Date()) {
  const today = cairoDateString(now);
  const digitText = toAsciiDigits(text);
  if (containsAny(text, ["day after tomorrow", "after tomorrow", "بعد بكره", "بعد بكرة", "بعد غد", "بعد غدا", "بعد غدًا"])) {
    return { date: addCairoDays(today, 2), label: "day_after_tomorrow" };
  }
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

function isAmbiguousAvailabilityMessage(value: string) {
  const text = normalizedAssistantText(value);
  if (weekdayFromMessage(text) !== null) {
    return false;
  }
  return containsAny(text, ["next week", "coming week", "الاسبوع الجاي", "الأسبوع الجاي", "الاسبوع القادم", "الأسبوع القادم"]);
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
  readyToCheckout?: boolean;
  paymentReview?: ReturnType<typeof consultationPriceDto>;
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
    readyToCheckout: input.readyToCheckout ?? false,
    paymentReview: input.paymentReview,
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[input.locale]
  };
}

function bookingQuestionMessage(locale: "ar" | "en", field?: string) {
  const messages = {
    ar: {
      fullName: "تمام. اكتب اسمك الكامل كما تحب أن يظهر في طلب الاستشارة.",
      phone: "ما رقم الهاتف المناسب للتواصل معك؟",
      serviceCategory: "ما الخدمة الأقرب لطلبك؟ يمكنك كتابة استشارة قانونية، شركات وأعمال، عقارات، أو تحصيل وتسويات.",
      summary: `اكتب وصفًا قصيرًا لما تحتاجه من المكتب، ${BOOKING_SUMMARY_MIN_LENGTH} حرفًا على الأقل، بدون إرسال مستندات حساسة هنا.`,
      startsAt: "اختر موعدًا مناسبًا من المواعيد المتاحة داخل المحادثة.",
      fallback: `أستطيع تنظيم حجز الاستشارة فقط. اكتب الاسم والهاتف ووصفًا للمشكلة لا يقل عن ${BOOKING_SUMMARY_MIN_LENGTH} حرفًا والموعد المناسب إن وجد.`
    },
    en: {
      fullName: "Great. Please write your full name for the consultation request.",
      phone: "What phone number should the team use to contact you?",
      serviceCategory: "Which service is closest to your request? You can write legal consultation, corporate and business, real estate, or claims and collections.",
      summary: `Please write a short description of what you need from the office, at least ${BOOKING_SUMMARY_MIN_LENGTH} characters. Do not send sensitive documents here.`,
      startsAt: "Choose a suitable time from the available slots inside the chat.",
      fallback: `I can organize consultation booking only. Send your name, phone, a request description of at least ${BOOKING_SUMMARY_MIN_LENGTH} characters, and your preferred time if available.`
    }
  };

  return messages[locale][(field as keyof (typeof messages)["en"]) || "fallback"] ?? messages[locale].fallback;
}

function bookingFollowUpMessage(locale: "ar" | "en", field: string | undefined, latestMessage: string, mergeResult?: BookingMergeResult) {
  if (mergeResult?.aiUnavailable) {
    return bookingAiUnavailableMessage(locale);
  }
  if (mergeResult?.lowConfidence) {
    return mergeResult.clarifyingQuestion || unclearBookingFieldMessage(locale, field);
  }
  if (mergeResult?.clarifyingQuestion && field !== "startsAt") {
    return mergeResult.clarifyingQuestion;
  }
  if (shouldClarifyBookingField(field, latestMessage)) {
    return unclearBookingFieldMessage(locale, field);
  }
  return bookingQuestionMessage(locale, field);
}

function bookingAiUnavailableMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? `تعذر فهم الرسالة تلقائيًا الآن. اكتب البيانات في رسالة واحدة: الاسم، رقم الهاتف، وصف المشكلة ${BOOKING_SUMMARY_MIN_LENGTH} حرفًا على الأقل، والموعد المناسب إن وجد.`
    : `Automatic message understanding is unavailable right now. Send the details in one message: name, phone, a request description of at least ${BOOKING_SUMMARY_MIN_LENGTH} characters, and preferred time if available.`;
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
      ? "الإجابة مش واضحة بالنسبة لنوع الخدمة. اكتب الأقرب: استشارات حسب المجال، الشركات والعقود التجارية، مراجعة قانونية عقارية، أو المطالبات المالية والتسويات. لو الموضوع إيصال أمانة أو شيك أو مديونية، اختار المطالبات المالية والتسويات."
      : "I could not identify the service from that answer. Write the closest service: consultations by area, companies and commercial contracts, real estate legal review, or debt claims and settlement. For trust receipts, cheques, debt, or collections, choose debt claims and settlement.";
  }
  return locale === "ar" ? "الإجابة مش واضحة. من فضلك أعد كتابة المطلوب بشكل أبسط." : "That answer is not clear. Please write it again more simply.";
}

function availabilityQuestionMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "يناسبك أنهي يوم للاستشارة؟ اكتب النهارده، بكره، بعد بكره، يوم معين، أو فترة مثل بعد 3 أو الصبح."
    : "Which day works for the consultation: today, tomorrow, the day after tomorrow, a specific day, or a time window like after 3 or morning?";
}

function ambiguousAvailabilityQuestionMessage(locale: "ar" | "en") {
  return locale === "ar" ? "تقصد أي يوم في الأسبوع الجاي؟ اكتب اسم اليوم أو التاريخ المناسب." : "Which day next week do you mean? Write the weekday or date that works for you.";
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

function displayEmail(value: string | null | undefined, locale: "ar" | "en") {
  const email = value?.trim();
  if (email) {
    return email;
  }
  return locale === "ar" ? "غير مضاف" : "not provided";
}

function displayRequestArea(value: string | null | undefined, locale: "ar" | "en") {
  return serviceCategoryLabel(value || DEFAULT_ASSISTANT_SERVICE_CATEGORY, locale);
}

function displayRequestSummary(value: string | null | undefined, locale: "ar" | "en") {
  return truncateTeamText(value || (locale === "ar" ? "لم يتم إدخال ملخص واضح" : "No clear summary was provided"), 180);
}

function bookingConfirmMessage(locale: "ar" | "en", draft: ReturnType<typeof mergeBookingDraft>, selectedSlot: string, requiresPayment: boolean) {
  const when = formatAssistantDate(selectedSlot, locale);
  const summary = displayRequestSummary(draft.summary, locale);
  const area = displayRequestArea(draft.serviceCategory, locale);
  const email = displayEmail(draft.email, locale);
  if (locale === "ar") {
    const action = requiresPayment ? "اضغط تأكيد الحجز لعرض رسوم الحجز قبل الدفع." : "اضغط تأكيد الحجز لتثبيت الموعد وإظهار رقم المرجع.";
    return `سأراجع الحجز بهذه البيانات: الاسم: ${draft.fullName}، الهاتف: ${draft.phone}، البريد الإلكتروني: ${email}، طريقة الاستشارة: ${modeLabel(draft.preferredMode, locale)}، الموعد: ${when}، المسار المبدئي: ${area}. ملخص طلب العميل: ${summary}. ${action}`;
  }
  const action = requiresPayment ? "Confirm to review the booking fee before payment." : "Confirm to book the appointment and show your reference.";
  return `I will review the consultation with these details: name: ${draft.fullName}, phone: ${draft.phone}, email: ${email}, consultation mode: ${modeLabel(draft.preferredMode, locale)}, appointment: ${when}, initial area: ${area}. Client request summary: ${summary}. ${action}`;
}

function bookingPaymentReviewMessage(
  locale: "ar" | "en",
  body: PublicConsultationAssistantInput,
  startsAt: Date,
  amount: string,
  currency: string
) {
  const when = formatAssistantDate(startsAt.toISOString(), locale);
  const summary = displayRequestSummary(body.summary, locale);
  const area = displayRequestArea(body.serviceCategory, locale);
  const email = displayEmail(body.email, locale);
  if (locale === "ar") {
    return `مراجعة الدفع: الاسم: ${body.fullName}، الهاتف: ${body.phone}، البريد الإلكتروني: ${email}، طريقة الاستشارة: ${modeLabel(body.preferredMode, locale)}، الموعد: ${when}، المسار المبدئي: ${area}. ملخص طلب العميل: ${summary}. رسوم حجز الاستشارة ${amount} ${currency}. سيتم حجز الموعد مؤقتًا لمدة محدودة بعد الضغط على الدفع، ولن يتم تأكيد الموعد إلا بعد إشعار دفع موثوق من بوابة الدفع.`;
  }
  return `Payment review: name: ${body.fullName}, phone: ${body.phone}, email: ${email}, consultation mode: ${modeLabel(body.preferredMode, locale)}, appointment: ${when}, initial area: ${area}. Client request summary: ${summary}. Consultation booking fee is ${amount} ${currency}. The slot is reserved for a limited time after payment starts, and the appointment is confirmed only after a trusted payment webhook.`;
}

function checkoutCreatedMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "تم حجز الموعد مؤقتًا وإنشاء رابط الدفع. سيتم تأكيد الموعد فقط بعد وصول إشعار دفع موثوق."
    : "The slot is temporarily reserved and the payment link is ready. The appointment is confirmed only after a trusted payment webhook.";
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
    ar: {
      "legal-consultation": "استشارات حسب المجال",
      "corporate-business-services": "الشركات والعقود التجارية",
      "real-estate-legal-support": "مراجعة قانونية عقارية",
      "claims-collections": "المطالبات المالية والتسويات",
      corporate: "شركات وعقود",
      disputes: "نزاعات وتقاضي",
      "real-estate": "عقارات",
      employment: "عمل وامتثال"
    },
    en: {
      "legal-consultation": "legal consultation",
      "corporate-business-services": "corporate and business services",
      "real-estate-legal-support": "real estate legal support",
      "claims-collections": "claims and collections",
      corporate: "corporate and contracts",
      disputes: "litigation and disputes",
      "real-estate": "real estate",
      employment: "employment"
    }
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
    missingFields: ["fullName", "phone", "summary"],
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

function assistantServiceCategory(value?: string | null) {
  return value?.trim() || DEFAULT_ASSISTANT_SERVICE_CATEGORY;
}

function withAssistantBookingDefaults(body: PublicConsultationAssistantInput): PublicConsultationAssistantInput {
  return {
    ...body,
    serviceCategory: assistantServiceCategory(body.serviceCategory)
  };
}

async function prepareConsultationPaymentReview(input: {
  body: PublicConsultationAssistantInput;
  requestId: string;
}) {
  const body = withAssistantBookingDefaults(input.body);
  const missing = requiredBookingFields(body);
  if (missing.length) {
    return {
      action: "collect_booking_fields" as const,
      message: missingFieldsMessage(body.locale, missing),
      missingFields: missing,
      reviewRequired: true,
      disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
      ai: deterministicAssistantMetadata(input.requestId)
    };
  }
  if (body.consent !== true) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client consent is required before booking a consultation appointment.");
  }

  const startsAt = parseBookingDate(body.startsAt!);
  const slot = await assertPublicConsultationSlotAvailable({
    startsAt,
    mode: body.preferredMode
  });
  const endsAt = new Date(slot.endsAt);
  await assertNoBookingDuplicate(body);
  await assertNoSlotConflict(startsAt, endsAt);
  const price = await resolveConsultationPrice({
    serviceCategory: body.serviceCategory!,
    mode: body.preferredMode
  });

  return bookingConversationResponse({
    locale: body.locale,
    draft: normalizeBookingDraft(body),
    missingFields: [],
    selectedSlot: body.startsAt,
    readyToCheckout: true,
    paymentReview: consultationPriceDto(price),
    message: bookingPaymentReviewMessage(body.locale, body, startsAt, price.amountText, price.currency)
  });
}

export async function createPublicConsultationCheckout(input: {
  body: unknown;
  request: Request;
  requestId: string;
}) {
  const body = parseWithSchema(publicConsultationCheckoutSchema, input.body, "Consultation checkout payload is invalid.");
  const draft = normalizeBookingDraft({
    ...mergeBookingDraft(body),
    startsAt: body.selectedSlot || body.startsAt || body.draft?.startsAt || ""
  });
  const limitKey = getIpAddress(input.request) ?? canonicalPhone(draft.phone || "") ?? "anonymous";
  enforceRateLimit(rateLimiters.booking, `public-consultation-checkout:${limitKey}`);
  const checkoutBody = {
    ...body,
    ...draft,
    serviceCategory: assistantServiceCategory(draft.serviceCategory || body.serviceCategory),
    startsAt: body.selectedSlot || draft.startsAt,
    consent: true
  };
  const missing = requiredBookingFields(checkoutBody);
  if (missing.length) {
    throw new ApiError(400, "VALIDATION_ERROR", missingFieldsMessage(body.locale, missing));
  }
  if (body.consent !== true) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client consent is required before payment checkout.");
  }

  const startsAt = parseBookingDate(checkoutBody.startsAt!);
  const slot = await assertPublicConsultationSlotAvailable({
    startsAt,
    mode: checkoutBody.preferredMode
  });
  const endsAt = new Date(slot.endsAt);
  await assertNoBookingDuplicate(checkoutBody);
  await assertNoSlotConflict(startsAt, endsAt);
  const price = await resolveConsultationPrice({
    serviceCategory: checkoutBody.serviceCategory!,
    mode: checkoutBody.preferredMode
  });

  const phoneCanonical = canonicalPhone(checkoutBody.phone!);
  const result = await runConsultationBookingTransaction(async (tx) => {
    await assertNoBookingDuplicate(checkoutBody, tx);
    await assertNoSlotConflict(startsAt, endsAt, tx);
    const client = await upsertAssistantClient(tx, checkoutBody, phoneCanonical);
    const consultation = await tx.consultationRequest.create({
      data: {
        clientId: client.id,
        fullName: checkoutBody.fullName!,
        phone: checkoutBody.phone!,
        phoneCanonical,
        email: checkoutBody.email || null,
        city: checkoutBody.city || null,
        serviceCategory: checkoutBody.serviceCategory!,
        summary: checkoutBody.summary!,
        opposingPartyName: checkoutBody.opposingPartyName || null,
        urgency: checkoutBody.urgency,
        preferredMode: checkoutBody.preferredMode,
        status: "PAYMENT_PENDING",
        aiClassification: deterministicBookingClassification(checkoutBody, startsAt, input.requestId),
        aiSummary: deterministicBookingSummary(checkoutBody, startsAt)
      }
    });

    const appointment = await tx.appointment.create({
      data: {
        clientId: client.id,
        consultationRequestId: consultation.id,
        title: appointmentTitle(body.locale, consultation.id),
        type: "CONSULTATION",
        mode: checkoutBody.preferredMode,
        startsAt,
        endsAt,
        status: "RESERVED",
        notes: "Reserved pending trusted payment webhook confirmation."
      }
    });

    const attempt = await createConsultationPaymentAttempt({
      tx,
      client,
      consultationRequest: consultation,
      appointment: {
        id: appointment.id,
        title: appointment.title,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        mode: checkoutBody.preferredMode
      },
      price,
      request: input.request,
      locale: body.locale
    });

    return { client, consultation, appointment, attempt };
  });

  await appendAuditLogBestEffort({
    actorId: null,
    action: "consultation.checkout_reserved",
    resourceType: "PaymentAttempt",
    resourceId: result.attempt.id,
    clientId: result.client.id,
    appointmentId: result.appointment.id,
    metadata: {
      consultationRequestId: result.consultation.id,
      reference: publicConsultationReference(result.consultation.id),
      serviceCategory: result.consultation.serviceCategory,
      urgency: result.consultation.urgency,
      mode: result.appointment.mode,
      startsAt: result.appointment.startsAt.toISOString(),
      paymentAttemptId: result.attempt.id,
      amount: result.attempt.amount.toString(),
      currency: result.attempt.currency,
      source: "public-assistant"
    },
    request: input.request,
    requestId: input.requestId
  });

  return {
    action: "checkout_created" as const,
    message: checkoutCreatedMessage(body.locale),
    reference: publicConsultationReference(result.consultation.id),
    appointment: appointmentDto(result.appointment),
    paymentAttempt: {
      id: result.attempt.id,
      status: result.attempt.status,
      amount: result.attempt.amount.toString(),
      currency: result.attempt.currency,
      checkoutUrl: result.attempt.checkoutUrl,
      expiresAt: result.attempt.expiresAt.toISOString()
    },
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
    ai: deterministicAssistantMetadata(input.requestId)
  };
}

async function createFreeConsultationBooking(input: {
  body: PublicConsultationAssistantInput;
  request: Request;
  requestId: string;
}) {
  const body = withAssistantBookingDefaults(input.body);
  const missing = requiredBookingFields(body);
  if (missing.length) {
    return {
      action: "collect_booking_fields" as const,
      message: missingFieldsMessage(body.locale, missing),
      missingFields: missing,
      reviewRequired: true,
      disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
      ai: deterministicAssistantMetadata(input.requestId)
    };
  }
  if (body.consent !== true) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client consent is required before booking a consultation appointment.");
  }

  const startsAt = parseBookingDate(body.startsAt!);
  const slot = await assertPublicConsultationSlotAvailable({
    startsAt,
    mode: body.preferredMode
  });
  const endsAt = new Date(slot.endsAt);
  await assertNoBookingDuplicate(body);
  await assertNoSlotConflict(startsAt, endsAt);

  const phoneCanonical = canonicalPhone(body.phone!);
  const result = await runConsultationBookingTransaction(async (tx) => {
    await assertNoBookingDuplicate(body, tx);
    await assertNoSlotConflict(startsAt, endsAt, tx);
    const client = await upsertAssistantClient(tx, body, phoneCanonical);
    const consultation = await tx.consultationRequest.create({
      data: {
        clientId: client.id,
        fullName: body.fullName!,
        phone: body.phone!,
        phoneCanonical,
        email: body.email || null,
        city: body.city || null,
        serviceCategory: body.serviceCategory!,
        summary: body.summary!,
        opposingPartyName: body.opposingPartyName || null,
        urgency: body.urgency,
        preferredMode: body.preferredMode,
        status: "SCHEDULED",
        aiClassification: deterministicBookingClassification(body, startsAt, input.requestId),
        aiSummary: deterministicBookingSummary(body, startsAt)
      }
    });

    const appointment = await tx.appointment.create({
      data: {
        clientId: client.id,
        consultationRequestId: consultation.id,
        title: appointmentTitle(body.locale, consultation.id),
        type: "CONSULTATION",
        mode: body.preferredMode,
        startsAt,
        endsAt,
        status: "SCHEDULED",
        notes: "Confirmed from public assistant without payment because booking fee is disabled."
      }
    });

    await createConsultationReviewNotifications({
      client: tx,
      consultationId: consultation.id
    });

    return { client, consultation, appointment };
  });

  await appendAuditLogBestEffort({
    actorId: null,
    action: "consultation.ai_chat_free_booked",
    resourceType: "ConsultationRequest",
    resourceId: result.consultation.id,
    clientId: result.client.id,
    appointmentId: result.appointment.id,
    metadata: {
      reference: publicConsultationReference(result.consultation.id),
      serviceCategory: result.consultation.serviceCategory,
      urgency: result.consultation.urgency,
      mode: result.appointment.mode,
      startsAt: result.appointment.startsAt.toISOString(),
      source: "public-assistant",
      paymentEnabled: false
    },
    request: input.request,
    requestId: input.requestId
  });

  return {
    action: "booking_confirmed" as const,
    message: bookedMessage(body.locale, body),
    reference: publicConsultationReference(result.consultation.id),
    appointment: appointmentDto(result.appointment),
    clientAccountSetup: publicClientAccountSetupTarget({
      client: result.client,
      consultationId: result.consultation.id,
      request: input.request
    }),
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
    ai: deterministicAssistantMetadata(input.requestId)
  };
}

async function publicAppointmentInquiry(input: {
  body: PublicConsultationAssistantInput;
  requestId: string;
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
    reviewRequired: true,
    disclaimer: AI_REVIEW_DISCLAIMER[input.body.locale],
    ai: deterministicAssistantMetadata(input.requestId)
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
  if (!body.fullName || isInvalidBookingFullName(body.fullName)) missing.push("fullName");
  if (!body.phone || !isValidBookingPhone(body.phone)) missing.push("phone");
  if (!isInformativeBookingSummary(body.summary)) missing.push("summary");
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

export function publicBookingSlotConfirmationError(locale: "ar" | "en", selectedSlot: string, now = new Date()) {
  const parsed = new Date(selectedSlot);
  if (!selectedSlot || Number.isNaN(parsed.getTime())) {
    return locale === "ar"
      ? "الموعد المختار غير واضح. اكتب اليوم أو الفترة المناسبة لك وسأعرض المواعيد المتاحة."
      : "The selected appointment time is not clear. Write the day or time window that works for you and I will show available slots.";
  }
  if (parsed <= now) {
    return recoveredSlotSelectionMessage(locale, false);
  }
  return "";
}

async function recoverBookingSlotSelection(input: {
  locale: "ar" | "en";
  draft: ReturnType<typeof mergeBookingDraft>;
  message: string;
}) {
  const nextDraft = normalizeBookingDraft({ ...input.draft, startsAt: "" });
  const hasPreference = hasAvailabilityPreference(nextDraft.availabilityPreference);
  const requestedSlots = hasPreference
    ? await listPublicConsultationSlots({
        mode: nextDraft.preferredMode,
        limit: 12,
        date: nextDraft.availabilityPreference.date || undefined,
        fromTime: nextDraft.availabilityPreference.fromTime || undefined,
        toTime: nextDraft.availabilityPreference.toTime || undefined
      })
    : [];
  const fallbackSlots = requestedSlots.length ? undefined : await listPublicConsultationSlots({ mode: nextDraft.preferredMode, limit: 6 });
  const slots = requestedSlots.length ? requestedSlots : fallbackSlots;

  return bookingConversationResponse({
    locale: input.locale,
    draft: nextDraft,
    missingFields: ["startsAt"],
    selectedSlot: "",
    availableSlots: slots,
    slotWindow: availabilityWindowDto(nextDraft.availabilityPreference, !requestedSlots.length && Boolean(fallbackSlots?.length)),
    message: slots?.length ? input.message : recoveredSlotSelectionMessage(input.locale, false)
  });
}

function isRecoverableBookingSlotError(error: unknown) {
  return (
    error instanceof ApiError &&
    [
      "Appointment date is invalid.",
      "Appointment date must be in the future.",
      "This consultation slot is no longer available. Please choose another time.",
      "This consultation slot is already booked."
    ].includes(error.message)
  );
}

function isDuplicateBookingError(error: unknown) {
  return error instanceof ApiError && error.message === "A scheduled consultation already exists for this contact and service area.";
}

function recoveredSlotSelectionMessage(locale: "ar" | "en", hasAlternatives: boolean) {
  if (hasAlternatives) {
    return locale === "ar"
      ? "الموعد ده لم يعد متاحًا. اختر موعدًا جديدًا من أقرب المواعيد المتاحة بالأسفل، وبعدها سأعرض ملخص الحجز للتأكيد."
      : "That time is no longer available. Choose one of the latest available times below, then I will show the booking summary again.";
  }
  return locale === "ar"
    ? "الموعد ده لم يعد متاحًا. اكتب يوم أو فترة مناسبة لك وسأفحص المواعيد المتاحة من جديد."
    : "That time is no longer available. Write another day or time window and I will check availability again.";
}

function duplicateBookingConversationMessage(locale: "ar" | "en") {
  return locale === "ar"
    ? "يوجد بالفعل حجز استشارة مجدول لنفس رقم الهاتف خلال الفترة الحالية. استخدم استعلام برقم المرجع لو معك المرجع، أو انتظر مراجعة فريق المكتب."
    : "A scheduled consultation already exists for this phone in the current period. Use Check reference if you have the reference, or wait for the office team review.";
}

async function assertNoSlotConflict(startsAt: Date, endsAt: Date, client: Pick<typeof prisma, "appointment"> = prisma) {
  const conflict = await client.appointment.findFirst({
    where: {
      type: "CONSULTATION",
      status: { in: ["RESERVED", "SCHEDULED", "RESCHEDULED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    },
    select: { id: true }
  });

  if (conflict) {
    throw new ApiError(409, "CONFLICT", "This consultation slot is already booked.");
  }
}

async function assertNoBookingDuplicate(body: PublicConsultationAssistantInput, client: Pick<typeof prisma, "consultationRequest"> = prisma) {
  const phoneCanonical = canonicalPhone(body.phone || "");
  const contactFilters: Prisma.ConsultationRequestWhereInput[] = [phoneCanonical ? { phoneCanonical } : { phone: body.phone! }];
  if (body.email) {
    contactFilters.push({ email: body.email });
  }

  const now = new Date();
  const recentDuplicate = await client.consultationRequest.findFirst({
    where: {
      createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      AND: [
        { OR: contactFilters },
        {
          OR: [
            { status: "SCHEDULED" },
            {
              status: "PAYMENT_PENDING",
              paymentAttempts: {
                some: {
                  status: { in: ["CREATED", "PENDING"] },
                  expiresAt: { gt: now }
                }
              }
            }
          ]
        }
      ]
    },
    select: { id: true }
  });

  if (recentDuplicate) {
    throw new ApiError(409, "CONFLICT", "A scheduled consultation already exists for this contact and service area.");
  }
}

async function runConsultationBookingTransaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (isPrismaTransactionConflict(error)) {
      throw new ApiError(409, "CONFLICT", "This consultation slot is already booked.");
    }
    throw error;
  }
}

function isPrismaTransactionConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
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

function bookedMessage(locale: "ar" | "en", body?: PublicConsultationAssistantInput) {
  const base = locale === "ar"
    ? "تم حجز موعد الاستشارة. استخدم رقم المرجع للاستعلام عن الموعد."
    : "The consultation appointment has been booked. Use the reference to inquire about the appointment.";
  if (!body) {
    return base;
  }
  const email = displayEmail(body.email, locale);
  const area = displayRequestArea(body.serviceCategory, locale);
  const summary = displayRequestSummary(body.summary, locale);
  return locale === "ar"
    ? `${base} بيانات الطلب المحفوظة: البريد الإلكتروني: ${email}، المسار المبدئي: ${area}. ملخص طلب العميل: ${summary}.`
    : `${base} Saved request details: email: ${email}, initial area: ${area}. Client request summary: ${summary}.`;
}

function missingFieldsMessage(locale: "ar" | "en", fields: string[]) {
  const labels = fields.map((field) => bookingFieldLabel(locale, field)).join(locale === "ar" ? "، " : ", ");
  return locale === "ar"
    ? `أحتاج هذه البيانات قبل الحجز: ${labels}.`
    : `I need these details before booking: ${labels}.`;
}

function bookingFieldLabel(locale: "ar" | "en", field: string) {
  const labels = {
    ar: {
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف",
      summary: `وصف الطلب ${BOOKING_SUMMARY_MIN_LENGTH} حرفًا على الأقل`,
      startsAt: "الموعد المناسب"
    },
    en: {
      fullName: "full name",
      phone: "phone number",
      summary: `request description of at least ${BOOKING_SUMMARY_MIN_LENGTH} characters`,
      startsAt: "appointment time"
    }
  };
  return labels[locale][field as keyof (typeof labels)["en"]] ?? field;
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

function deterministicAssistantMetadata(requestId: string) {
  return {
    provider: "system",
    model: "kmt-booking-rules-v1",
    requestId,
    latencyMs: 0
  };
}

function deterministicBookingClassification(body: PublicConsultationAssistantInput, startsAt: Date, requestId: string) {
  return {
    assistantAction: "book_consultation_appointment",
    category: body.serviceCategory || "unspecified",
    urgency: body.urgency,
    preferredMode: body.preferredMode,
    reasons: [
      `تصنيف داخلي مبدئي فقط: ${teamServiceCategoryLabel(body.serviceCategory)}.`,
      `نص طلب العميل كما وصل: ${truncateTeamText(body.summary || "غير محدد", 350)}.`,
      `طريقة التواصل المطلوبة: ${teamModeLabel(body.preferredMode)}.`,
      `الموعد المختار من مواعيد السكرتارية المتاحة: ${formatTeamDateTime(startsAt)}.`
    ],
    reviewNote: "هذا ملخص تنظيمي للفريق فقط. يجب مراجعة الطلب والتواصل مع العميل قبل أي توجيه قانوني أو تعيين محامي.",
    reviewRequired: true,
    requestId,
    source: "deterministic_booking_rules"
  };
}

export function deterministicBookingSummary(body: PublicConsultationAssistantInput, startsAt: Date) {
  const contactParts = [
    `الهاتف: ${body.phone || "غير محدد"}`,
    body.email ? `البريد: ${body.email}` : "",
    body.city ? `المدينة: ${body.city}` : ""
  ].filter(Boolean);
  const opposingParty = body.opposingPartyName ? `\nالطرف المقابل المذكور: ${body.opposingPartyName}.` : "";

  return [
    `ملخص للفريق: ${body.fullName || "عميل غير محدد"} طلب استشارة من خلال شات الحجز العام. التصنيف الداخلي المبدئي: ${teamServiceCategoryLabel(body.serviceCategory)}.`,
    `طلب العميل كما وصل: ${truncateTeamText(body.summary || "لم يتم إدخال ملخص واضح.", 700)}${opposingParty}`,
    `بيانات التواصل: ${contactParts.join("، ")}.`,
    `التفضيلات: ${teamModeLabel(body.preferredMode)}، أولوية ${teamUrgencyLabel(body.urgency)}، الموعد المختار ${formatTeamDateTime(startsAt)}.`,
    "الإجراء المطلوب: مراجعة الطلب، تأكيد الملاءمة مع العميل، ثم تعيين محامي مناسب قبل أي إجراء أو توجيه قانوني."
  ].join("\n");
}

function teamServiceCategoryLabel(value?: string | null) {
  const labels: Record<string, string> = {
    "legal-consultation": "استشارات حسب المجال",
    "corporate-business-services": "الشركات والعقود التجارية",
    "real-estate-legal-support": "مراجعة قانونية عقارية",
    "claims-collections": "المطالبات المالية والتسويات",
    corporate: "الشركات والعقود",
    disputes: "المنازعات والتقاضي",
    "real-estate": "العقارات",
    employment: "العمل"
  };
  return value ? labels[value] ?? value : "غير محدد";
}

function teamUrgencyLabel(value?: string | null) {
  const labels: Record<string, string> = {
    LOW: "منخفضة",
    NORMAL: "عادية",
    HIGH: "مرتفعة",
    URGENT: "عاجلة"
  };
  return value ? labels[value] ?? value : "عادية";
}

function teamModeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    PHONE: "هاتف",
    ONLINE: "أونلاين",
    OFFICE: "في المكتب"
  };
  return value ? labels[value] ?? value : "أونلاين";
}

function formatTeamDateTime(value: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: OFFICE_TIMEZONE
  }).format(value);
}

function truncateTeamText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}
