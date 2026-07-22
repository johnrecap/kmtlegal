"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/components/layout";
import { plan35AdminShellCopy } from "@/lib/ui-copy";

export type AdminAccessSnapshot = {
  navItems: DashboardNavItem[];
  userLabel: string;
};

const emptyAdminAccess: AdminAccessSnapshot = {
  navItems: [],
  userLabel: plan35AdminShellCopy.fallbackUser
};

const AdminAccessContext = createContext<AdminAccessSnapshot>(emptyAdminAccess);

function navItemsForCurrentPath(navItems: DashboardNavItem[], pathname: string) {
  const activeHref = navItems
    .filter((navItem) => pathname === navItem.href || (navItem.href !== "/admin" && pathname.startsWith(`${navItem.href}/`)))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;
  return navItems.map((navItem) => ({ ...navItem, active: navItem.href === activeHref }));
}

export function AdminAccessProvider({
  snapshot,
  children
}: {
  snapshot: AdminAccessSnapshot;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const access = useMemo(
    () => ({ ...snapshot, navItems: navItemsForCurrentPath(snapshot.navItems, pathname) }),
    [pathname, snapshot]
  );
  return <AdminAccessContext.Provider value={access}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
