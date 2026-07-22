import { Prisma } from "@prisma/client";
import { plan36ApiErrorSourceMessages } from "@/lib/ui-copy";
import {
  APPOINTMENT_TRANSACTION_MODES,
  assertNoAppointmentConflict,
  runAppointmentConflictTransaction
} from "@/server/appointments/appointment-conflict-service";
import { appendAuditLog } from "@/server/audit/audit-service";
import { PLAN36_AUDIT_ACTIONS } from "@/server/audit/audit-event-catalog";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import {
  CONSULTATION_OUTCOME_VIEWS,
  consultationOperationalTiming,
  consultationOutcomeViewWhere,
  primaryConsultationAppointmentQuery,
  appointmentStatusForConsultationOutcome,
  canManageConsultationOutcome,
  consultationOutcomeInputSchema,
  CORRECTION_OUTCOME_REASON_CODES,
  INITIAL_OUTCOME_REASON_CODES,
  reopenConsultationInputSchema,
  type ConsultationOutcomeView
} from "./consultation-outcome-policy";
import { syncConsultationOutcomeNotifications } from "./notification-service";

export * from "./consultation-outcome-policy";

export const primaryConsultationAppointmentSelect = Prisma.validator<Prisma.AppointmentSelect>()({
  id: true,
  lawyerId: true,
  startsAt: true,
  endsAt: true,
  status: true,
  mode: true,
  location: true,
  title: true,
  type: true,
  caseId: true,
  lawyer: { select: { id: true, name: true } }
});

export const adminConsultationListSelect = Prisma.validator<Prisma.ConsultationRequestSelect>()({
  id: true,
  fullName: true,
  phone: true,
  email: true,
  serviceCategory: true,
  urgency: true,
  preferredMode: true,
  status: true,
  assignedLawyerId: true,
  assignedLawyer: { select: { id: true, name: true } },
  secretaryReviewedAt: true,
  secretaryReviewedBy: { select: { id: true, name: true } },
  outcomeStatus: true,
  outcomeAt: true,
  outcomeBy: { select: { id: true, name: true } },
  outcomeReasonCode: true,
  outcomeVersion: true,
  convertedCase: { select: { id: true, internalFileNumber: true, title: true } },
  appointments: {
    where: { type: "CONSULTATION", caseId: null },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    take: 1,
    select: primaryConsultationAppointmentSelect
  },
  createdAt: true,
  updatedAt: true
});

export const adminConsultationDetailSelect = Prisma.validator<Prisma.ConsultationRequestSelect>()({
  id: true,
  clientId: true,
  client: { select: { id: true, fullName: true, phone: true, email: true } },
  fullName: true,
  phone: true,
  email: true,
  city: true,
  serviceCategory: true,
  summary: true,
  opposingPartyName: true,
  urgency: true,
  preferredMode: true,
  status: true,
  aiClassification: true,
  aiSummary: true,
  assignedLawyerId: true,
  assignedLawyer: { select: { id: true, name: true, email: true } },
  secretaryReviewedAt: true,
  secretaryReviewedById: true,
  secretaryReviewedBy: { select: { id: true, name: true, email: true } },
  secretaryReviewNote: true,
  outcomeStatus: true,
  outcomeAt: true,
  outcomeById: true,
  outcomeBy: { select: { id: true, name: true } },
  outcomeReasonCode: true,
  outcomeNote: true,
  outcomeVersion: true,
  appointments: {
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: primaryConsultationAppointmentSelect
  },
  convertedCase: { select: { id: true, internalFileNumber: true, title: true, status: true } },
  createdAt: true,
  updatedAt: true
});

type AdminConsultationListRow = Prisma.ConsultationRequestGetPayload<{
  select: typeof adminConsultationListSelect;
}>;

type AdminConsultationDetailRow = Prisma.ConsultationRequestGetPayload<{
  select: typeof adminConsultationDetailSelect;
}>;

export type OutcomeCountClient = Pick<Prisma.TransactionClient, "consultationRequest">;

export function consultationReference(id: string) {
  return `CONS-${id.slice(0, 8).toUpperCase()}`;
}

export function toPrimaryConsultationAppointmentDto(
  appointment: AdminConsultationListRow["appointments"][number] | AdminConsultationDetailRow["appointments"][number] | null,
  outcomeStatus: AdminConsultationListRow["outcomeStatus"]
) {
  if (!appointment) return null;
  return {
    ...appointment,
    effectiveConsultationOutcome: outcomeStatus
  };
}

export function toAdminConsultationListItem(row: AdminConsultationListRow, asOf = new Date()) {
  const primaryAppointment = row.appointments[0] ?? null;
  return {
    id: row.id,
    reference: consultationReference(row.id),
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
    applicant: {
      displayName: row.fullName,
      phone: row.phone,
      email: row.email
    },
    serviceCategory: row.serviceCategory,
    urgency: row.urgency,
    preferredMode: row.preferredMode,
    status: row.status,
    workflowStatus: row.status,
    assignedLawyerId: row.assignedLawyerId,
    assignedLawyer: row.assignedLawyer,
    secretaryReviewedAt: row.secretaryReviewedAt,
    secretaryReviewedBy: row.secretaryReviewedBy,
    secretaryReview: {
      reviewedAt: row.secretaryReviewedAt,
      reviewedBy: row.secretaryReviewedBy
    },
    outcomeStatus: row.outcomeStatus,
    outcomeAt: row.outcomeAt,
    outcomeBy: row.outcomeBy,
    outcomeReasonCode: row.outcomeReasonCode,
    outcomeVersion: row.outcomeVersion,
    outcome: {
      status: row.outcomeStatus,
      changedAt: row.outcomeAt,
      changedBy: row.outcomeBy,
      reasonCode: row.outcomeReasonCode,
      version: row.outcomeVersion
    },
    primaryAppointment: toPrimaryConsultationAppointmentDto(primaryAppointment, row.outcomeStatus),
    operationalTiming: consultationOperationalTiming(
      {
        createdAt: row.createdAt,
        status: row.status,
        outcomeStatus: row.outcomeStatus,
        hasPrimaryAppointment: Boolean(primaryAppointment)
      },
      asOf
    ),
    convertedCase: row.convertedCase,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    detailHref: `/admin/consultations/${row.id}`
  };
}

export function toAdminConsultationDetail(row: AdminConsultationDetailRow, asOf = new Date()) {
  const primaryAppointment =
    row.appointments.find((appointment) => appointment.type === "CONSULTATION" && appointment.caseId === null) ?? null;
  return {
    ...row,
    outcome: {
      status: row.outcomeStatus,
      changedAt: row.outcomeAt,
      changedBy: row.outcomeBy,
      reasonCode: row.outcomeReasonCode,
      note: row.outcomeNote,
      version: row.outcomeVersion
    },
    primaryAppointment: toPrimaryConsultationAppointmentDto(primaryAppointment, row.outcomeStatus),
    operationalTiming: consultationOperationalTiming(
      {
        createdAt: row.createdAt,
        status: row.status,
        outcomeStatus: row.outcomeStatus,
        hasPrimaryAppointment: Boolean(primaryAppointment)
      },
      asOf
    )
  };
}

export async function getPrimaryConsultationAppointment(
  consultationRequestId: string,
  client: Pick<Prisma.TransactionClient, "appointment"> = prisma
) {
  return client.appointment.findFirst({
    ...primaryConsultationAppointmentQuery(consultationRequestId),
    select: primaryConsultationAppointmentSelect
  });
}

export async function countConsultationOutcomeViews(
  baseWhere: Prisma.ConsultationRequestWhereInput,
  client: OutcomeCountClient = prisma,
  baseWhereByView: Partial<Record<ConsultationOutcomeView, Prisma.ConsultationRequestWhereInput>> = {},
  asOf = new Date()
) {
  const entries = await Promise.all(
    CONSULTATION_OUTCOME_VIEWS.map(async (view) => {
      const where: Prisma.ConsultationRequestWhereInput = {
        AND: [baseWhereByView[view] ?? baseWhere, consultationOutcomeViewWhere(view, asOf)]
      };
      return [view, await client.consultationRequest.count({ where })] as const;
    })
  );
  return Object.fromEntries(entries) as Record<ConsultationOutcomeView, number>;
}

export async function setConsultationOutcome(input: {
  actor: Principal;
  consultationId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
  now?: Date;
  transactionClient?: NonNullable<Parameters<typeof runAppointmentConflictTransaction>[0]["client"]>;
}) {
  assertOutcomeManagementPermission(input.actor);
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(
    consultationOutcomeInputSchema,
    input.body,
    "Consultation outcome payload is invalid."
  );
  const now = input.now ?? new Date();

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    client: input.transactionClient,
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
          outcomeReasonCode: true,
          convertedCase: { select: { id: true } },
          outcomeVersion: true
        }
      });
      if (!consultation) {
        throw new ApiError(404, "NOT_FOUND", "Consultation was not found.");
      }
      assertExpectedOutcomeVersion(consultation.outcomeVersion, body.expectedOutcomeVersion);
      if (consultation.outcomeStatus === "MISSED") {
        throw consultationReopenRequiredError();
      }

      const currentIsFinal = isFinalOutcome(consultation.outcomeStatus);
      const primaryAppointment = await getPrimaryConsultationAppointment(consultationId, tx);
      const isConvertedLegacyWithoutPrimary =
        !primaryAppointment &&
        consultation.status === "CONVERTED" &&
        Boolean(consultation.convertedCase) &&
        ((consultation.outcomeStatus === "AWAITING_RESULT" &&
          consultation.outcomeReasonCode === "BACKFILL_CONVERTED_WITHOUT_PRIMARY") ||
          currentIsFinal);
      if (
        (!primaryAppointment && !isConvertedLegacyWithoutPrimary) ||
        (primaryAppointment && primaryAppointment.endsAt.getTime() > now.getTime())
      ) {
        throw consultationOutcomeNotReadyError();
      }

      if (consultation.outcomeStatus !== "AWAITING_RESULT" && !currentIsFinal) {
        throw consultationOutcomeNotReadyError();
      }
      if (consultation.outcomeStatus === body.status) {
        throw new ApiError(400, "VALIDATION_ERROR", "Choose a different final consultation outcome.");
      }
      const allowedReasons = currentIsFinal
        ? (CORRECTION_OUTCOME_REASON_CODES as readonly string[])
        : (INITIAL_OUTCOME_REASON_CODES as readonly string[]);
      if (!allowedReasons.includes(body.reasonCode)) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          currentIsFinal
            ? "A categorized correction reason is required."
            : "A categorized consultation outcome reason is required."
        );
      }

      const updated = await tx.consultationRequest.updateMany({
        where: {
          id: consultationId,
          outcomeStatus: consultation.outcomeStatus,
          outcomeVersion: body.expectedOutcomeVersion
        },
        data: {
          outcomeStatus: body.status,
          outcomeAt: now,
          outcomeById: input.actor.id,
          outcomeReasonCode: body.reasonCode,
          outcomeNote: body.note || null,
          outcomeVersion: { increment: 1 }
        }
      });
      if (updated.count !== 1) {
        throw consultationStateChangedError();
      }

      const appointmentStatus = appointmentStatusForConsultationOutcome(body.status);
      if (!appointmentStatus) {
        throw consultationOutcomeNotReadyError();
      }
      if (primaryAppointment) {
        await tx.appointment.update({
          where: { id: primaryAppointment.id },
          data: { status: appointmentStatus }
        });
      }
      await syncConsultationOutcomeNotifications({
        client: tx,
        consultationId,
        outcomeStatus: body.status
      });

      const nextVersion = body.expectedOutcomeVersion + 1;
      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: currentIsFinal ? PLAN36_AUDIT_ACTIONS.corrected : PLAN36_AUDIT_ACTIONS.confirmed,
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        clientId: consultation.clientId,
        lawyerId: consultation.assignedLawyerId,
        appointmentId: primaryAppointment?.id ?? null,
        metadata: {
          fromOutcome: consultation.outcomeStatus,
          toOutcome: body.status,
          reasonCode: body.reasonCode,
          outcomeVersion: nextVersion,
          source: "ADMIN",
          ...(primaryAppointment ? { primaryAppointmentId: primaryAppointment.id } : {})
        },
        request: input.request,
        requestId: input.requestId
      });

      const detail = await tx.consultationRequest.findUniqueOrThrow({
        where: { id: consultationId },
        select: adminConsultationDetailSelect
      });
      return {
        consultationId,
        ...toAdminConsultationDetail(detail),
        corrected: currentIsFinal
      };
    }
  });
}

export async function reopenMissedConsultation(input: {
  actor: Principal;
  consultationId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
  now?: Date;
  transactionClient?: NonNullable<Parameters<typeof runAppointmentConflictTransaction>[0]["client"]>;
}) {
  assertOutcomeManagementPermission(input.actor);
  const consultationId = parseWithSchema(uuidSchema, input.consultationId, "Consultation id is invalid.");
  const body = parseWithSchema(
    reopenConsultationInputSchema,
    input.body,
    "Consultation reopen payload is invalid."
  );
  const now = input.now ?? new Date();
  const startsAt = new Date(body.startsAt);
  if (startsAt.getTime() <= now.getTime()) {
    throw new ApiError(400, "VALIDATION_ERROR", "The reopened consultation must start in the future.");
  }
  const endsAt = new Date(startsAt.getTime() + body.durationMinutes * 60_000);

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    client: input.transactionClient,
    operation: async (tx) => {
      const consultation = await tx.consultationRequest.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          clientId: true,
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
      assertExpectedOutcomeVersion(consultation.outcomeVersion, body.expectedOutcomeVersion);
      if (consultation.outcomeStatus !== "MISSED") {
        throw consultationReopenRequiredError();
      }
      if (consultation.status === "REJECTED" || consultation.status === "CONVERTED") {
        throw consultationStateChangedError();
      }

      const primaryAppointment = await tx.appointment.findFirst({
        ...primaryConsultationAppointmentQuery(consultationId),
        select: {
          ...primaryConsultationAppointmentSelect,
          clientId: true
        }
      });
      if (!primaryAppointment) {
        throw consultationOutcomeNotReadyError();
      }
      const conflictClientId = consultation.clientId ?? primaryAppointment.clientId;
      await assertActiveConsultationLawyer(body.assignedLawyerId, tx);
      await assertNoAppointmentConflict({
        startsAt,
        endsAt,
        scope: { kind: "lawyer", lawyerId: body.assignedLawyerId },
        excludeAppointmentId: primaryAppointment.id,
        client: tx
      });
      await assertNoAppointmentConflict({
        startsAt,
        endsAt,
        scope: { kind: "client", clientId: conflictClientId },
        excludeAppointmentId: primaryAppointment.id,
        client: tx
      });

      const updated = await tx.consultationRequest.updateMany({
        where: {
          id: consultationId,
          outcomeStatus: "MISSED",
          outcomeVersion: body.expectedOutcomeVersion
        },
        data: {
          assignedLawyerId: body.assignedLawyerId,
          secretaryReviewedAt: consultation.secretaryReviewedAt ?? now,
          secretaryReviewedById: consultation.secretaryReviewedAt ? undefined : input.actor.id,
          outcomeStatus: "PENDING",
          outcomeAt: now,
          outcomeById: input.actor.id,
          outcomeReasonCode: body.reasonCode,
          outcomeNote: body.note || null,
          outcomeVersion: { increment: 1 }
        }
      });
      if (updated.count !== 1) {
        throw consultationStateChangedError();
      }

      await tx.appointment.update({
        where: { id: primaryAppointment.id },
        data: {
          lawyerId: body.assignedLawyerId,
          startsAt,
          endsAt,
          mode: body.mode,
          location: body.location || null,
          status: "RESCHEDULED"
        }
      });
      await tx.client.update({
        where: { id: conflictClientId },
        data: { assignedLawyerId: body.assignedLawyerId }
      });
      await syncConsultationOutcomeNotifications({
        client: tx,
        consultationId,
        outcomeStatus: "PENDING"
      });

      const nextVersion = body.expectedOutcomeVersion + 1;
      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: PLAN36_AUDIT_ACTIONS.reopened,
        resourceType: "ConsultationRequest",
        resourceId: consultationId,
        clientId: conflictClientId,
        lawyerId: body.assignedLawyerId,
        appointmentId: primaryAppointment.id,
        metadata: {
          fromOutcome: "MISSED",
          toOutcome: "PENDING",
          reasonCode: body.reasonCode,
          outcomeVersion: nextVersion,
          source: "ADMIN",
          primaryAppointmentId: primaryAppointment.id,
          assignedLawyerId: body.assignedLawyerId
        },
        request: input.request,
        requestId: input.requestId
      });

      const detail = await tx.consultationRequest.findUniqueOrThrow({
        where: { id: consultationId },
        select: adminConsultationDetailSelect
      });
      return {
        consultationId,
        ...toAdminConsultationDetail(detail),
        reopened: true
      };
    }
  });
}

export async function assertActiveConsultationLawyer(
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

function assertOutcomeManagementPermission(actor: Principal) {
  if (!canManageConsultationOutcome(actor)) {
    throw new ApiError(
      403,
      "PERMISSION_DENIED",
      "Consultation outcome management requires consultation review and appointment management permissions."
    );
  }
}

function assertExpectedOutcomeVersion(actual: number, expected: number) {
  if (actual !== expected) {
    throw consultationStateChangedError();
  }
}

function isFinalOutcome(value: string): value is "SUCCESSFUL" | "NO_SHOW" | "CANCELLED" {
  return value === "SUCCESSFUL" || value === "NO_SHOW" || value === "CANCELLED";
}

export function consultationOutcomeNotReadyError() {
  return new ApiError(
    409,
    "CONSULTATION_OUTCOME_NOT_READY",
    plan36ApiErrorSourceMessages.CONSULTATION_OUTCOME_NOT_READY
  );
}

export function consultationStateChangedError() {
  return new ApiError(
    409,
    "CONSULTATION_STATE_CHANGED",
    plan36ApiErrorSourceMessages.CONSULTATION_STATE_CHANGED
  );
}

export function consultationReopenRequiredError() {
  return new ApiError(
    409,
    "CONSULTATION_REOPEN_REQUIRED",
    plan36ApiErrorSourceMessages.CONSULTATION_REOPEN_REQUIRED
  );
}
