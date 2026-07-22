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

type AdminRouteDefinition = Omit<AdminRoutePolicy, "labelKey" | "staffFallback"> & {
  staffFallback?: boolean;
};

export const ADMIN_ROUTE_POLICIES: readonly AdminRoutePolicy[] = [
  route({ id: "dashboard.home", href: "/admin", activeMatch: "exact", group: "office-operations", icon: "dashboard", requiredAnyPermissions: [], staffFallback: true }),
  route({ id: "consultations.availability", href: "/admin/consultation-availability", activeMatch: "prefix", group: "office-operations", icon: "event_available", requiredAnyPermissions: ["appointment.manage.any", "settings.manage.any"] }),
  route({ id: "consultations.list", href: "/admin/consultations", activeMatch: "prefix", group: "office-operations", icon: "rate_review", requiredAnyPermissions: ["consultation.review.any", "consultation.review.assigned"] }),
  route({ id: "clients.list", href: "/admin/clients", activeMatch: "prefix", group: "office-operations", icon: "groups", requiredAnyPermissions: ["client.read.any", "client.read.assigned"] }),
  route({ id: "messages.list", href: "/admin/messages", activeMatch: "prefix", group: "office-operations", icon: "forum", requiredAnyPermissions: ["conversation.read.any", "conversation.manage.any"] }),
  route({ id: "cases.list", href: "/admin/cases", activeMatch: "prefix", group: "office-operations", icon: "gavel", requiredAnyPermissions: ["case.read.any", "case.read.assigned"] }),
  route({ id: "calendar.list", href: "/admin/calendar", activeMatch: "prefix", group: "office-operations", icon: "event", requiredAnyPermissions: ["appointment.manage.any", "appointment.read.assigned"] }),
  route({ id: "tasks.list", href: "/admin/tasks", activeMatch: "prefix", group: "office-operations", icon: "task_alt", requiredAnyPermissions: ["task.manage.any", "task.manage.assigned", "task.read.assigned"] }),
  route({ id: "documents.list", href: "/admin/documents", activeMatch: "prefix", group: "files-finance", icon: "folder", requiredAnyPermissions: ["document.manage.any", "document.read.assigned"] }),
  route({ id: "finance.list", href: "/admin/finance", activeMatch: "prefix", group: "files-finance", icon: "receipt_long", requiredAnyPermissions: ["finance.read.any", "finance.manage.any"] }),
  route({ id: "reports.list", href: "/admin/reports", activeMatch: "prefix", group: "files-finance", icon: "monitoring", requiredAnyPermissions: ["report.read.any"] }),
  route({ id: "content.home", href: "/admin/content", activeMatch: "prefix", group: "administration", icon: "campaign", requiredAnyPermissions: ["content.create.any", "content.approve.any", "caseStudy.create.any", "caseStudy.approve.any", "socialDraft.create.any", "socialDraft.approve.any"] }),
  route({ id: "contacts.list", href: "/admin/contact-messages", activeMatch: "prefix", group: "office-operations", icon: "contact_mail", requiredAnyPermissions: ["contact.read.any", "contact.manage.any"] }),
  route({ id: "notifications.list", href: "/admin/notifications", activeMatch: "prefix", group: "office-operations", icon: "notifications", requiredAnyPermissions: ["notification.read.self"] }),
  route({ id: "users.list", href: "/admin/users", activeMatch: "prefix", group: "administration", icon: "manage_accounts", requiredAnyPermissions: ["user.manage.any"] }),
  route({ id: "settings.home", href: "/admin/settings", activeMatch: "prefix", group: "administration", icon: "settings", requiredAnyPermissions: ["settings.manage.any"] }),
  route({ id: "audit.list", href: "/admin/audit-log", activeMatch: "prefix", group: "administration", icon: "fact_check", requiredAnyPermissions: ["audit.read.any"] })
];

const adminRoutePolicyById = new Map<AdminRouteId, AdminRoutePolicy>(
  ADMIN_ROUTE_POLICIES.map((policy) => [policy.id, policy])
);
const reservedAdminRoutePrefixes = ["/admin/cases/new"] as const;

function route(definition: AdminRouteDefinition): AdminRoutePolicy {
  return {
    ...definition,
    labelKey: `admin.routes.${definition.id}` as Plan35AdminRouteLabelKey,
    staffFallback: definition.staffFallback ?? false
  };
}

function normalizedAdminPath(pathname: string) {
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

function policyMatchesPath(policy: AdminRoutePolicy, pathname: string) {
  if (policy.activeMatch === "exact") return pathname === policy.href;
  return pathname === policy.href || pathname.startsWith(`${policy.href}/`);
}

function isReservedAdminPath(pathname: string) {
  return reservedAdminRoutePrefixes.some(
    (reservedPath) => pathname === reservedPath || pathname.startsWith(`${reservedPath}/`)
  );
}

export function getAdminRoutePolicy(id: AdminRouteId) {
  return adminRoutePolicyById.get(id);
}

export function resolveAdminRoutePolicy(pathname: string) {
  const normalizedPath = normalizedAdminPath(pathname);
  if (isReservedAdminPath(normalizedPath)) return undefined;

  return ADMIN_ROUTE_POLICIES.filter((policy) => policyMatchesPath(policy, normalizedPath)).sort(
    (left, right) => Number(right.activeMatch === "exact") - Number(left.activeMatch === "exact") || right.href.length - left.href.length
  )[0];
}

export function isAdminRouteActive(policy: AdminRoutePolicy, pathname: string) {
  return resolveAdminRoutePolicy(pathname)?.id === policy.id;
}

export function canAccessAdminRoute(
  principal: Pick<Principal, "roleName" | "permissions">,
  routeOrId: AdminRoutePolicy | AdminRouteId
) {
  const policy = typeof routeOrId === "string" ? getAdminRoutePolicy(routeOrId) : routeOrId;
  if (!policy || !isStaffRole(principal.roleName)) return false;
  if (policy.exactRole && policy.exactRole !== principal.roleName) return false;

  const anyPermissions = policy.requiredAnyPermissions;
  const allPermissions = policy.requiredAllPermissions ?? [];
  const hasRequirements = anyPermissions.length > 0 || allPermissions.length > 0;
  const hasAny = anyPermissions.length === 0 || anyPermissions.some((permission) => hasPermission(principal, permission));
  const hasAll = allPermissions.every((permission) => hasPermission(principal, permission));
  return hasAll && (hasRequirements ? hasAny : policy.staffFallback);
}

export function canAccessAdminPath(
  principal: Pick<Principal, "roleName" | "permissions">,
  pathname: string
) {
  const policy = resolveAdminRoutePolicy(pathname);
  return policy ? canAccessAdminRoute(principal, policy) : false;
}

export function filterAdminRoutePolicies(
  principal: Pick<Principal, "roleName" | "permissions">
) {
  return ADMIN_ROUTE_POLICIES.filter((policy) => canAccessAdminRoute(principal, policy));
}
