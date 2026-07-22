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
  contactCount: vi.fn(async () => 0),
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
    task: { count: databaseMocks.taskCount },
    contactMessage: { count: databaseMocks.contactCount },
    notification: { findMany: databaseMocks.notificationFindMany }
  }
}));

import {
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
    await getAdminDashboard(PLAN35_PRINCIPALS.officeAdmin);

    const listCalls = [
      databaseMocks.clientFindMany,
      databaseMocks.caseFindMany,
      databaseMocks.consultationFindMany,
      databaseMocks.appointmentFindMany
    ];

    for (const listCall of listCalls) {
      expect(listCall).toHaveBeenCalled();
      const [query] = listCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(query).toHaveProperty("select");
      expect(query).not.toHaveProperty("include");
      expect(JSON.stringify(query)).not.toMatch(/passwordHash|secretEncrypted|recoveryCodes|notes|summary|phone|email/);
    }
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
