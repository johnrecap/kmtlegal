import type { Prisma } from "@prisma/client";
import {
  canAccessAdminRoute,
  getAdminRoutePolicy,
  type AdminRouteId
} from "@/lib/admin-route-policy";
import { hasPermission, type PermissionKey, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canReadAdminContactMessages } from "./contact-message-service";
import { listAdminNotifications, type NotificationCenterClient } from "./notification-service";
import { appointmentScopeWhereForPrincipal, caseScopeWhereForPrincipal } from "./case-operations-service";
import { clientScopeWhereForPrincipal } from "./client-crm-service";
import { consultationScopeWhereForPrincipal } from "./consultation-review-service";
import {
  documentScopeWhereForPrincipal,
  taskScopeWhereForPrincipal
} from "./task-document-service";

const CAIRO_TIME_ZONE = "Africa/Cairo";
const DASHBOARD_QUEUE_LIMIT = 6;
const ACTIVE_APPOINTMENT_STATUSES = ["SCHEDULED", "RESCHEDULED"] as const;

export const DASHBOARD_METRIC_KEYS = [
  "appointments.today",
  "tasks.overdue",
  "consultations.unreviewed",
  "contacts.new",
  "documents.under-review",
  "cases.active",
  "clients.active"
] as const;

export const DASHBOARD_PRIORITY_SECTION_KEYS = [
  "tasks.overdue",
  "appointments.today",
  "consultations.unreviewed",
  "contacts.new",
  "documents.under-review"
] as const;

export const DASHBOARD_QUICK_ACTION_ROUTE_IDS = [
  "cases.create",
  "calendar.list",
  "contacts.list",
  "content.home",
  "roles.list"
] as const satisfies readonly AdminRouteId[];

export type DashboardMetricKey = (typeof DASHBOARD_METRIC_KEYS)[number];
export type DashboardPrioritySectionKey = (typeof DASHBOARD_PRIORITY_SECTION_KEYS)[number];
export type DashboardTimeframe = "before-generated-at" | "cairo-today" | "as-of-generated-at";
export type DashboardScopeKey = "office-wide" | "actor-assigned" | "actor-or-case-assigned" | "actor-owned";
export type DashboardDisplayValue = { text: string; dir: "auto" | "ltr" };

type DashboardMetricFields = {
  key: DashboardMetricKey;
  labelKey: string;
  definitionKey: string;
  timeframe: DashboardTimeframe;
  timeframeLabelKey: string;
  scopeKey: DashboardScopeKey;
  scopeLabelKey: string;
  href: string;
};

export type DashboardMetric = DashboardMetricFields & (
  | { state: "ready"; value: number }
  | { state: "unavailable"; value: null; recoveryKey: "admin.dashboard.metricUnavailable" }
);

export type DashboardPriorityItem =
  | {
      kind: "task";
      id: string;
      title: DashboardDisplayValue;
      priority: string;
      status: string;
      dueAt: string;
      caseReference?: DashboardDisplayValue;
      href: string;
    }
  | {
      kind: "appointment";
      id: string;
      title: DashboardDisplayValue;
      status: string;
      mode: string;
      startsAt: string;
      clientDisplayName?: DashboardDisplayValue;
      href: string;
    }
  | {
      kind: "consultation-review";
      id: string;
      reference: DashboardDisplayValue;
      applicantDisplayName: DashboardDisplayValue;
      startsAt?: string;
      createdAt: string;
      href: string;
    }
  | {
      kind: "contact-message";
      id: string;
      senderDisplayName: DashboardDisplayValue;
      topic: DashboardDisplayValue;
      createdAt: string;
      href: string;
    }
  | {
      kind: "document-review";
      id: string;
      fileName: DashboardDisplayValue;
      category: string;
      status: string;
      updatedAt: string;
      href: string;
    };

export type DashboardPrioritySection = {
  key: DashboardPrioritySectionKey;
  href: string;
} & (
  | { state: "ready"; items: DashboardPriorityItem[] }
  | {
      state: "unavailable";
      items: [];
      recoveryKey: "admin.dashboard.sectionUnavailable";
    }
);

export type DashboardActivity =
  | {
      kind: "case-updated";
      id: string;
      reference: DashboardDisplayValue;
      title: DashboardDisplayValue;
      status: string;
      occurredAt: string;
      href: string;
    }
  | {
      kind: "client-created";
      id: string;
      displayName: DashboardDisplayValue;
      status: string;
      occurredAt: string;
      href: string;
    }
  | {
      kind: "consultation-created";
      id: string;
      reference: DashboardDisplayValue;
      occurredAt: string;
      href: string;
    };

export type DashboardSnapshotV1 = {
  version: 1;
  generatedAt: string;
  metrics: DashboardMetric[];
  prioritySections: DashboardPrioritySection[];
  quickActionRouteIds: AdminRouteId[];
  recentActivity: DashboardActivity[];
};

type DashboardClient = Pick<
  typeof prisma,
  "appointment" | "task" | "consultationRequest" | "contactMessage" | "document" | "legalCase" | "client"
>;

type DashboardLoadContext = {
  actor: Principal;
  client: DashboardClient;
  generatedAt: Date;
  cairoRange: { start: Date; end: Date };
};

type DashboardDomainPayload = {
  count: number;
  items?: DashboardPriorityItem[];
  activities?: DashboardActivity[];
};

type DashboardLoadResult =
  | { state: "ready"; payload: DashboardDomainPayload }
  | { state: "unavailable" };

type DashboardMetricSpec = {
  key: DashboardMetricKey;
  permissions: readonly PermissionKey[];
  timeframe: DashboardTimeframe;
  tokenStem: string;
  href: (context: DashboardLoadContext) => string;
  scope: (actor: Principal) => DashboardScopeKey;
  load: (context: DashboardLoadContext) => Promise<DashboardDomainPayload>;
};

const timeframeLabelKeys: Record<DashboardTimeframe, string> = {
  "before-generated-at": "admin.dashboard.timeframe.beforeGeneratedAt",
  "cairo-today": "admin.dashboard.timeframe.cairoToday",
  "as-of-generated-at": "admin.dashboard.timeframe.asOfGeneratedAt"
};

const scopeLabelKeys: Record<DashboardScopeKey, string> = {
  "office-wide": "admin.dashboard.scope.officeWide",
  "actor-assigned": "admin.dashboard.scope.actorAssigned",
  "actor-or-case-assigned": "admin.dashboard.scope.actorOrCaseAssigned",
  "actor-owned": "admin.dashboard.scope.actorOwned"
};

const DASHBOARD_METRIC_SPECS: readonly DashboardMetricSpec[] = [
  {
    key: "appointments.today",
    permissions: ["appointment.manage.any", "appointment.read.assigned"],
    timeframe: "cairo-today",
    tokenStem: "admin.dashboard.metrics.appointmentsToday",
    href: appointmentHref,
    scope: (actor) => hasPermission(actor, "appointment.manage.any") ? "office-wide" : "actor-or-case-assigned",
    load: loadAppointments
  },
  {
    key: "tasks.overdue",
    permissions: ["task.manage.any", "task.manage.assigned", "task.read.assigned"],
    timeframe: "before-generated-at",
    tokenStem: "admin.dashboard.metrics.overdueTasks",
    href: () => "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc",
    scope: (actor) => hasPermission(actor, "task.manage.any") ? "office-wide" : "actor-or-case-assigned",
    load: loadTasks
  },
  {
    key: "consultations.unreviewed",
    permissions: ["consultation.review.any", "consultation.review.assigned"],
    timeframe: "as-of-generated-at",
    tokenStem: "admin.dashboard.metrics.unreviewedConsultations",
    href: () => "/admin/consultations?status=SCHEDULED&review=unreviewed",
    scope: (actor) => hasPermission(actor, "consultation.review.any") ? "office-wide" : "actor-assigned",
    load: loadConsultations
  },
  {
    key: "contacts.new",
    permissions: ["contact.read.any", "contact.manage.any"],
    timeframe: "as-of-generated-at",
    tokenStem: "admin.dashboard.metrics.newContacts",
    href: () => "/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc",
    scope: () => "office-wide",
    load: loadContacts
  },
  {
    key: "documents.under-review",
    permissions: ["document.manage.any", "document.read.assigned"],
    timeframe: "as-of-generated-at",
    tokenStem: "admin.dashboard.metrics.documentsUnderReview",
    href: () => "/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc",
    scope: (actor) => hasPermission(actor, "document.manage.any") ? "office-wide" : "actor-or-case-assigned",
    load: loadDocuments
  },
  {
    key: "cases.active",
    permissions: ["case.read.any", "case.read.assigned"],
    timeframe: "as-of-generated-at",
    tokenStem: "admin.dashboard.metrics.activeCases",
    href: () => "/admin/cases?status=ACTIVE&sortBy=updatedAt&sortDirection=desc",
    scope: (actor) => hasPermission(actor, "case.read.any") ? "office-wide" : "actor-or-case-assigned",
    load: loadCases
  },
  {
    key: "clients.active",
    permissions: ["client.read.any", "client.read.assigned"],
    timeframe: "as-of-generated-at",
    tokenStem: "admin.dashboard.metrics.activeClients",
    href: () => "/admin/clients?status=ACTIVE&sortBy=createdAt&sortDirection=desc",
    scope: (actor) => hasPermission(actor, "client.read.any") ? "office-wide" : "actor-assigned",
    load: loadClients
  }
];

function optionalScope<T>(scope: () => T): T | null {
  try {
    return scope();
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return null;
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

export function cairoDayRange(reference: Date) {
  const localDate = cairoDateOrdinal(reference);
  return {
    start: firstCairoInstant(localDate),
    end: firstCairoInstant(addUtcDays(localDate, 1))
  };
}

export async function getAdminDashboard(
  actor: Principal,
  options: { now?: Date; client?: DashboardClient } = {}
): Promise<DashboardSnapshotV1> {
  const generatedAt = options.now ?? new Date();
  const context: DashboardLoadContext = {
    actor,
    client: options.client ?? prisma,
    generatedAt,
    cairoRange: cairoDayRange(generatedAt)
  };
  const specs = DASHBOARD_METRIC_SPECS.filter((spec) => hasAnyPermission(actor, spec.permissions));
  const entries = await Promise.all(specs.map(async (spec) => [spec.key, await guardedLoad(() => spec.load(context))] as const));
  const results = new Map<DashboardMetricKey, DashboardLoadResult>(entries);

  return {
    version: 1,
    generatedAt: generatedAt.toISOString(),
    metrics: specs.map((spec) => dashboardMetric(spec, context, results.get(spec.key)!)),
    prioritySections: dashboardSections(specs, context, results),
    quickActionRouteIds: dashboardQuickActions(actor),
    recentActivity: dashboardRecentActivity(results)
  };
}

async function guardedLoad(load: () => Promise<DashboardDomainPayload>): Promise<DashboardLoadResult> {
  try {
    return { state: "ready", payload: await load() };
  } catch {
    // A loader failure is a recoverable partial-dashboard state; the caught error is never serialized.
    return { state: "unavailable" };
  }
}

function dashboardMetric(
  spec: DashboardMetricSpec,
  context: DashboardLoadContext,
  result: DashboardLoadResult
): DashboardMetric {
  const scopeKey = spec.scope(context.actor);
  const fields: DashboardMetricFields = {
    key: spec.key,
    labelKey: `${spec.tokenStem}.label`,
    definitionKey: `${spec.tokenStem}.definition`,
    timeframe: spec.timeframe,
    timeframeLabelKey: timeframeLabelKeys[spec.timeframe],
    scopeKey,
    scopeLabelKey: scopeLabelKeys[scopeKey],
    href: spec.href(context)
  };
  if (result.state === "ready") return { ...fields, state: "ready", value: result.payload.count };
  return { ...fields, state: "unavailable", value: null, recoveryKey: "admin.dashboard.metricUnavailable" };
}

function dashboardSections(
  specs: readonly DashboardMetricSpec[],
  context: DashboardLoadContext,
  results: ReadonlyMap<DashboardMetricKey, DashboardLoadResult>
): DashboardPrioritySection[] {
  const specsByKey = new Map(specs.map((spec) => [spec.key, spec]));
  const sections: DashboardPrioritySection[] = [];
  for (const key of DASHBOARD_PRIORITY_SECTION_KEYS) {
    const spec = specsByKey.get(key);
    if (!spec) continue;
    const result = results.get(key)!;
    const href = spec.href(context);
    if (result.state === "unavailable") {
      sections.push({ key, href, state: "unavailable", items: [], recoveryKey: "admin.dashboard.sectionUnavailable" });
      continue;
    }
    sections.push({ key, href, state: "ready", items: (result.payload.items ?? []).slice(0, DASHBOARD_QUEUE_LIMIT) });
  }
  return sections;
}

function dashboardQuickActions(actor: Principal) {
  return DASHBOARD_QUICK_ACTION_ROUTE_IDS.filter((routeId) =>
    Boolean(getAdminRoutePolicy(routeId) && canAccessAdminRoute(actor, routeId))
  );
}

function dashboardRecentActivity(results: ReadonlyMap<DashboardMetricKey, DashboardLoadResult>) {
  return [...results.values()]
    .flatMap((result) => result.state === "ready" ? result.payload.activities ?? [] : [])
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id))
    .slice(0, DASHBOARD_QUEUE_LIMIT);
}

async function loadAppointments(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const href = appointmentHref(context);
  const where: Prisma.AppointmentWhereInput = {
    AND: [
      appointmentScopeWhereForPrincipal(context.actor),
      { startsAt: { gte: context.cairoRange.start, lt: context.cairoRange.end }, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } }
    ]
  };
  const [count, rows] = await Promise.all([
    context.client.appointment.count({ where }),
    context.client.appointment.findMany({
      where,
      select: { id: true, title: true, status: true, mode: true, startsAt: true, client: { select: { fullName: true } } },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    items: rows.map((row) => ({
      kind: "appointment",
      id: row.id,
      title: displayValue(row.title),
      status: row.status,
      mode: row.mode,
      startsAt: row.startsAt.toISOString(),
      clientDisplayName: displayValue(row.client.fullName),
      href
    }))
  };
}

async function loadTasks(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const href = "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc";
  const where: Prisma.TaskWhereInput = {
    AND: [
      taskScopeWhereForPrincipal(context.actor),
      { dueDate: { lt: context.generatedAt }, status: { notIn: ["COMPLETED", "ARCHIVED"] } }
    ]
  };
  const [count, rows] = await Promise.all([
    context.client.task.count({ where }),
    context.client.task.findMany({
      where,
      select: { id: true, title: true, priority: true, status: true, dueDate: true, case: { select: { internalFileNumber: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    items: rows.map((row) => ({
      kind: "task",
      id: row.id,
      title: displayValue(row.title),
      priority: row.priority,
      status: row.status,
      dueAt: row.dueDate!.toISOString(),
      ...(row.case ? { caseReference: displayValue(row.case.internalFileNumber, "ltr") } : {}),
      href
    }))
  };
}

async function loadConsultations(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const href = "/admin/consultations?status=SCHEDULED&review=unreviewed";
  const scope = consultationScopeWhereForPrincipal(context.actor);
  const where: Prisma.ConsultationRequestWhereInput = {
    AND: [scope, { status: "SCHEDULED", secretaryReviewedAt: null }]
  };
  const [count, rows, activityRows] = await Promise.all([
    context.client.consultationRequest.count({ where }),
    context.client.consultationRequest.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        appointments: {
          where: { status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
          select: { startsAt: true },
          orderBy: [{ startsAt: "asc" }, { id: "asc" }],
          take: 1
        }
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    }),
    context.client.consultationRequest.findMany({
      where: scope,
      select: { id: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    items: rows.map((row) => ({
      kind: "consultation-review",
      id: row.id,
      reference: displayValue(row.id, "ltr"),
      applicantDisplayName: displayValue(row.fullName),
      ...(row.appointments[0] ? { startsAt: row.appointments[0].startsAt.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
      href: `/admin/consultations/${row.id}`
    })),
    activities: activityRows.map((row) => ({
      kind: "consultation-created",
      id: row.id,
      reference: displayValue(row.id, "ltr"),
      occurredAt: row.createdAt.toISOString(),
      href: `/admin/consultations/${row.id}`
    }))
  };
}

async function loadContacts(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const href = "/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc";
  const where = { status: "NEW" as const };
  const [count, rows] = await Promise.all([
    context.client.contactMessage.count({ where }),
    context.client.contactMessage.findMany({
      where,
      select: { id: true, fullName: true, topic: true, createdAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    items: rows.map((row) => ({
      kind: "contact-message",
      id: row.id,
      senderDisplayName: displayValue(row.fullName),
      topic: displayValue(row.topic),
      createdAt: row.createdAt.toISOString(),
      href
    }))
  };
}

async function loadDocuments(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const href = "/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc";
  const where: Prisma.DocumentWhereInput = {
    AND: [documentScopeWhereForPrincipal(context.actor), { status: "UNDER_REVIEW" }]
  };
  const [count, rows] = await Promise.all([
    context.client.document.count({ where }),
    context.client.document.findMany({
      where,
      select: { id: true, fileName: true, category: true, status: true, updatedAt: true },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    items: rows.map((row) => ({
      kind: "document-review",
      id: row.id,
      fileName: displayValue(row.fileName),
      category: row.category,
      status: row.status,
      updatedAt: row.updatedAt.toISOString(),
      href
    }))
  };
}

async function loadCases(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const scope = caseScopeWhereForPrincipal(context.actor);
  const [count, rows] = await Promise.all([
    context.client.legalCase.count({ where: { AND: [scope, { status: "ACTIVE" }] } }),
    context.client.legalCase.findMany({
      where: scope,
      select: { id: true, internalFileNumber: true, title: true, status: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    activities: rows.map((row) => ({
      kind: "case-updated",
      id: row.id,
      reference: displayValue(row.internalFileNumber, "ltr"),
      title: displayValue(row.title),
      status: row.status,
      occurredAt: row.updatedAt.toISOString(),
      href: `/admin/cases/${row.id}`
    }))
  };
}

async function loadClients(context: DashboardLoadContext): Promise<DashboardDomainPayload> {
  const scope = clientScopeWhereForPrincipal(context.actor);
  const [count, rows] = await Promise.all([
    context.client.client.count({ where: { AND: [scope, { status: "ACTIVE" }] } }),
    context.client.client.findMany({
      where: scope,
      select: { id: true, fullName: true, status: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: DASHBOARD_QUEUE_LIMIT
    })
  ]);
  return {
    count,
    activities: rows.map((row) => ({
      kind: "client-created",
      id: row.id,
      displayName: displayValue(row.fullName),
      status: row.status,
      occurredAt: row.createdAt.toISOString(),
      href: `/admin/clients/${row.id}`
    }))
  };
}

function appointmentHref(context: DashboardLoadContext) {
  return `/admin/calendar?from=${context.cairoRange.start.toISOString()}&to=${context.cairoRange.end.toISOString()}`;
}

function hasAnyPermission(actor: Principal, permissions: readonly PermissionKey[]) {
  return permissions.some((permission) => hasPermission(actor, permission));
}

function displayValue(text: string, dir: "auto" | "ltr" = "auto"): DashboardDisplayValue {
  return { text, dir };
}

function cairoDateOrdinal(date: Date) {
  const parts = cairoDateFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)!.value);
  return Date.UTC(value("year"), value("month") - 1, value("day"));
}

function firstCairoInstant(localDateOrdinal: number) {
  let low = localDateOrdinal - 18 * 60 * 60 * 1_000;
  let high = localDateOrdinal + 18 * 60 * 60 * 1_000;
  while (low < high) {
    const midpoint = Math.floor((low + high) / 2);
    if (cairoDateOrdinal(new Date(midpoint)) < localDateOrdinal) low = midpoint + 1;
    else high = midpoint;
  }
  return new Date(low);
}

function addUtcDays(utcOrdinal: number, days: number) {
  const date = new Date(utcOrdinal);
  date.setUTCDate(date.getUTCDate() + days);
  return date.getTime();
}

const cairoDateFormatter = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
  timeZone: CAIRO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
