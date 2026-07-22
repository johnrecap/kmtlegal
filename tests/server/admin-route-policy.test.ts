import { describe, expect, it } from "vitest";
import {
  ADMIN_ROUTE_POLICIES,
  canAccessAdminRoute,
  getAdminRoutePolicy,
  type AdminRouteId,
  type AdminRoutePolicy
} from "@/lib/admin-route-policy";
import { PLAN35_ROLE_FIXTURES, PLAN35_ROLE_KEYS, type Plan35RoleKey } from "../fixtures/plan35-role-fixtures";

type RouteAcceptance = Readonly<Record<Plan35RoleKey, boolean>>;
type RouteFixture = { id: AdminRouteId; href: string; state: "implemented" | "planned"; defaultAccess: RouteAcceptance };
const access = (lawyer: boolean, secretary: boolean, officeAdmin: boolean, marketingStaff: boolean, superAdmin = true): RouteAcceptance => ({ lawyer, secretary, officeAdmin, marketingStaff, superAdmin });

export const FINAL_PLAN35_ADMIN_ROUTE_MATRIX: readonly RouteFixture[] = [
  { id: "dashboard.home", href: "/admin", state: "implemented", defaultAccess: access(true, true, true, true) },
  { id: "consultations.availability", href: "/admin/consultation-availability", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "consultations.list", href: "/admin/consultations", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "clients.list", href: "/admin/clients", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "messages.list", href: "/admin/messages", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "cases.list", href: "/admin/cases", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "cases.create", href: "/admin/cases/new", state: "planned", defaultAccess: access(false, true, true, false) },
  { id: "calendar.list", href: "/admin/calendar", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "tasks.list", href: "/admin/tasks", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "documents.list", href: "/admin/documents", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "finance.list", href: "/admin/finance", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "reports.list", href: "/admin/reports", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "content.home", href: "/admin/content", state: "implemented", defaultAccess: access(false, false, false, true) },
  { id: "contacts.list", href: "/admin/contact-messages", state: "planned", defaultAccess: access(false, true, true, false) },
  { id: "notifications.list", href: "/admin/notifications", state: "planned", defaultAccess: access(true, true, true, true) },
  { id: "users.list", href: "/admin/users", state: "implemented", defaultAccess: access(false, false, false, false) },
  { id: "roles.list", href: "/admin/roles", state: "planned", defaultAccess: access(false, false, false, false) },
  { id: "settings.home", href: "/admin/settings", state: "implemented", defaultAccess: access(false, false, false, false) },
  { id: "audit.list", href: "/admin/audit-log", state: "implemented", defaultAccess: access(false, false, false, false) }
] as const;

const PLANNED_ROUTE_IDS = ["contacts.list", "notifications.list", "cases.create", "roles.list"] as const;

describe("PLAN-35 canonical admin route policy", () => {
  it("keeps one final nineteen-route by five-role fixture", () => {
    expect(FINAL_PLAN35_ADMIN_ROUTE_MATRIX).toHaveLength(19);
    expect(new Set(FINAL_PLAN35_ADMIN_ROUTE_MATRIX.map(({ id }) => id)).size).toBe(19);
    for (const item of FINAL_PLAN35_ADMIN_ROUTE_MATRIX) {
      expect(Object.keys(item.defaultAccess).sort()).toEqual([...PLAN35_ROLE_KEYS].sort());
    }
  });

  it("registers only the fifteen executable destinations", () => {
    const implemented = FINAL_PLAN35_ADMIN_ROUTE_MATRIX.filter(({ state }) => state === "implemented");
    expect(ADMIN_ROUTE_POLICIES.map(({ id }) => id)).toEqual(implemented.map(({ id }) => id));
    expect(implemented).toHaveLength(15);
  });

  it("keeps planned destinations undiscoverable", () => {
    for (const id of PLANNED_ROUTE_IDS) expect(getAdminRoutePolicy(id)).toBeUndefined();
  });

  it("matches the implemented default-role matrix", () => {
    for (const expected of FINAL_PLAN35_ADMIN_ROUTE_MATRIX.filter(({ state }) => state === "implemented")) {
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
