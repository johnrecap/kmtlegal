import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_ROUTE_POLICIES,
  canAccessAdminPath,
  canAccessAdminRoute,
  filterAdminRoutePolicies,
  getAdminRoutePolicy,
  isAdminRouteActive,
  resolveAdminRoutePolicy,
  type AdminRouteId,
  type AdminRoutePolicy
} from "@/lib/admin-route-policy";
import { plan35AdminRouteGroupLabels, plan35AdminRouteLabels } from "@/lib/ui-copy";
import {
  FINAL_PLAN35_ADMIN_ROUTE_MATRIX,
  PLAN35_IMPLEMENTED_ADMIN_ROUTES
} from "../fixtures/plan35-admin-route-fixtures";
import { PLAN35_ROLE_FIXTURES, PLAN35_ROLE_KEYS } from "../fixtures/plan35-role-fixtures";

const PLANNED_ROUTE_IDS = ["contacts.list", "notifications.list", "cases.create", "roles.list"] as const;
const PROTECTED_CHILD_ROUTES = [
  ["/admin/consultations/35000000-0000-4000-8000-000000000101", "consultations.list"],
  ["/admin/clients/35000000-0000-4000-8000-000000000102", "clients.list"],
  ["/admin/messages/35000000-0000-4000-8000-000000000103", "messages.list"],
  ["/admin/cases/35000000-0000-4000-8000-000000000104", "cases.list"],
  ["/admin/content/articles", "content.home"],
  ["/admin/content/case-studies", "content.home"],
  ["/admin/content/social", "content.home"],
  ["/admin/users/35000000-0000-4000-8000-000000000105", "users.list"]
] as const satisfies readonly (readonly [string, AdminRouteId])[];
const ADMIN_PAGE_FILES = [
  "page.tsx",
  "consultation-availability/page.tsx",
  "consultations/page.tsx",
  "consultations/[consultationId]/page.tsx",
  "clients/page.tsx",
  "clients/[clientId]/page.tsx",
  "messages/page.tsx",
  "messages/[threadId]/page.tsx",
  "cases/page.tsx",
  "cases/[caseId]/page.tsx",
  "calendar/page.tsx",
  "tasks/page.tsx",
  "documents/page.tsx",
  "finance/page.tsx",
  "reports/page.tsx",
  "content/page.tsx",
  "content/articles/page.tsx",
  "content/case-studies/page.tsx",
  "content/social/page.tsx",
  "users/page.tsx",
  "users/[userId]/page.tsx",
  "settings/page.tsx",
  "audit-log/page.tsx"
] as const;

describe("PLAN-35 canonical admin route policy", () => {
  it("keeps one final nineteen-route by five-role fixture", () => {
    expect(FINAL_PLAN35_ADMIN_ROUTE_MATRIX).toHaveLength(19);
    expect(new Set(FINAL_PLAN35_ADMIN_ROUTE_MATRIX.map(({ id }) => id)).size).toBe(19);
    for (const item of FINAL_PLAN35_ADMIN_ROUTE_MATRIX) {
      expect(Object.keys(item.defaultAccess).sort()).toEqual([...PLAN35_ROLE_KEYS].sort());
    }
  });

  it("registers only the fifteen executable destinations", () => {
    expect(ADMIN_ROUTE_POLICIES.map(({ id }) => id)).toEqual(PLAN35_IMPLEMENTED_ADMIN_ROUTES.map(({ id }) => id));
    expect(PLAN35_IMPLEMENTED_ADMIN_ROUTES).toHaveLength(15);
  });

  it("keeps planned destinations undiscoverable", () => {
    for (const id of PLANNED_ROUTE_IDS) expect(getAdminRoutePolicy(id)).toBeUndefined();
    expect(resolveAdminRoutePolicy("/admin/cases/new")).toBeUndefined();
  });

  it("keeps route presentation metadata inside typed copy and group catalogs", () => {
    for (const policy of ADMIN_ROUTE_POLICIES) {
      expect(plan35AdminRouteLabels[policy.labelKey]).toBeTruthy();
      expect(plan35AdminRouteGroupLabels[policy.group]).toBeTruthy();
      expect(policy.icon).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("resolves exact routes before the longest eligible child prefix", () => {
    expect(resolveAdminRoutePolicy("/admin")?.id).toBe("dashboard.home");
    expect(resolveAdminRoutePolicy("/admin/")?.id).toBe("dashboard.home");
    expect(resolveAdminRoutePolicy("/admin/content/articles?status=draft")?.id).toBe("content.home");
    expect(resolveAdminRoutePolicy("/admin/content/social/scheduled")?.id).toBe("content.home");
    expect(resolveAdminRoutePolicy("/admin/contentious")).toBeUndefined();
    expect(resolveAdminRoutePolicy("/admin/unknown")).toBeUndefined();
  });

  it("inherits list capability for every implemented detail and content child", () => {
    for (const [pathname, routeId] of PROTECTED_CHILD_ROUTES) {
      expect(resolveAdminRoutePolicy(pathname)?.id, pathname).toBe(routeId);
      for (const roleKey of PLAN35_ROLE_KEYS) {
        expect(canAccessAdminPath(PLAN35_ROLE_FIXTURES[roleKey].principal, pathname), `${pathname}:${roleKey}`).toBe(
          canAccessAdminRoute(PLAN35_ROLE_FIXTURES[roleKey].principal, routeId)
        );
      }
    }
  });

  it("uses the same matcher for current-route state and direct authorization", () => {
    for (const policy of ADMIN_ROUTE_POLICIES) {
      expect(isAdminRouteActive(policy, policy.href)).toBe(true);
      expect(canAccessAdminPath(PLAN35_ROLE_FIXTURES.superAdmin.principal, policy.href)).toBe(
        canAccessAdminRoute(PLAN35_ROLE_FIXTURES.superAdmin.principal, policy)
      );
    }
    expect(isAdminRouteActive(getAdminRoutePolicy("cases.list")!, "/admin/cases/new")).toBe(false);
  });

  it("filters discovery with the same five-role capability matrix", () => {
    for (const roleKey of PLAN35_ROLE_KEYS) {
      const visibleIds = filterAdminRoutePolicies(PLAN35_ROLE_FIXTURES[roleKey].principal).map(({ id }) => id);
      const expectedIds = FINAL_PLAN35_ADMIN_ROUTE_MATRIX
        .filter(({ state, defaultAccess }) => state === "implemented" && defaultAccess[roleKey])
        .map(({ id }) => id);
      expect(visibleIds, roleKey).toEqual(expectedIds);
    }
  });

  it("keeps every implemented page on the same registry-aware direct guard", () => {
    const guardSource = readFileSync(join(process.cwd(), "src/server/auth/page-guards.tsx"), "utf8");
    expect(guardSource).toContain("canAccessAdminPath(guard.context.principal, nextPath)");
    for (const relativePath of ADMIN_PAGE_FILES) {
      const pageSource = readFileSync(join(process.cwd(), "src/app/(app-ar)/admin", relativePath), "utf8");
      expect(pageSource, relativePath).toContain("requireAdminRoutePage(");
      expect(pageSource, relativePath).not.toContain("requireAdminPage(");
    }
  });

  it("matches the implemented default-role matrix", () => {
    for (const expected of PLAN35_IMPLEMENTED_ADMIN_ROUTES) {
      const policy = getAdminRoutePolicy(expected.id);
      expect(policy).toBeDefined();
      expect(policy?.href).toBe(expected.href);
      for (const key of PLAN35_ROLE_KEYS) {
        expect(canAccessAdminRoute(PLAN35_ROLE_FIXTURES[key].principal, policy!), `${expected.id}:${key}`).toBe(expected.defaultAccess[key]);
      }
    }
  });

  it("enforces all-permission and exact-role constraints independently", () => {
    const policy: AdminRoutePolicy = {
      id: "roles.list",
      href: "/admin/roles",
      activeMatch: "prefix",
      group: "administration",
      labelKey: "admin.routes.roles.list",
      icon: "admin_panel_settings",
      requiredAnyPermissions: [],
      requiredAllPermissions: ["role.manage.any", "permission.manage.any"],
      exactRole: "Super Admin",
      staffFallback: false
    };
    const delegated = { ...PLAN35_ROLE_FIXTURES.officeAdmin.principal, permissions: ["role.manage.any", "permission.manage.any"] };
    const incomplete = { ...PLAN35_ROLE_FIXTURES.superAdmin.principal, roleName: "Office Admin", permissions: ["role.manage.any"] };
    expect(canAccessAdminRoute(PLAN35_ROLE_FIXTURES.superAdmin.principal, policy)).toBe(true);
    expect(canAccessAdminRoute(delegated, policy)).toBe(false);
    expect(canAccessAdminRoute(incomplete, policy)).toBe(false);
  });
});
