import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AI_REVIEW_DISCLAIMER, consultationAssistantOutputSchema, generateStructured } from "@/server/ai";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { getIpAddress } from "@/server/auth/session-store";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema, parseWithSchema } from "@/server/validation/schemas";
import { publicConsultationReference } from "./consultation-service";

const DEFAULT_DURATION_MINUTES = 60;
const OFFICE_TIMEZONE = "Africa/Cairo";
const BOOKABLE_WEEKDAYS = new Set(["Sun", "Mon", "Tue", "Wed", "Thu"]);

const assistantActionSchema = z.enum([
  "answer_general",
  "collect_booking_fields",
  "book_consultation_appointment",
  "appointment_inquiry",
  "handoff_to_human"
]);

export const publicConsultationAssistantSchema = z.object({
  locale: z.enum(["ar", "en"]).default("ar"),
  message: z.string().trim().min(1).max(2000),
  intent: assistantActionSchema.optional(),
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

  const ai = await runAssistantAI({
    locale: body.locale,
    body,
    actorId: null,
    requestId: input.requestId
  });

  const action = requestedAction(body, ai.output.action);

  if (action === "book_consultation_appointment") {
    return bookConsultationAppointment({ body, ai, request: input.request, requestId: input.requestId });
  }

  if (action === "appointment_inquiry") {
    return publicAppointmentInquiry({ body, ai });
  }

  return {
    action,
    message: ai.output.message,
    missingFields: ai.output.missingFields,
    reviewRequired: ai.reviewRequired,
    disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
    ai: aiMetadata(ai)
  };
}

export async function handleClientConsultationAssistant(input: { actor: Principal; body: unknown; requestId: string }) {
  const body = parseWithSchema(clientConsultationAssistantSchema, input.body, "Client assistant payload is invalid.");
  if (!input.actor.clientId) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client portal access is required.");
  }

  enforceRateLimit(rateLimiters.ai, `client-consultation-assistant:${input.actor.id}`);
  const ai = await runAssistantAI({
    locale: body.locale,
    body,
    actorId: input.actor.id,
    requestId: input.requestId
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      clientId: input.actor.clientId,
      type: "CONSULTATION",
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
      startsAt: { gte: new Date() }
    },
    include: {
      lawyer: { select: { id: true, name: true } },
      case: { select: { id: true, internalFileNumber: true, title: true } }
    },
    orderBy: { startsAt: "asc" },
    take: 10
  });

  return {
    action: "appointment_inquiry" as const,
    message: appointments.length ? clientMessage(body.locale, "appointments_found") : clientMessage(body.locale, "appointments_empty"),
    appointments: appointments.map(appointmentDto),
    reviewRequired: ai.reviewRequired,
    disclaimer: AI_REVIEW_DISCLAIMER[body.locale],
    ai: aiMetadata(ai)
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

function requestedAction(body: PublicConsultationAssistantInput, aiAction: z.infer<typeof assistantActionSchema>) {
  if (body.intent === "book_consultation_appointment" || hasBookingFields(body)) {
    return "book_consultation_appointment" as const;
  }
  if (body.intent === "appointment_inquiry" || body.reference) {
    return "appointment_inquiry" as const;
  }
  return aiAction;
}

function hasBookingFields(body: PublicConsultationAssistantInput) {
  return Boolean(body.fullName && body.phone && body.serviceCategory && body.summary && body.startsAt);
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
  const endsAt = new Date(startsAt.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  assertBookableOfficeSlot(startsAt, endsAt);
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

function assertBookableOfficeSlot(startsAt: Date, endsAt: Date) {
  const start = cairoDateParts(startsAt);
  const end = cairoDateParts(endsAt);
  if (
    !BOOKABLE_WEEKDAYS.has(start.weekday) ||
    start.hour < 10 ||
    start.hour >= 17 ||
    end.hour > 17 ||
    (end.hour === 17 && end.minute > 0)
  ) {
    throw new ApiError(409, "CONFLICT", "Consultation appointments are available Sunday-Thursday, 10:00-17:00 Africa/Cairo.");
  }
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

function cairoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OFFICE_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    hour: Number(value("hour")),
    minute: Number(value("minute"))
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
