import type { AdminRouteId } from "@/lib/admin-route-policy";
import type { Plan35RoleKey } from "./plan35-role-fixtures";

export type Plan35RouteAcceptance = Readonly<Record<Plan35RoleKey, boolean>>;

export type Plan35AdminRouteFixture = {
  id: AdminRouteId;
  href: string;
  apiProbe: string;
  state: "implemented" | "planned";
  defaultAccess: Plan35RouteAcceptance;
};

function access(
  lawyer: boolean,
  secretary: boolean,
  officeAdmin: boolean,
  marketingStaff: boolean,
  superAdmin = true
): Plan35RouteAcceptance {
  return { lawyer, secretary, officeAdmin, marketingStaff, superAdmin };
}

export const FINAL_PLAN35_ADMIN_ROUTE_MATRIX: readonly Plan35AdminRouteFixture[] = [
  { id: "dashboard.home", href: "/admin", apiProbe: "/api/admin/dashboard", state: "implemented", defaultAccess: access(true, true, true, true) },
  { id: "consultations.availability", href: "/admin/consultation-availability", apiProbe: "/api/admin/consultation-availability", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "consultations.list", href: "/admin/consultations", apiProbe: "/api/admin/consultations", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "clients.list", href: "/admin/clients", apiProbe: "/api/admin/clients", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "messages.list", href: "/admin/messages", apiProbe: "/api/admin/messages", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "cases.list", href: "/admin/cases", apiProbe: "/api/admin/cases", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "cases.create", href: "/admin/cases/new", apiProbe: "/api/admin/cases", state: "planned", defaultAccess: access(false, true, true, false) },
  { id: "calendar.list", href: "/admin/calendar", apiProbe: "/api/admin/calendar", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "tasks.list", href: "/admin/tasks", apiProbe: "/api/admin/tasks", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "documents.list", href: "/admin/documents", apiProbe: "/api/admin/documents", state: "implemented", defaultAccess: access(true, true, true, false) },
  { id: "finance.list", href: "/admin/finance", apiProbe: "/api/admin/finance", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "reports.list", href: "/admin/reports", apiProbe: "/api/admin/reports", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "content.home", href: "/admin/content", apiProbe: "/api/admin/content", state: "implemented", defaultAccess: access(false, false, false, true) },
  { id: "contacts.list", href: "/admin/contact-messages", apiProbe: "/api/admin/contact-messages", state: "implemented", defaultAccess: access(false, true, true, false) },
  { id: "notifications.list", href: "/admin/notifications", apiProbe: "/api/admin/notifications", state: "implemented", defaultAccess: access(true, true, true, true) },
  { id: "users.list", href: "/admin/users", apiProbe: "/api/admin/users", state: "implemented", defaultAccess: access(false, false, false, false) },
  { id: "roles.list", href: "/admin/roles", apiProbe: "/api/admin/roles", state: "planned", defaultAccess: access(false, false, false, false) },
  { id: "settings.home", href: "/admin/settings", apiProbe: "/api/admin/settings", state: "implemented", defaultAccess: access(false, false, false, false) },
  { id: "audit.list", href: "/admin/audit-log", apiProbe: "/api/admin/audit-log", state: "implemented", defaultAccess: access(false, false, false, false) }
] as const;

export const PLAN35_IMPLEMENTED_ADMIN_ROUTES = FINAL_PLAN35_ADMIN_ROUTE_MATRIX.filter(
  (route) => route.state === "implemented"
);

export const PLAN35_PLANNED_ADMIN_ROUTES = FINAL_PLAN35_ADMIN_ROUTE_MATRIX.filter(
  (route) => route.state === "planned"
);
