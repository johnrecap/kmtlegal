import type { AdminRouteId } from "@/lib/admin-route-policy";
import { canAccessAdminRoute, resolveAdminRoutePolicy } from "@/lib/admin-route-policy";
import type { Principal } from "@/server/auth/policy";
import { DashboardShellView, type DashboardShellViewProps } from "./dashboard-shell-view";
import type { DashboardNavItem } from "./dashboard-navigation";

export type { DashboardNavItem } from "./dashboard-navigation";

type DashboardShellProps = DashboardShellViewProps & {
  principal?: Principal;
  actionRouteId?: AdminRouteId;
};

function authorizedAdminNavItems(navItems: DashboardNavItem[], principal: Principal) {
  return navItems.filter((navItem) => {
    const policy = resolveAdminRoutePolicy(navItem.href);
    return policy ? canAccessAdminRoute(principal, policy) : false;
  });
}

export function DashboardShell({ principal, actionRouteId, ...viewProps }: DashboardShellProps) {
  const filterForPrincipal = viewProps.mode !== "portal" && principal;
  const navItems = filterForPrincipal
    ? authorizedAdminNavItems(viewProps.navItems, principal)
    : viewProps.navItems;
  const actionAllowed = !actionRouteId || !principal || canAccessAdminRoute(principal, actionRouteId);

  return (
    <DashboardShellView
      {...viewProps}
      action={actionAllowed ? viewProps.action : undefined}
      navItems={navItems}
    />
  );
}
