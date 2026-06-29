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

  const publicAction = requestedPublicAction(body);
  if (!publicAction) {
    return scopedPublicAssistantReply(body.locale, isLegalAdviceRequest(body.message));
  }

  const ai = await runAssistantAI({
    locale: body.locale,
    body,
    actorId: null,
    requestId: input.requestId
  });

  const action = publicAction;

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

function requestedPublicAction(body: PublicConsultationAssistantInput) {
  if (body.intent === "book_consultation_appointment" || hasBookingFields(body)) {
    return "book_consultation_appointment" as const;
  }
  if (body.intent === "appointment_inquiry" || body.reference) {
    return "appointment_inquiry" as const;
  }
  return null;
}

function hasBookingFields(body: PublicConsultationAssistantInput) {
  return Boolean(body.fullName && body.phone && body.serviceCategory && body.summary && body.startsAt);
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
