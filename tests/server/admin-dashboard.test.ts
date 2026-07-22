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
  taskCount: vi.fn(async () => 0)
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    client: { count: databaseMocks.clientCount, findMany: databaseMocks.clientFindMany },
    legalCase: { count: databaseMocks.caseCount, findMany: databaseMocks.caseFindMany },
    consultationRequest: {
      count: databaseMocks.consultationCount,
      findMany: databaseMocks.consultationFindMany
    },
    appointment: {
      count: databaseMocks.appointmentCount,
      findMany: databaseMocks.appointmentFindMany
    },
    task: { count: databaseMocks.taskCount }
  }
}));

import { dashboardScopesForPrincipal, getAdminDashboard } from "@/server/admin/dashboard-service";
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
});
