import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  APPOINTMENT_TRANSACTION_MODES,
  assertNoAppointmentConflict,
  runAppointmentConflictTransaction
} from "@/server/appointments/appointment-conflict-service";
import { appendAuditLog, appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { canReadCase, hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { captureAnalyticsEventBestEffort } from "@/server/observability/analytics-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const caseStatusSchema = z.enum(["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT", "COMPLETED", "CLOSED", "ARCHIVED"]);
const openCaseStatusValues = ["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT"] as const;
const casePrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const caseSortBySchema = z.enum(["updatedAt", "createdAt", "nextSessionAt", "internalFileNumber", "status", "priority"]);
const appointmentTypeSchema = z.enum(["CONSULTATION", "COURT_SESSION", "INTERNAL_MEETING", "CALL", "ONLINE_MEETING"]);
const appointmentModeSchema = z.enum(["OFFICE", "PHONE", "ONLINE", "COURT"]);
const appointmentStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"]);

const optionalDateStringSchema = z.string().trim().max(40).optional().or(z.literal(""));

export const adminCaseListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: caseStatusSchema.optional().or(z.literal("")),
  priority: casePrioritySchema.optional().or(z.literal("")),
  caseType: z.string().trim().max(80).optional().or(z.literal("")),
  assignedLawyerId: uuidSchema.optional().or(z.literal("")),
  sortBy: caseSortBySchema.default("updatedAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export const adminCalendarQuerySchema = z.object({
  from: optionalDateStringSchema,
  to: optionalDateStringSchema,
  status: appointmentStatusSchema.optional().or(z.literal("")),
  mode: appointmentModeSchema.optional().or(z.literal("")),
  lawyerId: uuidSchema.optional().or(z.literal("")),
  pageSize: z.coerce.number().int().min(1).max(100).default(50)
});

export const caseStatusUpdateSchema = z.object({
  status: caseStatusSchema,
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  confirmStatusChange: z.literal(true, {
    message: "Status change confirmation is required."
  })
});

export const caseSessionCreateSchema = z.object({
  courtName: z.string().trim().max(160).optional().or(z.literal("")),
  sessionDate: z.string().trim().min(1).max(40),
  decision: z.string().trim().max(1200).optional().or(z.literal("")),
  nextAction: z.string().trim().max(1200).optional().or(z.literal("")),
  nextSessionDate: optionalDateStringSchema
});

export const calendarAppointmentCreateSchema = z.object({
  caseId: uuidSchema,
  title: z.string().trim().min(3).max(180),
  type: appointmentTypeSchema.default("COURT_SESSION"),
  mode: appointmentModeSchema.default("COURT"),
  location: z.string().trim().max(180).optional().or(z.literal("")),
  startsAt: z.string().trim().min(1).max(40),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  notes: z.string().trim().max(1200).optional().or(z.literal(""))
});

export const appointmentRescheduleSchema = z.object({
  startsAt: z.string().trim().min(1).max(40),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  mode: appointmentModeSchema.optional(),
  location: z.string().trim().max(180).optional().or(z.literal("")),
  reason: z.string().trim().max(500).optional().or(z.literal(""))
});

export type AdminCaseListQuery = z.infer<typeof adminCaseListQuerySchema>;
export type AdminCalendarQuery = z.infer<typeof adminCalendarQuerySchema>;

type CasePermissionProbe = {
  assignedLawyerId?: string | null;
  client?: { userId?: string | null } | null;
};

type AppointmentPermissionProbe = {
  lawyerId?: string | null;
  case?: { assignedLawyerId?: string | null; deletedAt?: Date | null } | null;
};

export function canListAdminCases(actor: Principal) {
  return hasPermission(actor, "case.read.any") || hasPermission(actor, "case.read.assigned");
}

export function canReadAdminCase(actor: Principal, legalCase: CasePermissionProbe) {
  return canReadCase(actor, {
    assignedLawyerId: legalCase.assignedLawyerId,
    clientUserId: legalCase.client?.userId ?? null
  });
}

export function canUpdateAdminCase(actor: Principal, legalCase: CasePermissionProbe) {
  if (hasPermission(actor, "case.update.any")) {
    return true;
  }

  return hasPermission(actor, "case.update.assigned") && legalCase.assignedLawyerId === actor.id;
}

export function canManageCaseSessions(actor: Principal, legalCase: CasePermissionProbe) {
  if (hasPermission(actor, "session.manage.any")) {
    return true;
  }

  return hasPermission(actor, "session.manage.assigned") && legalCase.assignedLawyerId === actor.id;
}

export function canManageCalendarAppointment(actor: Principal, appointment: AppointmentPermissionProbe) {
  if (hasPermission(actor, "appointment.manage.any")) {
    return true;
  }

  return (
    hasPermission(actor, "session.manage.assigned") &&
    appointment.case?.deletedAt === null &&
    appointment.case?.assignedLawyerId === actor.id
  );
}

export function caseScopeWhereForPrincipal(actor: Principal): Prisma.LegalCaseWhereInput {
  if (hasPermission(actor, "case.read.any")) {
    return { deletedAt: null };
  }

  if (hasPermission(actor, "case.read.assigned")) {
    return { deletedAt: null, assignedLawyerId: actor.id };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Case read permission is required.");
}

export function appointmentEndAt(startsAt: Date, durationMinutes: number) {
  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

export function dateFromActionInput(value: string, fieldName: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", `${fieldName} is invalid.`);
  }

  return date;
}

function normalizeCaseListQuery(input: unknown) {
  return parseWithSchema(adminCaseListQuerySchema, input, "Case list query is invalid.");
}

function normalizeCalendarQuery(input: unknown) {
  return parseWithSchema(adminCalendarQuerySchema, input, "Calendar query is invalid.");
}

function orderByForCases(filters: AdminCaseListQuery): Prisma.LegalCaseOrderByWithRelationInput[] {
  return [{ [filters.sortBy]: filters.sortDirection }, { updatedAt: "desc" }];
}

function caseListWhere(actor: Principal, filters: AdminCaseListQuery): Prisma.LegalCaseWhereInput {
  const scope = caseScopeWhereForPrincipal(actor);
  const search = filters.q?.trim();
  const assignedLawyerId =
    filters.assignedLawyerId && hasPermission(actor, "case.read.any") ? filters.assignedLawyerId : undefined;

  return {
    AND: [
      scope,
      filters.status ? { status: filters.status } : {},
      filters.priority ? { priority: filters.priority } : {},
      filters.caseType ? { caseType: filters.caseType } : {},
      assignedLawyerId ? { assignedLawyerId } : {},
      search
        ? {
            OR: [
              { internalFileNumber: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
              { caseType: { contains: search, mode: "insensitive" } },
              { courtName: { contains: search, mode: "insensitive" } },
              { externalCaseNumber: { contains: search, mode: "insensitive" } },
              { client: { fullName: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search, mode: "insensitive" } } },
              { assignedLawyer: { name: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

export function appointmentScopeWhereForPrincipal(actor: Principal): Prisma.AppointmentWhereInput {
  if (hasPermission(actor, "appointment.manage.any")) {
    return {};
  }

  if (hasPermission(actor, "appointment.read.assigned") || hasPermission(actor, "case.read.assigned")) {
    return {
      OR: [{ lawyerId: actor.id }, { case: { assignedLawyerId: actor.id, deletedAt: null } }]
    };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Appointment calendar permission is required.");
}

function calendarWindow(filters: AdminCalendarQuery) {
  const now = new Date();
  const from = filters.from ? dateFromActionInput(filters.from, "from") : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = filters.to ? dateFromActionInput(filters.to, "to") : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (to.getTime() <= from.getTime()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Calendar end date must be after start date.");
  }

  return { from, to };
}

function calendarWhere(actor: Principal, filters: AdminCalendarQuery): Prisma.AppointmentWhereInput {
  const scope = appointmentScopeWhereForPrincipal(actor);
  const window = calendarWindow(filters);
  const lawyerId = filters.lawyerId && hasPermission(actor, "appointment.manage.any") ? filters.lawyerId : undefined;

  return {
    AND: [
      scope,
      { startsAt: { gte: window.from, lt: window.to } },
      filters.status ? { status: filters.status } : {},
      filters.mode ? { mode: filters.mode } : {},
      lawyerId ? { lawyerId } : {}
    ]
  };
}

async function findCaseForAction(
  actor: Principal,
  caseId: string,
  client: Pick<Prisma.TransactionClient, "legalCase"> = prisma
) {
  const legalCase = await client.legalCase.findUnique({
    where: { id: caseId },
    include: {
      client: { select: { id: true, fullName: true, phone: true, email: true, userId: true } },
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  if (!legalCase || legalCase.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Case was not found.");
  }

  if (!canReadAdminCase(actor, legalCase)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case record is not allowed.");
  }

  return legalCase;
}

async function assertCaseUpdateAllowed(actor: Principal, caseId: string) {
  const legalCase = await findCaseForAction(actor, caseId);
  if (!canUpdateAdminCase(actor, legalCase)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case update permission is required.");
  }

  return legalCase;
}

async function assertSessionManageAllowed(
  actor: Principal,
  caseId: string,
  client: Pick<Prisma.TransactionClient, "legalCase"> = prisma
) {
  const legalCase = await findCaseForAction(actor, caseId, client);
  if (!canManageCaseSessions(actor, legalCase)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Session management permission is required.");
  }

  return legalCase;
}

export async function listAdminCases(input: { actor: Principal; query: unknown }) {
  const filters = normalizeCaseListQuery(input.query);
  const pagination = toPagination(filters);
  const where = caseListWhere(input.actor, filters);

  const [items, total] = await Promise.all([
    prisma.legalCase.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
        assignedLawyer: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            sessions: true,
            appointments: true,
            documents: true,
            tasks: true
          }
        }
      },
      orderBy: orderByForCases(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.legalCase.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function getAdminCaseFilterOptions(actor: Principal) {
  const scope = caseScopeWhereForPrincipal(actor);
  const [caseTypes, lawyers] = await Promise.all([
    prisma.legalCase.findMany({
      where: {
        AND: [scope, { caseType: { not: "" } }]
      },
      distinct: ["caseType"],
      select: { caseType: true },
      orderBy: { caseType: "asc" }
    }),
    hasPermission(actor, "case.read.any") ? listAssignableCaseLawyers() : []
  ]);

  return {
    caseTypes: caseTypes.map((item) => item.caseType).filter(Boolean),
    lawyers
  };
}

export async function listAssignableCaseLawyers() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      role: { name: "Lawyer", status: "ACTIVE" }
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });
}

export async function listCalendarCaseOptions(actor: Principal) {
  const scope = caseScopeWhereForPrincipal(actor);

  return prisma.legalCase.findMany({
    where: {
      AND: [scope, { status: { in: [...openCaseStatusValues] } }]
    },
    select: {
      id: true,
      internalFileNumber: true,
      title: true,
      client: { select: { id: true, fullName: true } },
      assignedLawyer: { select: { id: true, name: true } }
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 80
  });
}

export async function getAdminCaseDetail(input: { actor: Principal; caseId: string }) {
  const caseId = parseWithSchema(uuidSchema, input.caseId, "Case id is invalid.");
  await findCaseForAction(input.actor, caseId);

  const legalCase = await prisma.legalCase.findUnique({
    where: { id: caseId },
    include: {
      client: { select: { id: true, fullName: true, phone: true, email: true, city: true, userId: true } },
      assignedLawyer: { select: { id: true, name: true, email: true } },
      parties: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, partyType: true, notes: true }
      },
      sessions: {
        orderBy: { sessionDate: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          appointment: { select: { id: true, startsAt: true, status: true, title: true } }
        }
      },
      appointments: {
        orderBy: { startsAt: "asc" },
        include: {
          lawyer: { select: { id: true, name: true } }
        }
      },
      _count: {
        select: {
          parties: true,
          sessions: true,
          appointments: true,
          documents: true,
          tasks: true
        }
      }
    }
  });

  if (!legalCase || legalCase.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Case was not found.");
  }

  return {
    ...legalCase,
    access: {
      canUpdate: canUpdateAdminCase(input.actor, legalCase),
      canManageSessions: canManageCaseSessions(input.actor, legalCase)
    }
  };
}

export async function updateAdminCaseStatus(input: { actor: Principal; caseId: string; body: unknown; request?: Request; requestId?: string }) {
  const caseId = parseWithSchema(uuidSchema, input.caseId, "Case id is invalid.");
  const body = parseWithSchema(caseStatusUpdateSchema, input.body, "Case status payload is invalid.");
  const existing = await assertCaseUpdateAllowed(input.actor, caseId);

  if (existing.status === body.status) {
    throw new ApiError(409, "CONFLICT", "Case already has this status.");
  }

  const updated = await prisma.legalCase.update({
    where: { id: caseId },
    data: { status: body.status },
    include: {
      client: { select: { id: true, fullName: true, userId: true } },
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "case.status_update",
    resourceType: "LegalCase",
    resourceId: caseId,
    clientId: updated.clientId,
    caseId,
    lawyerId: updated.assignedLawyerId,
    metadata: {
      previousStatus: existing.status,
      status: updated.status,
      reason: body.reason || null
    },
    request: input.request
  });

  captureAnalyticsEventBestEffort({
    name: "case.status_updated",
    source: "ADMIN",
    outcome: "SUCCESS",
    actor: input.actor,
    requestId: input.requestId,
    properties: {
      previousStatus: existing.status,
      status: updated.status,
      actorScope: input.actor.roleName === "Lawyer" ? "lawyer" : "admin"
    }
  });

  return updated;
}

export async function createAdminCaseSession(input: { actor: Principal; caseId: string; body: unknown; request?: Request }) {
  const caseId = parseWithSchema(uuidSchema, input.caseId, "Case id is invalid.");
  const body = parseWithSchema(caseSessionCreateSchema, input.body, "Case session payload is invalid.");
  const legalCase = await assertSessionManageAllowed(input.actor, caseId);
  const sessionDate = dateFromActionInput(body.sessionDate, "sessionDate");
  const nextSessionDate = body.nextSessionDate ? dateFromActionInput(body.nextSessionDate, "nextSessionDate") : null;

  const session = await prisma.caseSession.create({
    data: {
      caseId: legalCase.id,
      courtName: body.courtName || legalCase.courtName || null,
      sessionDate,
      decision: body.decision || null,
      nextAction: body.nextAction || null,
      nextSessionDate,
      createdById: input.actor.id
    },
    include: {
      createdBy: { select: { id: true, name: true } },
      appointment: { select: { id: true, startsAt: true, status: true, title: true } }
    }
  });

  if (nextSessionDate) {
    await prisma.legalCase.update({
      where: { id: legalCase.id },
      data: { nextSessionAt: nextSessionDate }
    });
  }

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "case.session_create",
    resourceType: "CaseSession",
    resourceId: session.id,
    clientId: legalCase.clientId,
    caseId: legalCase.id,
    lawyerId: legalCase.assignedLawyerId,
    metadata: {
      caseId: legalCase.id,
      sessionDate: session.sessionDate.toISOString(),
      nextSessionDate: nextSessionDate?.toISOString() ?? null
    },
    request: input.request
  });

  return session;
}

export async function listAdminCalendarAppointments(input: { actor: Principal; query: unknown }) {
  const filters = normalizeCalendarQuery(input.query);
  const where = calendarWhere(input.actor, filters);
  const window = calendarWindow(filters);

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      client: { select: { id: true, fullName: true, phone: true } },
      lawyer: { select: { id: true, name: true, email: true } },
      case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true, deletedAt: true } }
    },
    orderBy: { startsAt: "asc" },
    take: filters.pageSize
  });

  return { items: appointments, filters, from: window.from, to: window.to };
}

export async function createAdminCalendarAppointment(input: { actor: Principal; body: unknown; request?: Request }) {
  const body = parseWithSchema(calendarAppointmentCreateSchema, input.body, "Calendar appointment payload is invalid.");
  const startsAt = dateFromActionInput(body.startsAt, "startsAt");
  const endsAt = appointmentEndAt(startsAt, body.durationMinutes);

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry,
    operation: async (tx) => {
      const legalCase = await assertSessionManageAllowed(input.actor, body.caseId, tx);
      await assertNoAppointmentConflict({
        startsAt,
        endsAt,
        scope: { kind: "lawyer", lawyerId: legalCase.assignedLawyerId },
        client: tx
      });

      const appointment = await tx.appointment.create({
        data: {
          clientId: legalCase.clientId,
          lawyerId: legalCase.assignedLawyerId,
          caseId: legalCase.id,
          title: body.title,
          type: body.type,
          mode: body.mode,
          location: body.location || null,
          startsAt,
          endsAt,
          status: "SCHEDULED",
          notes: body.notes || null
        },
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          lawyer: { select: { id: true, name: true, email: true } },
          case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
        }
      });

      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: "calendar.appointment_create",
        resourceType: "Appointment",
        resourceId: appointment.id,
        clientId: appointment.clientId,
        caseId: legalCase.id,
        lawyerId: appointment.lawyerId,
        appointmentId: appointment.id,
        metadata: {
          caseId: legalCase.id,
          startsAt: appointment.startsAt.toISOString(),
          mode: appointment.mode,
          type: appointment.type
        },
        request: input.request
      });

      return appointment;
    }
  });
}

export async function rescheduleAdminCalendarAppointment(input: {
  actor: Principal;
  appointmentId: string;
  body: unknown;
  request?: Request;
}) {
  const appointmentId = parseWithSchema(uuidSchema, input.appointmentId, "Appointment id is invalid.");
  const body = parseWithSchema(appointmentRescheduleSchema, input.body, "Appointment reschedule payload is invalid.");
  const startsAt = dateFromActionInput(body.startsAt, "startsAt");
  const endsAt = appointmentEndAt(startsAt, body.durationMinutes);

  return runAppointmentConflictTransaction({
    mode: APPOINTMENT_TRANSACTION_MODES.existingUpdateSingleAttempt,
    operation: async (tx) => {
      const existing = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          case: { select: { id: true, assignedLawyerId: true, deletedAt: true } }
        }
      });

      if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Appointment was not found.");
      }
      if (!canManageCalendarAppointment(input.actor, existing)) {
        throw new ApiError(403, "PERMISSION_DENIED", "Appointment reschedule permission is required.");
      }
      if (existing.status === "CANCELLED" || existing.status === "COMPLETED" || existing.status === "NO_SHOW") {
        throw new ApiError(409, "CONFLICT", "Closed appointments cannot be rescheduled.");
      }

      const lawyerId = existing.lawyerId ?? existing.case?.assignedLawyerId;
      await assertNoAppointmentConflict({
        startsAt,
        endsAt,
        scope: lawyerId
          ? { kind: "lawyer", lawyerId }
          : { kind: "office-consultation" },
        excludeAppointmentId: appointmentId,
        client: tx
      });

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startsAt,
          endsAt,
          mode: body.mode ?? existing.mode,
          location: body.location || existing.location,
          status: "RESCHEDULED"
        },
        include: {
          client: { select: { id: true, fullName: true, phone: true } },
          lawyer: { select: { id: true, name: true, email: true } },
          case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
        }
      });

      await appendAuditLog({
        client: tx,
        actorId: input.actor.id,
        action: "calendar.appointment_reschedule",
        resourceType: "Appointment",
        resourceId: appointmentId,
        clientId: updated.clientId,
        caseId: existing.caseId,
        lawyerId: updated.lawyerId,
        appointmentId,
        metadata: {
          caseId: existing.caseId,
          previousStartsAt: existing.startsAt.toISOString(),
          startsAt: updated.startsAt.toISOString(),
          reason: body.reason || null
        },
        request: input.request
      });

      return updated;
    }
  });
}
