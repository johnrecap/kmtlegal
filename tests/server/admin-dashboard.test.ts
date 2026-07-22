import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({
  clientCount: vi.fn(async () => 0),
  clientFindMany: vi.fn(async () => []),
  caseCount: vi.fn(async () => 0),
  caseFindMany: vi.fn(async () => []),
  consultationCount: vi.fn(async () => 0),
  consultationFindMany: vi.fn(async () => []),
  appointmentCount: vi.fn(async () => 0),
  appointmentFindMany: vi.fn(async () => []),
  taskCount: vi.fn(async () => 0),
  taskFindMany: vi.fn(async () => []),
  contactCount: vi.fn(async () => 0),
  contactFindMany: vi.fn(async () => []),
  documentCount: vi.fn(async () => 0),
  documentFindMany: vi.fn(async () => []),
  notificationFindMany: vi.fn(async (): Promise<Array<Record<string, unknown>>> => [])
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    client: { count: databaseMocks.clientCount, findMany: databaseMocks.clientFindMany },
    legalCase: {
      count: databaseMocks.caseCount,
      findMany: databaseMocks.caseFindMany,
      findUnique: vi.fn(async () => null)
    },
    consultationRequest: {
      count: databaseMocks.consultationCount,
      findMany: databaseMocks.consultationFindMany
    },
    appointment: {
      count: databaseMocks.appointmentCount,
      findMany: databaseMocks.appointmentFindMany
    },
    task: { count: databaseMocks.taskCount, findMany: databaseMocks.taskFindMany },
    contactMessage: { count: databaseMocks.contactCount, findMany: databaseMocks.contactFindMany },
    document: { count: databaseMocks.documentCount, findMany: databaseMocks.documentFindMany },
    notification: { findMany: databaseMocks.notificationFindMany }
  }
}));

import {
  DASHBOARD_METRIC_KEYS,
  DASHBOARD_PRIORITY_SECTION_KEYS,
  DASHBOARD_QUICK_ACTION_ROUTE_IDS,
  cairoDayRange,
  dashboardScopesForPrincipal,
  getAdminDashboard,
  loadNewContactCount,
  loadNotificationAttentionCount
} from "@/server/admin/dashboard-service";
import { appointmentScopeWhereForPrincipal, caseScopeWhereForPrincipal } from "@/server/admin/case-operations-service";
import { clientScopeWhereForPrincipal } from "@/server/admin/client-crm-service";
import { consultationScopeWhereForPrincipal } from "@/server/admin/consultation-review-service";
import { taskScopeWhereForPrincipal } from "@/server/admin/task-document-service";
import { PLAN35_PRINCIPALS } from "../fixtures/plan35-role-fixtures";

describe("admin dashboard canonical scope contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses destination visibility builders including case-inherited task and appointment scope", () => {
    const lawyer = PLAN35_PRINCIPALS.lawyer;
    const scopes = dashboardScopesForPrincipal(lawyer);

    expect(scopes.clients).toEqual(clientScopeWhereForPrincipal(lawyer));
    expect(scopes.cases).toEqual(caseScopeWhereForPrincipal(lawyer));
    expect(scopes.consultations).toEqual(consultationScopeWhereForPrincipal(lawyer));
    expect(scopes.appointments).toEqual(appointmentScopeWhereForPrincipal(lawyer));
    expect(scopes.tasks).toEqual(taskScopeWhereForPrincipal(lawyer));
    expect(scopes.appointments).toEqual({
      OR: [{ lawyerId: lawyer.id }, { case: { assignedLawyerId: lawyer.id, deletedAt: null } }]
    });
    expect(scopes.tasks).toEqual({
      OR: [{ assignedToId: lawyer.id }, { case: { assignedLawyerId: lawyer.id, deletedAt: null } }]
    });
  });

  it("returns null only for workstreams the principal cannot read", () => {
    const scopes = dashboardScopesForPrincipal(PLAN35_PRINCIPALS.marketingStaff);

    expect(scopes).toEqual({
      clients: null,
      cases: null,
      consultations: null,
      appointments: null,
      tasks: null
    });
  });

  it("uses explicit minimized selections instead of serializing Prisma records", async () => {
    await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });

    const listCalls = [
      databaseMocks.clientFindMany,
      databaseMocks.caseFindMany,
      databaseMocks.consultationFindMany,
      databaseMocks.appointmentFindMany,
      databaseMocks.taskFindMany,
      databaseMocks.contactFindMany,
      databaseMocks.documentFindMany
    ];

    for (const listCall of listCalls) {
      expect(listCall).toHaveBeenCalled();
      const [query] = listCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(query).toHaveProperty("select");
      expect(query).not.toHaveProperty("include");
      expect(JSON.stringify(query)).not.toMatch(/passwordHash|secretEncrypted|recoveryCodes|notes|summary|message|phone|email|fileKey/);
    }
  });

  it("emits the exact ordered metric, section, and route-registry action inventories", async () => {
    const snapshot = await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });

    expect(DASHBOARD_METRIC_KEYS).toEqual([
      "appointments.today",
      "tasks.overdue",
      "consultations.unreviewed",
      "contacts.new",
      "documents.under-review",
      "cases.active",
      "clients.active"
    ]);
    expect(snapshot.metrics.map((entry) => entry.key)).toEqual(DASHBOARD_METRIC_KEYS);
    expect(snapshot.prioritySections.map((entry) => entry.key)).toEqual(DASHBOARD_PRIORITY_SECTION_KEYS);
    expect(DASHBOARD_QUICK_ACTION_ROUTE_IDS).toEqual([
      "cases.create",
      "calendar.list",
      "contacts.list",
      "content.home",
      "roles.list"
    ]);
    expect(snapshot.quickActionRouteIds).toEqual(["cases.create", "calendar.list", "contacts.list"]);
    expect(snapshot.version).toBe(1);
    expect(snapshot.generatedAt).toBe("2026-07-22T10:00:00.000Z");

    for (const metric of snapshot.metrics) {
      expect(metric.labelKey).toMatch(/^admin\.dashboard\.metrics\..+\.label$/);
      expect(metric.definitionKey).toMatch(/^admin\.dashboard\.metrics\..+\.definition$/);
      expect(metric.timeframeLabelKey).toBe(`admin.dashboard.timeframe.${{
        "before-generated-at": "beforeGeneratedAt",
        "cairo-today": "cairoToday",
        "as-of-generated-at": "asOfGeneratedAt"
      }[metric.timeframe]}`);
      expect(metric.scopeLabelKey).toBe(`admin.dashboard.scope.${{
        "office-wide": "officeWide",
        "actor-assigned": "actorAssigned",
        "actor-or-case-assigned": "actorOrCaseAssigned",
        "actor-owned": "actorOwned"
      }[metric.scopeKey]}`);
    }

    for (const section of snapshot.prioritySections) {
      expect(section.items).toHaveLength(0);
      expect(section.items.length).toBeLessThanOrEqual(6);
    }
  });

  it("uses Cairo midnight boundaries and exact destination-equivalent hrefs", async () => {
    expect(cairoDayRange(new Date("2026-07-22T10:00:00.000Z"))).toEqual({
      start: new Date("2026-07-21T21:00:00.000Z"),
      end: new Date("2026-07-22T21:00:00.000Z")
    });
    expect(cairoDayRange(new Date("2026-01-22T10:00:00.000Z"))).toEqual({
      start: new Date("2026-01-21T22:00:00.000Z"),
      end: new Date("2026-01-22T22:00:00.000Z")
    });

    const snapshot = await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });
    const hrefs = Object.fromEntries(snapshot.metrics.map((metric) => [metric.key, metric.href]));

    expect(hrefs).toMatchObject({
      "appointments.today": "/admin/calendar?from=2026-07-21T21:00:00.000Z&to=2026-07-22T21:00:00.000Z",
      "tasks.overdue": "/admin/tasks?view=overdue&sortBy=dueDate&sortDirection=asc",
      "consultations.unreviewed": "/admin/consultations?status=SCHEDULED&review=unreviewed",
      "contacts.new": "/admin/contact-messages?status=NEW&sortBy=createdAt&sortDirection=asc",
      "documents.under-review": "/admin/documents?status=UNDER_REVIEW&sortBy=updatedAt&sortDirection=asc",
      "cases.active": "/admin/cases?status=ACTIVE&sortBy=updatedAt&sortDirection=desc",
      "clients.active": "/admin/clients?status=ACTIVE&sortBy=createdAt&sortDirection=desc"
    });
  });

  it("uses bounded purpose-built queues, exact tie-breakers, and only the documented item/activity unions", async () => {
    databaseMocks.taskFindMany.mockResolvedValueOnce([{
      id: "task-1",
      title: "مهمة عاجلة",
      priority: "URGENT",
      status: "OVERDUE",
      dueDate: new Date("2026-07-21T08:00:00.000Z"),
      case: { internalFileNumber: "KMT-2026-001" }
    }] as never);
    databaseMocks.appointmentFindMany.mockResolvedValueOnce([{
      id: "appointment-1",
      title: "جلسة",
      status: "SCHEDULED",
      mode: "COURT",
      startsAt: new Date("2026-07-22T09:00:00.000Z"),
      client: { fullName: "عميل" }
    }] as never);
    databaseMocks.consultationFindMany
      .mockResolvedValueOnce([{
        id: "consultation-queue",
        fullName: "طالب استشارة",
        createdAt: new Date("2026-07-20T08:00:00.000Z"),
        appointments: []
      }] as never)
      .mockResolvedValueOnce([{
        id: "consultation-activity",
        createdAt: new Date("2026-07-22T10:00:00.000Z")
      }] as never);
    databaseMocks.contactFindMany.mockResolvedValueOnce([{
      id: "contact-1",
      fullName: "مرسل",
      topic: "documents",
      createdAt: new Date("2026-07-22T08:00:00.000Z")
    }] as never);
    databaseMocks.documentFindMany.mockResolvedValueOnce([{
      id: "document-1",
      fileName: "evidence.pdf",
      category: "EVIDENCE",
      status: "UNDER_REVIEW",
      updatedAt: new Date("2026-07-22T07:00:00.000Z")
    }] as never);
    databaseMocks.caseFindMany.mockResolvedValueOnce([{
      id: "case-1",
      internalFileNumber: "KMT-2026-002",
      title: "قضية تجريبية",
      status: "ACTIVE",
      updatedAt: new Date("2026-07-22T11:00:00.000Z")
    }] as never);
    databaseMocks.clientFindMany.mockResolvedValueOnce([{
      id: "client-1",
      fullName: "عميل جديد",
      status: "ACTIVE",
      createdAt: new Date("2026-07-22T12:00:00.000Z")
    }] as never);

    const snapshot = await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin, {
      now: new Date("2026-07-22T13:00:00.000Z")
    });

    expect(snapshot.prioritySections.flatMap((section) => section.items).map((item) => item.kind)).toEqual([
      "task",
      "appointment",
      "consultation-review",
      "contact-message",
      "document-review"
    ]);
    expect(snapshot.recentActivity.map((activity) => activity.kind)).toEqual([
      "client-created",
      "case-updated",
      "consultation-created"
    ]);
    expect(snapshot.prioritySections.every((section) => section.items.length <= 6)).toBe(true);
    expect(snapshot.recentActivity.length).toBeLessThanOrEqual(6);

    const [taskQuery] = databaseMocks.taskFindMany.mock.calls[0] as unknown as [Record<string, unknown>];
    const [appointmentQuery] = databaseMocks.appointmentFindMany.mock.calls[0] as unknown as [Record<string, unknown>];
    const [contactQuery] = databaseMocks.contactFindMany.mock.calls[0] as unknown as [Record<string, unknown>];
    const [documentQuery] = databaseMocks.documentFindMany.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(taskQuery).toMatchObject({
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { id: "asc" }],
      take: 6
    });
    expect(appointmentQuery).toMatchObject({ orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: 6 });
    expect(contactQuery).toMatchObject({
      where: { status: "NEW" },
      select: { id: true, fullName: true, topic: true, createdAt: true },
      take: 6
    });
    expect(documentQuery).toMatchObject({
      select: { id: true, fileName: true, category: true, status: true, updatedAt: true },
      take: 6
    });
  });

  it("isolates one loader failure into ready/unavailable unions without exposing the error", async () => {
    databaseMocks.taskCount.mockRejectedValueOnce(new Error("private database host failed"));

    const snapshot = await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });
    const taskMetric = snapshot.metrics.find((entry) => entry.key === "tasks.overdue");
    const taskSection = snapshot.prioritySections.find((entry) => entry.key === "tasks.overdue");
    const appointmentMetric = snapshot.metrics.find((entry) => entry.key === "appointments.today");

    expect(taskMetric).toMatchObject({ state: "unavailable", value: null, recoveryKey: "admin.dashboard.metricUnavailable" });
    expect(taskSection).toMatchObject({ state: "unavailable", items: [], recoveryKey: "admin.dashboard.sectionUnavailable" });
    expect(appointmentMetric).toMatchObject({ state: "ready", value: 0 });
    expect(JSON.stringify(snapshot)).not.toContain("private database host failed");
  });

  it("omits unauthorized capabilities instead of emitting placeholder entries", async () => {
    const marketingSnapshot = await getAdminDashboard(PLAN35_PRINCIPALS.marketingStaff, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });
    const lawyerSnapshot = await getAdminDashboard(PLAN35_PRINCIPALS.lawyer, {
      now: new Date("2026-07-22T10:00:00.000Z")
    });

    expect(marketingSnapshot.metrics).toEqual([]);
    expect(marketingSnapshot.prioritySections).toEqual([]);
    expect(marketingSnapshot.quickActionRouteIds).toEqual(["content.home"]);
    expect(lawyerSnapshot.quickActionRouteIds).toEqual(["calendar.list"]);
    expect(lawyerSnapshot.metrics.map((entry) => entry.key)).toEqual([
      "appointments.today",
      "tasks.overdue",
      "consultations.unreviewed",
      "documents.under-review",
      "cases.active",
      "clients.active"
    ]);
  });

  it("loads contact and notification counts only inside each principal's permission scope", async () => {
    databaseMocks.contactCount.mockResolvedValueOnce(7);
    databaseMocks.notificationFindMany.mockResolvedValueOnce([
      {
        id: "71000000-0000-4000-8000-000000000001",
        title: "إشعار اختبار",
        body: "تفاصيل آمنة",
        type: "SYSTEM",
        resourceType: null,
        resourceId: null,
        actionUrl: "/admin/notifications",
        readAt: null,
        createdAt: new Date("2026-07-22T12:00:00.000Z")
      }
    ]);

    await expect(loadNewContactCount(PLAN35_PRINCIPALS.officeAdmin)).resolves.toBe(7);
    await expect(loadNewContactCount(PLAN35_PRINCIPALS.lawyer)).resolves.toBeNull();
    await expect(loadNotificationAttentionCount(PLAN35_PRINCIPALS.marketingStaff)).resolves.toBe(1);
    await expect(
      loadNotificationAttentionCount({ ...PLAN35_PRINCIPALS.marketingStaff, permissions: [] })
    ).resolves.toBeNull();
    expect(databaseMocks.contactCount).toHaveBeenCalledOnce();
    expect(databaseMocks.notificationFindMany).toHaveBeenCalledOnce();
  });
});
