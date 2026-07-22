import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSACTION_MODES,
  assertNoAppointmentConflict,
  runAppointmentConflictTransaction
} from "@/server/appointments/appointment-conflict-service";
import { appendAuditLog } from "@/server/audit/audit-service";
import { PLAN36_AUDIT_ACTIONS } from "@/server/audit/audit-event-catalog";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { captureAnalyticsEventBestEffort } from "@/server/observability/analytics-service";
import { toPagination } from "@/server/http/pagination";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { legalCaseReference } from "./legal-case-reference";
import {
  syncConsultationOutcomeNotifications,
  unreviewedConsultationWhere
} from "./notification-service";
import {
  adminConsultationDetailSelect,
  adminConsultationListSelect,
  canManageConsultationOutcome,
  consultationReopenRequiredError,
  consultationStateChangedError,
  consultationOutcomeViewSchema,
  consultationOutcomeViewWhere,
  countConsultationOutcomeViews,
  getPrimaryConsultationAppointment,
  toAdminConsultationDetail,
  toAdminConsultationListItem
} from "./consultation-outcome-service";

const consultationStatusSchema = z.enum(["NEW", "REVIEWING", "PAYMENT_PENDING", "SCHEDULED", "REJECTED", "CONVERTED"]);
const urgencySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const appointmentModeSchema = z.enum(["PHONE", "ONLINE", "OFFICE"]).default("ONLINE");

export const adminConsultationListQuerySchema = z.object({
  view: consultationOutcomeViewSchema.default("current"),
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: consultationStatusSchema.optional().or(z.literal("")),
  assigned: z.enum(["", "assigned", "unassigned"]).default(""),
  review: z.enum(["", "unreviewed"]).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
}).superRefine((value, context) => {
  if (value.review === "unreviewed" && value.view !== "current") {
    context.addIssue({
      code: "custom",
      path: ["review"],
      message: "The unreviewed filter is available only for current consultations."
    });
  }
});

export const assignConsultationSchema = z.object({
  assignedLawyerId: uuidSchema
});

export const rejectConsultationSchema = z.object({
  expectedOutcomeVersion: z.coerce.number().int().min(0).optional(),
  reasonCode: z.enum(["CANCELLED_BY_CLIENT", "CANCELLED_BY_OFFICE", "OTHER"]).default("CANCELLED_BY_OFFICE"),
  reason: z.string().trim().max(500).optional().or(z.literal(""))
}).strict();

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

type ExistingConsultationMutation = "assign" | "review" | "reject" | "convert";
type ExistingConsultationOutcome =
  | "PENDING"
  | "AWAITING_RESULT"
  | "MISSED"
  | "SUCCESSFUL"
  | "NO_SHOW"
  | "CANCELLED";

export function assertExistingConsultationMutationAllowed(
  action: ExistingConsultationMutation,
  outcomeStatus: ExistingConsultationOutcome,
  context: {
    primaryEndsAt?: Date | null;
    assignedLawyerId?: string | null;
    secretaryReviewedAt?: Date | null;
    now?: Date;
  } = {}
) {
  if (outcomeStatus === "MISSED") {
    throw consultationReopenRequiredError();
  }

  if (
    (action === "assign" || action === "review") &&
    outcomeStatus === "PENDING" &&
    context.primaryEndsAt &&
    context.primaryEndsAt.getTime() <= (context.now ?? new Date()).getTime()
  ) {
    if (!context.assignedLawyerId && !context.secretaryReviewedAt) {
      throw consultationReopenRequiredError();
    }
    throw consultationStateChangedError();
  }

  const allowed = action === "convert"
    ? outcomeStatus === "AWAITING_RESULT" || outcomeStatus === "SUCCESSFUL"
    : action === "reject"
      ? outcomeStatus === "PENDING" || outcomeStatus === "AWAITING_RESULT"
      : outcomeStatus === "PENDING" || outcomeStatus === "AWAITING_RESULT";

  if (!allowed) {
    throw consultationStateChangedError();
  }
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

export const consultationInternalFileNumber = legalCaseReference;

function normalizeListQuery(input: unknown) {
  return parseWithSchema(adminConsultationListQuerySchema, input, "Consultation list query is invalid.");
}

function listBaseWhere(
  actor: Principal,
  filters: AdminConsultationListQuery,
  options: { includeReview?: boolean } = {}
): Prisma.ConsultationRequestWhereInput {
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
      options.includeReview !== false && review === "unreviewed"
        ? { status: "SCHEDULED", secretaryReviewedAt: null }
        : {},
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

function listWhere(actor: Principal, filters: AdminConsultationListQuery): Prisma.ConsultationRequestWhereInput {
  return {
    AND: [listBaseWhere(actor, filters), consultationOutcomeViewWhere(filters.view)]
  };
}

export async function listAdminConsultations(input: { actor: Principal; query: unknown }) {
  const filters = normalizeListQuery(input.query);
  const pagination = toPagination(filters);
  const where = listWhere(input.actor, filters);
  const baseWhere = listBaseWhere(input.actor, filters, { includeReview: false });
  const currentBaseWhere = listBaseWhere(input.actor, filters);
  const unassignedWhere: Prisma.ConsultationRequestWhereInput = {
    AND: [
      consultationScopeWhereForPrincipal(input.actor),
      { assignedLawyerId: null },
      { outcomeStatus: "PENDING" },
      { status: { in: ["NEW", "REVIEWING", "SCHEDULED"] } }
    ]
  };
  const unreviewedWhere = unreviewedConsultationWhere(input.actor);

  const [rows, total, unassignedTotal, unreviewedTotal, viewCounts] = await Promise.all([
    prisma.consultationRequest.findMany({
      where,
      select: adminConsultationListSelect,
      orderBy: [{ createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.consultationRequest.count({ where }),
    prisma.consultationRequest.count({ where: unassignedWhere }),
    prisma.consultationRequest.count({ where: unreviewedWhere }),
    countConsultationOutcomeViews(baseWhere, prisma, { current: currentBaseWhere })
  ]);

  return {
    items: rows.map(toAdminConsultationListItem),
    total,
    viewCounts,
    unassignedTotal,
    unreviewedTotal,
    filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

export async function getAdminConsultationDetail(input: { actor: Principal; consultationId: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const consultation = await prisma.consultationRequest.findUnique({
    where: { id: consultationId },
    select: adminConsultationDetailSelect
  });

  if (!consultation) {
    throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
  }

  if (!canReviewConsultation(input.actor, consultation)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation review is not allowed.");
  }

  const detail = toAdminConsultationDetail(consultation);
  const canManageOutcome = canManageConsultationOutcome(input.actor);
  return {
    ...detail,
    canAssign: hasPermission(input.actor, "consultation.review.any"),
    canManageOutcome,
    canReopen: canManageOutcome && detail.outcomeStatus === "MISSED"
  };
}

export async function listAssignableLawyers() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      role: {
        name: "Lawyer",
        status: "ACTIVE"
      }
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });
}

async function assertAssignableLawyer(
  userId: string,
  client: Pick<Prisma.TransactionClient, "user"> = prisma
) {
  const lawyer = await client.user.findFirst({
    where: {
      id: userId,
      status: "ACTIVE",
      deletedAt: null,
      role: { name: "Lawyer", status: "ACTIVE" }
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

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    operation: async (tx) => {
      await assertAssignableLawyer(body.assignedLawyerId, tx);
      const consultation = await tx.consultationRequest.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          status: true,
          assignedLawyerId: true,
          clientId: true,
          secretaryReviewedAt: true,
          outcomeStatus: true,
          outcomeVersion: true
        }
      });

      if (!consultation) {
        throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
      }
      if (consultation.status === "CONVERTED" || consultation.status === "REJECTED") {
        throw new ApiError(409, "CONFLICT", "Closed consultations cannot be assigned.");
      }
      const primaryAppointment = await getPrimaryConsultationAppointment(consultationId, tx);
      assertExistingConsultationMutationAllowed("assign", consultation.outcomeStatus, {
        primaryEndsAt: primaryAppointment?.endsAt,
        assignedLawyerId: consultation.assignedLawyerId,
        secretaryReviewedAt: consultation.secretaryReviewedAt
      });
      if (
        primaryAppointment &&
        (ACTIVE_APPOINTMENT_STATUSES as readonly string[]).includes(primaryAppointment.status)
      ) {
        await assertNoAppointmentConflict({
          startsAt: primaryAppointment.startsAt,
          endsAt: primaryAppointment.endsAt,
          scope: { kind: "lawyer", lawyerId: body.assignedLawyerId },
          excludeAppointmentId: primaryAppointment.id,
          client: tx
        });
      }

      const now = new Date();
      const shouldMarkReviewed = consultation.status === "SCHEDULED" && !consultation.secretaryReviewedAt;
      const assigned = await tx.consultationRequest.updateMany({
        where: {
          id: consultationId,
          outcomeStatus: consultation.outcomeStatus,
          outcomeVersion: consultation.outcomeVersion
        },
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
        }
      });
      if (assigned.count !== 1) {
        throw consultationStateChangedError();
      }
      const assignedConsultation = await tx.consultationRequest.findUniqueOrThrow({
        where: { id: consultationId },
        include: {
          assignedLawyer: { select: { id: true, name: true, email: true } }
        }
      });

      if (shouldMarkReviewed) {
        await syncConsultationOutcomeNotifications({
          client: tx,
          consultationId,
          outcomeStatus: consultation.outcomeStatus
        });
      }

      if (primaryAppointment) {
        await tx.appointment.update({
          where: { id: primaryAppointment.id },
          data: { lawyerId: body.assignedLawyerId }
        });
      }

      if (consultation.clientId) {
        await tx.client.update({
          where: { id: consultation.clientId },
          data: { assignedLawyerId: body.assignedLawyerId }
        });
      }

      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: "consultation.assign",
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        lawyerId: body.assignedLawyerId,
        metadata: {
          assignedLawyerId: body.assignedLawyerId,
          previousAssignedLawyerId: consultation.assignedLawyerId
        },
        request: input.request
      });

      return assignedConsultation;
    }
  });
}

export async function reviewConsultation(input: { actor: Principal; consultationId: string; body: unknown; request?: Request; requestId?: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(reviewConsultationSchema, input.body, "Review payload is invalid.");
  const now = new Date();

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    serializationConflictError: consultationStateChangedError,
    operation: async (tx) => {
      const consultation = await tx.consultationRequest.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          status: true,
          assignedLawyerId: true,
          secretaryReviewedAt: true,
          outcomeStatus: true,
          outcomeVersion: true
        }
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
      const primaryAppointment = await getPrimaryConsultationAppointment(consultationId, tx);
      assertExistingConsultationMutationAllowed("review", consultation.outcomeStatus, {
        primaryEndsAt: primaryAppointment?.endsAt,
        assignedLawyerId: consultation.assignedLawyerId,
        secretaryReviewedAt: consultation.secretaryReviewedAt,
        now
      });

      const reviewed = await tx.consultationRequest.updateMany({
        where: {
          id: consultationId,
          outcomeStatus: consultation.outcomeStatus,
          outcomeVersion: consultation.outcomeVersion
        },
        data: {
          secretaryReviewedAt: consultation.secretaryReviewedAt ?? now,
          secretaryReviewedById: consultation.secretaryReviewedAt ? undefined : input.actor.id,
          secretaryReviewNote: body.note || null
        }
      });
      if (reviewed.count !== 1) {
        throw consultationStateChangedError();
      }

      const updated = await tx.consultationRequest.findUniqueOrThrow({
        where: { id: consultationId },
        include: {
          secretaryReviewedBy: { select: { id: true, name: true, email: true } }
        }
      });

      await syncConsultationOutcomeNotifications({
        client: tx,
        consultationId,
        outcomeStatus: consultation.outcomeStatus
      });

      const next = await tx.consultationRequest.findFirst({
        where: {
          AND: [unreviewedConsultationWhere(input.actor), { id: { not: consultationId } }]
        },
        select: { id: true },
        orderBy: { createdAt: "asc" }
      });
      const nextReviewHref = next ? `/admin/consultations/${next.id}` : null;

      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: "consultation.secretary_review",
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        lawyerId: consultation.assignedLawyerId,
        metadata: {
          previousSecretaryReviewedAt: consultation.secretaryReviewedAt?.toISOString() ?? null,
          secretaryReviewedAt: updated.secretaryReviewedAt?.toISOString() ?? null,
          nextReviewHref
        },
        request: input.request,
        requestId: input.requestId
      });

      return { consultation: updated, nextReviewHref };
    }
  });
}

export async function rejectConsultation(input: { actor: Principal; consultationId: string; body: unknown; request?: Request }) {
  if (!canManageConsultationOutcome(input.actor)) {
    throw new ApiError(
      403,
      "PERMISSION_DENIED",
      "Consultation rejection requires consultation review and appointment management permissions."
    );
  }

  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(rejectConsultationSchema, input.body, "Reject payload is invalid.");
  const now = new Date();

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    serializationConflictError: consultationStateChangedError,
    operation: async (tx) => {
      const consultation = await tx.consultationRequest.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          clientId: true,
          status: true,
          assignedLawyerId: true,
          outcomeStatus: true,
          outcomeVersion: true
        }
      });

      if (!consultation) {
        throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
      }
      if (consultation.status === "CONVERTED" || consultation.status === "REJECTED") {
        throw new ApiError(409, "CONFLICT", "Closed consultations cannot be rejected.");
      }
      assertExistingConsultationMutationAllowed("reject", consultation.outcomeStatus);
      if (
        body.expectedOutcomeVersion !== undefined &&
        consultation.outcomeVersion !== body.expectedOutcomeVersion
      ) {
        throw consultationStateChangedError();
      }

      const expectedOutcomeVersion = body.expectedOutcomeVersion ?? consultation.outcomeVersion;

      const primaryAppointment = await getPrimaryConsultationAppointment(consultationId, tx);
      const rejected = await tx.consultationRequest.updateMany({
        where: {
          id: consultationId,
          status: consultation.status,
          outcomeStatus: consultation.outcomeStatus,
          outcomeVersion: expectedOutcomeVersion
        },
        data: {
          status: "REJECTED",
          outcomeStatus: "CANCELLED",
          outcomeAt: now,
          outcomeById: input.actor.id,
          outcomeReasonCode: body.reasonCode,
          outcomeNote: body.reason || null,
          outcomeVersion: { increment: 1 }
        }
      });
      if (rejected.count !== 1) {
        throw consultationStateChangedError();
      }

      if (primaryAppointment) {
        await tx.appointment.update({
          where: { id: primaryAppointment.id },
          data: { status: "CANCELLED" }
        });
      }
      await syncConsultationOutcomeNotifications({
        client: tx,
        consultationId,
        outcomeStatus: "CANCELLED"
      });

      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: PLAN36_AUDIT_ACTIONS.rejected,
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        clientId: consultation.clientId,
        lawyerId: consultation.assignedLawyerId,
        appointmentId: primaryAppointment?.id ?? null,
        metadata: {
          fromOutcome: consultation.outcomeStatus,
          toOutcome: "CANCELLED",
          reasonCode: body.reasonCode,
          outcomeVersion: expectedOutcomeVersion + 1,
          source: "ADMIN",
          primaryAppointmentId: primaryAppointment?.id
        },
        request: input.request
      });

      return tx.consultationRequest.findUniqueOrThrow({ where: { id: consultationId } });
    }
  });
}

export async function convertConsultationToCase(input: { actor: Principal; consultationId: string; body: unknown; request?: Request; requestId?: string }) {
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(convertConsultationSchema, input.body, "Conversion payload is invalid.");
  const appointmentStartsAt = body.appointmentStartsAt ? new Date(body.appointmentStartsAt) : null;
  const appointmentEndsAt = appointmentStartsAt
    ? appointmentEndAt(appointmentStartsAt, body.appointmentDurationMinutes)
    : null;

  const transactionResult = await runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry,
    operation: async (tx) => {
      const consultation = await tx.consultationRequest.findUnique({
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
      assertExistingConsultationMutationAllowed("convert", consultation.outcomeStatus);

      const assignedLawyerId =
        body.assignedLawyerId ||
        consultation.assignedLawyerId ||
        (input.actor.roleName === "Lawyer" ? input.actor.id : "");
      if (!assignedLawyerId) {
        throw new ApiError(400, "VALIDATION_ERROR", "Assigned lawyer is required before conversion.");
      }
      await assertAssignableLawyer(assignedLawyerId, tx);

      if (appointmentStartsAt && appointmentEndsAt) {
        await assertNoAppointmentConflict({
          startsAt: appointmentStartsAt,
          endsAt: appointmentEndsAt,
          scope: { kind: "lawyer", lawyerId: assignedLawyerId },
          client: tx
        });
      }

      const caseTitle = body.caseTitle || consultation.summary.slice(0, 120);
      const caseType = body.caseType || consultation.serviceCategory;
      const priority = body.priority || priorityFromUrgency(consultation.urgency);
      const now = new Date();
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

      const appointment = appointmentStartsAt && appointmentEndsAt
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
              endsAt: appointmentEndsAt,
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

      await syncConsultationOutcomeNotifications({
        client: tx,
        consultationId: consultation.id,
        outcomeStatus: consultation.outcomeStatus
      });

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

      return {
        result: { client, legalCase, appointment, consultation: updatedConsultation },
        analytics: {
          previousStatus: consultation.status,
          priority,
          assignedLawyerChanged: assignedLawyerId !== consultation.assignedLawyerId
        }
      };
    }
  });
  const { result, analytics } = transactionResult;

  captureAnalyticsEventBestEffort({
    name: "consultation.converted_to_case",
    source: "ADMIN",
    outcome: "SUCCESS",
    actor: input.actor,
    requestId: input.requestId,
    properties: {
      previousStatus: analytics.previousStatus,
      status: "CONVERTED",
      priority: analytics.priority,
      appointmentCreated: Boolean(result.appointment),
      assignedLawyerChanged: analytics.assignedLawyerChanged
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
