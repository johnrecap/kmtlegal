import { Prisma } from "@prisma/client";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { clientScopeWhereForPrincipal } from "./client-crm-service";

type MetricValue = number | null;

function metric(value: MetricValue, label: string, definition: string) {
  return { value, label, definition };
}

function optionalClientScope(actor: Principal): Prisma.ClientWhereInput | null {
  try {
    return clientScopeWhereForPrincipal(actor);
  } catch {
    return null;
  }
}

function optionalCaseScope(actor: Principal): Prisma.LegalCaseWhereInput | null {
  if (hasPermission(actor, "case.read.any")) {
    return { deletedAt: null };
  }
  if (hasPermission(actor, "case.read.assigned")) {
    return { deletedAt: null, assignedLawyerId: actor.id };
  }
  return null;
}

function optionalConsultationScope(actor: Principal): Prisma.ConsultationRequestWhereInput | null {
  if (hasPermission(actor, "consultation.review.any")) {
    return {};
  }
  if (hasPermission(actor, "consultation.review.assigned")) {
    return { assignedLawyerId: actor.id };
  }
  return null;
}

function optionalAppointmentScope(actor: Principal): Prisma.AppointmentWhereInput | null {
  if (hasPermission(actor, "appointment.manage.any")) {
    return {};
  }
  if (hasPermission(actor, "appointment.read.assigned")) {
    return { lawyerId: actor.id };
  }
  return null;
}

function optionalTaskScope(actor: Principal): Prisma.TaskWhereInput | null {
  if (hasPermission(actor, "task.manage.any")) {
    return {};
  }
  if (hasPermission(actor, "task.read.assigned") || hasPermission(actor, "task.manage.assigned")) {
    return { assignedToId: actor.id };
  }
  return null;
}

export async function getAdminDashboard(actor: Principal) {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const clientScope = optionalClientScope(actor);
  const caseScope = optionalCaseScope(actor);
  const consultationScope = optionalConsultationScope(actor);
  const appointmentScope = optionalAppointmentScope(actor);
  const taskScope = optionalTaskScope(actor);

  const [
    activeClients,
    openCases,
    pendingConsultations,
    upcomingAppointmentsCount,
    openTasks,
    latestClients,
    recentConsultations,
    upcomingAppointments,
    recentCases
  ] = await Promise.all([
    clientScope
      ? prisma.client.count({
          where: { AND: [clientScope, { status: "ACTIVE" }] }
        })
      : Promise.resolve(null),
    caseScope
      ? prisma.legalCase.count({
          where: { AND: [caseScope, { status: { in: ["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT"] } }] }
        })
      : Promise.resolve(null),
    consultationScope
      ? prisma.consultationRequest.count({
          where: { AND: [consultationScope, { status: { in: ["NEW", "REVIEWING", "SCHEDULED"] } }] }
        })
      : Promise.resolve(null),
    appointmentScope
      ? prisma.appointment.count({
          where: {
            AND: [
              appointmentScope,
              {
                startsAt: { gte: now, lt: twoWeeksFromNow },
                status: { in: ["SCHEDULED", "RESCHEDULED"] }
              }
            ]
          }
        })
      : Promise.resolve(null),
    taskScope
      ? prisma.task.count({
          where: { AND: [taskScope, { status: { in: ["NEW", "IN_PROGRESS", "REVIEW", "OVERDUE"] } }] }
        })
      : Promise.resolve(null),
    clientScope
      ? prisma.client.findMany({
          where: clientScope,
          include: { assignedLawyer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      : Promise.resolve([]),
    consultationScope
      ? prisma.consultationRequest.findMany({
          where: consultationScope,
          include: { assignedLawyer: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      : Promise.resolve([]),
    appointmentScope
      ? prisma.appointment.findMany({
          where: {
            AND: [
              appointmentScope,
              {
                startsAt: { gte: now },
                status: { in: ["SCHEDULED", "RESCHEDULED"] }
              }
            ]
          },
          include: {
            client: { select: { id: true, fullName: true } },
            lawyer: { select: { id: true, name: true } },
            case: { select: { id: true, internalFileNumber: true, title: true } }
          },
          orderBy: { startsAt: "asc" },
          take: 5
        })
      : Promise.resolve([]),
    caseScope
      ? prisma.legalCase.findMany({
          where: caseScope,
          include: {
            client: { select: { id: true, fullName: true } },
            assignedLawyer: { select: { id: true, name: true } }
          },
          orderBy: { updatedAt: "desc" },
          take: 5
        })
      : Promise.resolve([])
  ]);

  return {
    metrics: {
      activeClients: metric(activeClients, "عملاء نشطون", "عدد العملاء بحالة ACTIVE داخل نطاق صلاحياتك."),
      openCases: metric(openCases, "قضايا مفتوحة", "القضايا غير المغلقة أو المؤرشفة داخل نطاق صلاحياتك."),
      pendingConsultations: metric(pendingConsultations, "استشارات قيد المتابعة", "طلبات NEW/REVIEWING/SCHEDULED التي تستطيع مراجعتها."),
      upcomingAppointments: metric(upcomingAppointmentsCount, "مواعيد خلال 14 يوم", "مواعيد SCHEDULED/RESCHEDULED القادمة خلال أسبوعين."),
      openTasks: metric(openTasks, "مهام مفتوحة", "مهام NEW/IN_PROGRESS/REVIEW/OVERDUE داخل نطاق صلاحياتك.")
    },
    latestClients,
    recentConsultations,
    upcomingAppointments,
    recentCases,
    access: {
      clients: Boolean(clientScope),
      cases: Boolean(caseScope),
      consultations: Boolean(consultationScope),
      appointments: Boolean(appointmentScope),
      tasks: Boolean(taskScope)
    }
  };
}
