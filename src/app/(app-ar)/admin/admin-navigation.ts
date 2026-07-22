import type { DashboardNavItem } from "@/components/layout";
import {
  ADMIN_ROUTE_POLICIES,
  filterAdminRoutePolicies,
  isAdminRouteActive,
  resolveAdminRoutePolicy
} from "@/lib/admin-route-policy";
import {
  plan35AdminRouteGroupLabels,
  plan35AdminRouteLabels,
  plan35AdminShellCopy
} from "@/lib/ui-copy";
import type { Principal } from "@/server/auth/policy";

function navItemFromPolicy(
  policy: (typeof ADMIN_ROUTE_POLICIES)[number],
  pathname?: string
): DashboardNavItem {
  return {
    label: plan35AdminRouteLabels[policy.labelKey],
    href: policy.href,
    icon: policy.icon,
    group: plan35AdminRouteGroupLabels[policy.group],
    active: pathname ? isAdminRouteActive(policy, pathname) : false
  };
}

export const adminNavItems: DashboardNavItem[] = ADMIN_ROUTE_POLICIES.map((policy) =>
  navItemFromPolicy(policy)
);

export function adminNavForPath(
  pathname: string,
  principal?: Pick<Principal, "roleName" | "permissions">
) {
  const policies = principal ? filterAdminRoutePolicies(principal) : ADMIN_ROUTE_POLICIES;
  return policies.map((policy) => navItemFromPolicy(policy, pathname));
}

export function adminSectionLabel(section: string[] = []) {
  const pathname = section.length ? `/admin/${section.join("/")}` : "/admin";
  const policy = resolveAdminRoutePolicy(pathname);
  return policy ? plan35AdminRouteLabels[policy.labelKey] : plan35AdminShellCopy.unknownSection;
}
