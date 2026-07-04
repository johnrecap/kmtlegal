import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog, appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { captureAnalyticsEventBestEffort } from "@/server/observability/analytics-service";
import { toPagination } from "@/server/http/pagination";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { resolveConsultationNotifications, unreviewedConsultationWhere } from "./notification-service";

const consultationStatusSchema = z.enum(["NEW", "REVIEWING", "PAYMENT_PENDING", "SCHEDULED", "REJECTED", "CONVERTED"]);
const urgencySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const appointmentModeSchema = z.enum(["PHONE", "ONLINE", "OFFICE"]).default("ONLINE");

export const adminConsultationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: consultationStatusSchema.optional().or(z.literal("")),
  assigned: z.enum(["", "assigned", "unassigned"]).default(""),
  review: z.enum(["", "unreviewed"]).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export const assignConsultationSchema = z.object({
  assignedLawyerId: uuidSchema
});

export const rejectConsultationSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal(""))
});

export const reviewConsultationSchema = z.object({
  note: z.string().trim().max(800).optional().or(z.literal(""))
});

export const convertConsultationSchema = z.object({
  assignedLawyerId: uuidSchema.optional().or(z.literal("")),
  caseTitle: z.string().trim().min(3).max(180).optional().or(z.literal("")),
  caseType: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  priority: urgencySchema.default("NORMAL"),
  appointmentStartsAt: z.string().datetime().optional().or(z.literal("")),
  appointmentMode: appointmentModeSchema,
  appointmentLocation: z.string().trim().max(180).optional().or(z.literal("")),
  appointmentDurationMinutes: z.coerce.number().int().min(15).max(240).default(60)
});

export type AdminConsultationListQuery = z.infer<typeof adminConsultationListQuerySchema>;
export type ConvertConsultationInput = z.infer<typeof convertConsultationSchema>;

type ReviewableConsultation = {
  assignedLawyerId?: string | null;
};

export function canReviewConsultation(actor: Principal, consultation: ReviewableConsultation) {
  if (hasPermission(actor, "consultation.review.any")) {
    return true;
  }

  return hasPermission(actor, "consultation.review.assigned") && consultation.assignedLawyerId === actor.id;
}

export function consultationScopeWhereForPrincipal(actor: Principal): Prisma.ConsultationRequestWhereInput {
  if (hasPermission(actor, "consultation.review.any")) {
    return {};
  }

  if (hasPermission(actor, "consultation.review.assigned")) {
    return { assignedLawyerId: actor.id };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Consultation review permission is required.");
}

export function priorityFromUrgency(urgency: string) {
  if (urgency === "URGENT") {
    return "URGENT";
  }
  if (urgency === "HIGH") {
    return "HIGH";
  }
  if (urgency === "LOW") {
    return "LOW";
  }
  return "NORMAL";
}

export function appointmentEndAt(startsAt: Date, durationMinutes: number) {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

export function consultationInternalFileNumber(id: string, now = new Date()) {
  return `KMT-${now.getFullYear()}-${id.slice(0, 8).toUpperCase()}`;
}

function normalizeListQuery(input: unknown) {
  return parseWithSchema(adminConsultationListQuerySchema, input, "Consultation list query is invalid.");
}

function listWhere(actor: Principal, filters: AdminConsultationListQuery): Prisma.ConsultationRequestWhereInput {
  const scope = consultationScopeWhereForPrincipal(actor);
  const search = filters.q?.trim();
  const status = filters.status || undefined;
  const assigned = filters.assigned || undefined;
  const review = filters.review || undefined;

  return {
    AND: [
      scope,
      status ? { status } : {},
      assigned === "assigned" ? { assignedLawyerId: { not: null } } : {},
      assigned === "unassigned" ? { assignedLawyerId: null } : {},
      review === "unreviewed" ? { status: "SCHEDULED", secretaryReviewedAt: null } : {},
      search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { summary: { contains: search, mode: "insensitive" } },
              { serviceCategory: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };
}

export async function listAdminConsultations(input: { actor: Principal; query: unknown }) {
  const filters = normalizeListQuery(input.query);
  const pagination = toPagination(filters);
  const where = listWhere(input.actor, filters);
  const unassignedWhere: Prisma.ConsultationRequestWhereInput = {
    AND: [
      consultationScopeWhereForPrincipal(input.actor),
      { assignedLawyerId: null },
      { status: { in: ["NEW", "REVIEWING", "SCHEDULED"] } }
    ]
  };
  const unreviewedWhere = unreviewedConsultationWhere(input.actor);

  const [items, total, unassignedTotal, unreviewedTotal] = await Promise.all([
    prisma.consultationRequest.findMany({
      where,
      include: {
        assignedLawyer: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, fullName: true } },
        secretaryReviewedBy: { select: { id: true, name: true, email: true } },
        convertedCase: { select: { id: true, internalFileNumber: true, title: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.consultationRequest.count({ where }),
    prisma.consultationRequest.count({ where: unassignedWhere }),
    prisma.consultationRequest.count({ where: unreviewedWhere })
  ]);

  return { items, total, unassignedTotal, unreviewedTotal, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function getAdminConsultationDetail(input: { actor: Principal; consultationId: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    include: {
      assignedLawyer: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, fullName: true, phone: true, email: true } },
      secretaryReviewedBy: { select: { id: true, name: true, email: true } },
      appointments: { orderBy: { startsAt: "asc" } },
      convertedCase: { select: { id: true, internalFileNumber: true, title: true, status: true } }
    }
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }

  if (!canReviewConsultation(input.actor, consultation)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation review is not allowed.");
  }

  return consultation;
}

export async function listAssignableLawyers() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: {
        name: "Lawyer"
      }
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });
}

async function assertAssignableLawyer(userId: string) {
  const lawyer = await prisma.user.findFirst({
    where: {
      id: userId,
      status: "ACTIVE",
      role: { name: "Lawyer" }
    },
    select: { id: true, name: true }
  });

  if (!lawyer) {
    throw new ApiError(400, "VALIDATION_ERROR", "Assigned lawyer is invalid.");
  }

  return lawyer;
}

export async function assignConsultation(input: { actor: Principal; consultationId: string; body: unknown; request?: Request }) {
  if (!hasPermission(input.actor, "consultation.review.any")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Assigning consultations requires admin review permission.");
  }

  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(assignConsultationSchema, input.body, "Assignment payload is invalid.");
  await assertAssignableLawyer(body.assignedLawyerId);

  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    select: { id: true, status: true, assignedLawyerId: true, clientId: true, secretaryReviewedAt: true }
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }
  if (consultation.status === "CONVERTED" || consultation.status === "REJECTED") {
    throw new ApiError(409, "CONFLICT", "Closed consultations cannot be assigned.");
  }

  const now = new Date();
  const shouldMarkReviewed = consultation.status === "SCHEDULED" && !consultation.secretaryReviewedAt;
  const updated = await prisma.$transaction(async (tx) => {
    const assignedConsultation = await tx.consultationRequest.update({
      where: { id: consultationId },
      data: {
        assignedLawyerId: body.assignedLawyerId,
        status: consultation.status === "SCHEDULED" ? "SCHEDULED" : "REVIEWING",
        ...(shouldMarkReviewed
          ? {
              secretaryReviewedAt: now,
              secretaryReviewedById: input.actor.id,
              secretaryReviewNote: "تمت مراجعة الطلب أثناء تعيين المحامي المسؤول."
            }
          : {})
      },
      include: {
        assignedLawyer: { select: { id: true, name: true, email: true } }
      }
    });

    if (shouldMarkReviewed) {
      await resolveConsultationNotifications({ client: tx, consultationId });
    }

    await tx.appointment.updateMany({
      where: { consultationRequestId: consultationId, type: "CONSULTATION" },
      data: { lawyerId: body.assignedLawyerId }
    });

    if (consultation.clientId) {
      await tx.client.update({
        where: { id: consultation.clientId },
        data: { assignedLawyerId: body.assignedLawyerId }
      });
    }

    return assignedConsultation;
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "consultation.assign",
    resourceType: "ConsultationRequest",
    resourceId: consultationId,
    lawyerId: body.assignedLawyerId,
    metadata: { assignedLawyerId: body.assignedLawyerId, previousAssignedLawyerId: consultation.assignedLawyerId },
    request: input.request
  });

  return updated;
}

export async function reviewConsultation(input: { actor: Principal; consultationId: string; body: unknown; request?: Request; requestId?: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(reviewConsultationSchema, input.body, "Review payload is invalid.");
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    select: { id: true, status: true, assignedLawyerId: true, secretaryReviewedAt: true }
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }
  if (!canReviewConsultation(input.actor, consultation)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation review is not allowed.");
  }
  if (consultation.status === "PAYMENT_PENDING") {
    throw new ApiError(409, "CONFLICT", "Paid consultation cannot be reviewed before trusted payment confirmation.");
  }
  if (consultation.status === "CONVERTED" || consultation.status === "REJECTED") {
    throw new ApiError(409, "CONFLICT", "Closed consultations cannot be reviewed.");
  }

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.consultationRequest.update({
      where: { id: consultationId },
      data: {
        secretaryReviewedAt: consultation.secretaryReviewedAt ?? now,
        secretaryReviewedById: consultation.secretaryReviewedAt ? undefined : input.actor.id,
        secretaryReviewNote: body.note || null
      },
      include: {
        secretaryReviewedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await resolveConsultationNotifications({ client: tx, consultationId });

    const next = await tx.consultationRequest.findFirst({
      where: {
        AND: [unreviewedConsultationWhere(input.actor), { id: { not: consultationId } }]
      },
      select: { id: true },
      orderBy: { createdAt: "asc" }
    });

    return {
      consultation: updated,
      nextReviewHref: next ? `/admin/consultations/${next.id}` : null
    };
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "consultation.secretary_review",
    resourceType: "ConsultationRequest",
    resourceId: consultationId,
    lawyerId: consultation.assignedLawyerId,
    metadata: {
      previousSecretaryReviewedAt: consultation.secretaryReviewedAt?.toISOString() ?? null,
      secretaryReviewedAt: result.consultation.secretaryReviewedAt?.toISOString() ?? null,
      nextReviewHref: result.nextReviewHref
    },
    request: input.request
  });

  return result;
}

export async function rejectConsultation(input: { actor: Principal; consultationId: string; body: unknown; request?: Request }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(rejectConsultationSchema, input.body, "Reject payload is invalid.");
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    select: { id: true, status: true, assignedLawyerId: true }
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }
  if (!canReviewConsultation(input.actor, consultation)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation rejection is not allowed.");
  }
  if (consultation.status === "CONVERTED" || consultation.status === "REJECTED") {
    throw new ApiError(409, "CONFLICT", "Closed consultations cannot be rejected.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const rejected = await tx.consultationRequest.update({
      where: { id: consultationId },
      data: { status: "REJECTED" }
    });
    await resolveConsultationNotifications({ client: tx, consultationId });
    return rejected;
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "consultation.reject",
    resourceType: "ConsultationRequest",
    resourceId: consultationId,
    lawyerId: consultation.assignedLawyerId,
    metadata: { reason: body.reason || null },
    request: input.request
  });

  return updated;
}

export async function convertConsultationToCase(input: { actor: Principal; consultationId: string; body: unknown; request?: Request; requestId?: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(convertConsultationSchema, input.body, "Conversion payload is invalid.");
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    include: { convertedCase: { select: { id: true } } }
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }
  if (!canReviewConsultation(input.actor, consultation)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation conversion is not allowed.");
  }
  if (consultation.status === "CONVERTED" || consultation.convertedCase) {
    throw new ApiError(409, "CONFLICT", "Consultation is already converted.");
  }
  if (consultation.status === "REJECTED") {
    throw new ApiError(409, "CONFLICT", "Rejected consultations cannot be converted.");
  }

  const assignedLawyerId = body.assignedLawyerId || consultation.assignedLawyerId || (input.actor.roleName === "Lawyer" ? input.actor.id : "");
  if (!assignedLawyerId) {
    throw new ApiError(400, "VALIDATION_ERROR", "Assigned lawyer is required before conversion.");
  }
  await assertAssignableLawyer(assignedLawyerId);

  const appointmentStartsAt = body.appointmentStartsAt ? new Date(body.appointmentStartsAt) : null;
  const caseTitle = body.caseTitle || consultation.summary.slice(0, 120);
  const caseType = body.caseType || consultation.serviceCategory;
  const priority = body.priority || priorityFromUrgency(consultation.urgency);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const client =
      consultation.clientId
        ? await tx.client.update({
            where: { id: consultation.clientId },
            data: {
              fullName: consultation.fullName,
              phone: consultation.phone,
              phoneCanonical: canonicalPhone(consultation.phone),
              email: consultation.email,
              city: consultation.city,
              status: "ACTIVE",
              assignedLawyerId
            }
          })
        : await upsertClientFromConsultation(tx, consultation, assignedLawyerId);

    const legalCase = await tx.legalCase.create({
      data: {
        internalFileNumber: consultationInternalFileNumber(consultation.id, now),
        clientId: client.id,
        assignedLawyerId,
        consultationRequestId: consultation.id,
        title: caseTitle,
        caseType,
        status: "ACTIVE",
        priority,
        summary: consultation.aiSummary || consultation.summary,
        nextSessionAt: appointmentStartsAt
      }
    });

    const appointment = appointmentStartsAt
      ? await tx.appointment.create({
          data: {
            clientId: client.id,
            lawyerId: assignedLawyerId,
            consultationRequestId: consultation.id,
            caseId: legalCase.id,
            title: `موعد متابعة ${legalCase.internalFileNumber}`,
            type: "CONSULTATION",
            mode: body.appointmentMode,
            location: body.appointmentLocation || null,
            startsAt: appointmentStartsAt,
            endsAt: appointmentEndAt(appointmentStartsAt, body.appointmentDurationMinutes),
            status: "SCHEDULED"
          }
        })
      : null;

    const updatedConsultation = await tx.consultationRequest.update({
      where: { id: consultation.id },
      data: {
        clientId: client.id,
        assignedLawyerId,
        status: "CONVERTED"
      }
    });

    await resolveConsultationNotifications({ client: tx, consultationId: consultation.id });

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "consultation.convert_to_case",
      resourceType: "ConsultationRequest",
      resourceId: consultation.id,
      clientId: client.id,
      caseId: legalCase.id,
      lawyerId: assignedLawyerId,
      appointmentId: appointment?.id ?? null,
      metadata: {
        clientId: client.id,
        caseId: legalCase.id,
        appointmentId: appointment?.id ?? null,
        assignedLawyerId
      },
      request: input.request,
      requestId: input.requestId
    });

    return { client, legalCase, appointment, consultation: updatedConsultation };
  });

  captureAnalyticsEventBestEffort({
    name: "consultation.converted_to_case",
    source: "ADMIN",
    outcome: "SUCCESS",
    actor: input.actor,
    requestId: input.requestId,
    properties: {
      previousStatus: consultation.status,
      status: "CONVERTED",
      priority,
      appointmentCreated: Boolean(result.appointment),
      assignedLawyerChanged: assignedLawyerId !== consultation.assignedLawyerId
    }
  });

  return result;
}

async function upsertClientFromConsultation(
  tx: Prisma.TransactionClient,
  consultation: {
    fullName: string;
    phone: string;
    email: string | null;
    city: string | null;
  },
  assignedLawyerId: string
) {
  const phoneCanonical = canonicalPhone(consultation.phone);
  const matchConditions: Prisma.ClientWhereInput[] = [{ phone: consultation.phone }];
  if (phoneCanonical) {
    matchConditions.unshift({ phoneCanonical });
  }
  if (consultation.email) {
    matchConditions.push({ email: consultation.email });
  }

  const existing = await tx.client.findFirst({
    where: {
      OR: matchConditions
    }
  });

  if (existing) {
    return tx.client.update({
      where: { id: existing.id },
      data: {
        fullName: consultation.fullName,
        phone: consultation.phone,
        phoneCanonical,
        email: consultation.email,
        city: consultation.city,
        status: "ACTIVE",
        assignedLawyerId
      }
    });
  }

  return tx.client.create({
    data: {
      fullName: consultation.fullName,
      phone: consultation.phone,
      phoneCanonical,
      email: consultation.email,
      city: consultation.city,
      source: "consultation",
      status: "ACTIVE",
      assignedLawyerId
    }
  });
}
