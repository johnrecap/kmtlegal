import type { Plan35AdminRouteLabelKey } from "@/lib/ui-copy";
import { hasPermission, isStaffRole, type PermissionKey, type Principal } from "@/server/auth/policy";

export const ADMIN_ROUTE_IDS = [
  "dashboard.home",
  "consultations.availability",
  "consultations.list",
  "clients.list",
  "messages.list",
  "cases.list",
  "cases.create",
  "calendar.list",
  "tasks.list",
  "documents.list",
  "finance.list",
  "reports.list",
  "content.home",
  "contacts.list",
  "notifications.list",
  "users.list",
  "roles.list",
  "settings.home",
  "audit.list"
] as const;

export type AdminRouteId = (typeof ADMIN_ROUTE_IDS)[number];
export type AdminRouteActiveMatch = "exact" | "prefix";
export type AdminRouteGroup = "office-operations" | "files-finance" | "administration";

export type AdminRoutePolicy = {
  id: AdminRouteId;
  href: string;
  activeMatch: AdminRouteActiveMatch;
  group: AdminRouteGroup;
  labelKey: Plan35AdminRouteLabelKey;
  icon: string;
  requiredAnyPermissions: readonly PermissionKey[];
  requiredAllPermissions?: readonly PermissionKey[];
  exactRole?: string;
  staffFallback: boolean;
};

export const ADMIN_ROUTE_POLICIES: readonly AdminRoutePolicy[] = [
  route("dashboard.home", "/admin", "exact", "office-operations", "dashboard", [], true),
  route("consultations.availability", "/admin/consultation-availability", "prefix", "office-operations", "event_available", ["appointment.manage.any", "settings.manage.any"]),
  route("consultations.list", "/admin/consultations", "prefix", "office-operations", "rate_review", ["consultation.review.any", "consultation.review.assigned"]),
  route("clients.list", "/admin/clients", "prefix", "office-operations", "groups", ["client.read.any", "client.read.assigned"]),
  route("messages.list", "/admin/messages", "prefix", "office-operations", "forum", ["conversation.read.any", "conversation.manage.any"]),
  route("cases.list", "/admin/cases", "prefix", "office-operations", "gavel", ["case.read.any", "case.read.assigned"]),
  route("calendar.list", "/admin/calendar", "prefix", "office-operations", "event", ["appointment.manage.any", "appointment.read.assigned"]),
  route("tasks.list", "/admin/tasks", "prefix", "office-operations", "task_alt", ["task.manage.any", "task.manage.assigned", "task.read.assigned"]),
  route("documents.list", "/admin/documents", "prefix", "files-finance", "folder", ["document.manage.any", "document.read.assigned"]),
  route("finance.list", "/admin/finance", "prefix", "files-finance", "receipt_long", ["finance.read.any", "finance.manage.any"]),
  route("reports.list", "/admin/reports", "prefix", "files-finance", "monitoring", ["report.read.any"]),
  route("content.home", "/admin/content", "prefix", "administration", "campaign", [
    "content.create.any",
    "content.approve.any",
    "caseStudy.create.any",
    "caseStudy.approve.any",
    "socialDraft.create.any",
    "socialDraft.approve.any"
  ]),
  route("users.list", "/admin/users", "prefix", "administration", "manage_accounts", ["user.manage.any"]),
  route("settings.home", "/admin/settings", "prefix", "administration", "settings", ["settings.manage.any"]),
  route("audit.list", "/admin/audit-log", "prefix", "administration", "fact_check", ["audit.read.any"])
];

function route(
  id: AdminRouteId,
  href: string,
  activeMatch: AdminRouteActiveMatch,
  group: AdminRouteGroup,
  icon: string,
  requiredAnyPermissions: readonly PermissionKey[],
  staffFallback = false
): AdminRoutePolicy {
  return {
    id,
    href,
    activeMatch,
    group,
    labelKey: `admin.routes.${id}` as Plan35AdminRouteLabelKey,
    icon,
    requiredAnyPermissions,
    staffFallback
  };
}

const adminRoutePolicyById = new Map<AdminRouteId, AdminRoutePolicy>(ADMIN_ROUTE_POLICIES.map((item) => [item.id, item]));

export function getAdminRoutePolicy(id: AdminRouteId) {
  return adminRoutePolicyById.get(id);
}

export function canAccessAdminRoute(
  principal: Pick<Principal, "roleName" | "permissions">,
  routeOrId: AdminRoutePolicy | AdminRouteId
) {
  const policy = typeof routeOrId === "string" ? getAdminRoutePolicy(routeOrId) : routeOrId;
  if (!policy || !isStaffRole(principal.roleName)) return false;
  if (policy.exactRole && policy.exactRole !== principal.roleName) return false;

  const any = policy.requiredAnyPermissions;
  const all = policy.requiredAllPermissions ?? [];
  const hasRequirements = any.length > 0 || all.length > 0;
  const hasAny = any.length === 0 || any.some((permission) => hasPermission(principal, permission));
  const hasAll = all.every((permission) => hasPermission(principal, permission));
  return hasAll && (hasRequirements ? hasAny : policy.staffFallback);
}
