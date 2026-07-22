import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canReadAdminContactMessages } from "./contact-message-service";
import { listAdminNotifications, type NotificationCenterClient } from "./notification-service";
import { appointmentScopeWhereForPrincipal, caseScopeWhereForPrincipal } from "./case-operations-service";
import { clientScopeWhereForPrincipal } from "./client-crm-service";
import { consultationScopeWhereForPrincipal } from "./consultation-review-service";
import { taskScopeWhereForPrincipal } from "./task-document-service";

type MetricValue = number | null;

function metric(value: MetricValue, label: string, definition: string) {
  return { value, label, definition };
}

function optionalScope<T>(scope: () => T): T | null {
  try {
    return scope();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return null;
    }
    throw error;
  }
}

export function dashboardScopesForPrincipal(actor: Principal) {
  return {
    clients: optionalScope(() => clientScopeWhereForPrincipal(actor)),
    cases: optionalScope(() => caseScopeWhereForPrincipal(actor)),
    consultations: optionalScope(() => consultationScopeWhereForPrincipal(actor)),
    appointments: optionalScope(() => appointmentScopeWhereForPrincipal(actor)),
    tasks: optionalScope(() => taskScopeWhereForPrincipal(actor))
  };
}

export async function loadNewContactCount(
  actor: Principal,
  client: Pick<typeof prisma, "contactMessage"> = prisma
) {
  if (!canReadAdminContactMessages(actor)) return null;
  return client.contactMessage.count({ where: { status: "NEW" } });
}

export async function loadNotificationAttentionCount(actor: Principal, client?: NotificationCenterClient) {
  if (!hasPermission(actor, "notification.read.self")) return null;
  const snapshot = await listAdminNotifications({ actor, query: { limit: 1 }, client });
  return snapshot.attentionCount;
}

export async function getAdminDashboard(actor: Principal) {
  const now = new Date();
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const scopes = dashboardScopesForPrincipal(actor);
  const clientScope = scopes.clients;
  const caseScope = scopes.cases;
  const consultationScope = scopes.consultations;
  const appointmentScope = scopes.appointments;
  const taskScope = scopes.tasks;

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
          select: {
            id: true,
            fullName: true,
            status: true,
            createdAt: true,
            assignedLawyer: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        })
      : Promise.resolve([]),
    consultationScope
      ? prisma.consultationRequest.findMany({
          where: consultationScope,
          select: {
            id: true,
            fullName: true,
            status: true,
            serviceCategory: true,
            createdAt: true,
            assignedLawyer: { select: { id: true, name: true } }
          },
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
          select: {
            id: true,
            title: true,
            status: true,
            startsAt: true,
            mode: true,
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
          select: {
            id: true,
            internalFileNumber: true,
            title: true,
            status: true,
            updatedAt: true,
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
