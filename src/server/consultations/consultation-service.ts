import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AI_REVIEW_DISCLAIMER, consultationClassificationOutputSchema, generateStructured, intakeSummaryOutputSchema } from "@/server/ai";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { getIpAddress } from "@/server/auth/session-store";
import { prisma } from "@/server/db/prisma";
import { sendTemplatedEmail } from "@/server/email";
import { ApiError } from "@/server/http/errors";
import { captureAnalyticsEventBestEffort } from "@/server/observability/analytics-service";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema } from "@/server/validation/schemas";

type EmailDeliveryMode = "disabled" | "dev" | "smtp";
type EmailDeliveryOutcome = "sent" | "queued" | "failed" | "skipped";

export const publicConsultationRequestSchema = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  serviceCategory: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(20).max(3000),
  opposingPartyName: z.string().trim().max(160).optional().or(z.literal("")),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  preferredMode: z.enum(["PHONE", "ONLINE", "OFFICE"]),
  consent: z.literal(true)
});

export type PublicConsultationRequestInput = z.infer<typeof publicConsultationRequestSchema>;

export type ConsultationOrganizerResult = {
  status: "ready" | "unavailable" | "manual_review";
  classification: z.infer<typeof consultationClassificationOutputSchema> | null;
  intakeSummary: z.infer<typeof intakeSummaryOutputSchema> | null;
  reviewRequired: true;
  disclaimer: string;
};

export async function createPublicConsultation(input: {
  body: PublicConsultationRequestInput;
  request: Request;
  requestId: string;
  organizerMode?: "ai" | "manual";
}) {
  const phoneCanonical = canonicalPhone(input.body.phone);
  const phoneWhere: Prisma.ConsultationRequestWhereInput = phoneCanonical
    ? { OR: [{ phoneCanonical }, { phone: input.body.phone }] }
    : { phone: input.body.phone };
  const duplicate = await prisma.consultationRequest.findFirst({
    where: {
      ...phoneWhere,
      serviceCategory: input.body.serviceCategory,
      status: { in: ["NEW", "REVIEWING", "SCHEDULED"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    },
    select: { id: true, createdAt: true }
  });

  if (duplicate) {
    throw new ApiError(
      409,
      "CONFLICT",
      "A recent consultation request already exists for the same phone number and area. Please wait for the team review or contact us."
    );
  }

  const organizer =
    input.organizerMode === "manual"
      ? manualReviewOrganizer(input.body)
      : await organizeConsultation(input.body, input.requestId, getIpAddress(input.request) ?? phoneCanonical ?? input.body.phone);

  const consultation = await prisma.consultationRequest.create({
    data: {
      fullName: input.body.fullName,
      phone: input.body.phone,
      phoneCanonical,
      email: input.body.email || null,
      city: input.body.city || null,
      serviceCategory: input.body.serviceCategory,
      summary: input.body.summary,
      opposingPartyName: input.body.opposingPartyName || null,
      urgency: input.body.urgency,
      preferredMode: input.body.preferredMode,
      status: "NEW",
      aiClassification: organizer.classification ? (organizer.classification as Prisma.InputJsonValue) : Prisma.JsonNull,
      aiSummary: organizer.intakeSummary?.summary ?? null
    }
  });

  const reference = publicConsultationReference(consultation.id);
  const emailDelivery = await sendConsultationEmails(input.body, reference);

  await appendAuditLogBestEffort({
    actorId: null,
    action: "consultation.create_public",
    resourceType: "ConsultationRequest",
    resourceId: consultation.id,
    metadata: {
      serviceCategory: consultation.serviceCategory,
      locale: input.body.locale,
      urgency: consultation.urgency,
      preferredMode: consultation.preferredMode,
      organizerStatus: organizer.status,
      emailDelivery
    },
    request: input.request,
    requestId: input.requestId
  });

  captureAnalyticsEventBestEffort({
    name: "consultation.submitted",
    source: "PUBLIC",
    outcome: "SUCCESS",
    requestId: input.requestId,
    properties: {
      serviceCategory: consultation.serviceCategory,
      locale: input.body.locale,
      urgency: consultation.urgency,
      preferredMode: consultation.preferredMode,
      organizerStatus: organizer.status,
      clientEmailDelivery: emailDelivery.clientConfirmation,
      staffEmailDelivery: emailDelivery.staffNotification
    }
  });

  return {
    id: consultation.id,
    reference,
    status: consultation.status,
    organizer,
    emailDelivery
  };
}

function manualReviewOrganizer(body: PublicConsultationRequestInput): ConsultationOrganizerResult {
  return {
    status: "manual_review",
    classification: {
      category: body.serviceCategory,
      urgency: body.urgency.toLowerCase() as "low" | "normal" | "high" | "urgent",
      confidence: 1,
      reasons: ["Submitted through the manual office review form."],
      reviewNote: "Manual office review is required before any legal direction or appointment confirmation."
    },
    intakeSummary: {
      summary: body.summary,
      keyFacts: [],
      missingInfo: [],
      reviewNote: "The office team should review the request and contact the client."
    },
    reviewRequired: true,
    disclaimer:
      body.locale === "ar"
        ? "تم حفظ الطلب للمراجعة المكتبية فقط. لا يتم تأكيد موعد أو تقديم استشارة قانونية نهائية من هذا النموذج."
        : "The request was saved for office review only. This form does not confirm an appointment or provide final legal advice."
  };
}

export async function organizeConsultation(body: PublicConsultationRequestInput, requestId: string, aiLimitKey?: string): Promise<ConsultationOrganizerResult> {
  try {
    if (aiLimitKey) {
      enforceRateLimit(rateLimiters.ai, `consultation:${aiLimitKey}`);
    }

    const [classification, intakeSummary] = await Promise.all([
      generateStructured({
        task: "consultation_classification",
        locale: body.locale,
        input: {
          serviceCategory: body.serviceCategory,
          summary: body.summary,
          urgency: body.urgency,
          preferredMode: body.preferredMode
        },
        schema: consultationClassificationOutputSchema,
        requestId
      }),
      generateStructured({
        task: "intake_summary",
        locale: body.locale,
        input: {
          summary: body.summary,
          serviceCategory: body.serviceCategory
        },
        schema: intakeSummaryOutputSchema,
        requestId
      })
    ]);

    return {
      status: "ready",
      classification: classification.output,
      intakeSummary: intakeSummary.output,
      reviewRequired: true,
      disclaimer: AI_REVIEW_DISCLAIMER[body.locale]
    };
  } catch {
    return {
      status: "unavailable",
      classification: null,
      intakeSummary: null,
      reviewRequired: true,
      disclaimer: AI_REVIEW_DISCLAIMER[body.locale]
    };
  }
}

export function publicConsultationReference(id: string) {
  return `CONS-${id.slice(0, 8).toUpperCase()}`;
}

async function sendConsultationEmails(body: PublicConsultationRequestInput, reference: string) {
  const result = {
    clientConfirmation: "skipped" as EmailDeliveryOutcome,
    staffNotification: "skipped" as EmailDeliveryOutcome
  };

  if (body.email) {
    try {
      const delivery = await sendTemplatedEmail({
        to: { email: body.email },
        templateKey: "consultation_confirmation",
        data: { fullName: body.fullName, reference }
      });
      result.clientConfirmation = emailDeliveryOutcome(delivery.mode);
    } catch {
      result.clientConfirmation = "failed";
    }
  }

  try {
    const delivery = await sendTemplatedEmail({
      to: { email: process.env.SMTP_FROM || "booking@kmtlegal.com" },
      templateKey: "staff_notification",
      data: {
        title: `طلب استشارة جديد ${reference}`,
        summary: `المجال: ${body.serviceCategory}\nالأولوية: ${body.urgency}\nطريقة التواصل: ${body.preferredMode}`
      }
    });
    result.staffNotification = emailDeliveryOutcome(delivery.mode);
  } catch {
    result.staffNotification = "failed";
  }

  return result;
}

function emailDeliveryOutcome(mode: EmailDeliveryMode): EmailDeliveryOutcome {
  if (mode === "smtp") {
    return "sent";
  }

  if (mode === "dev") {
    return "queued";
  }

  return "skipped";
}
