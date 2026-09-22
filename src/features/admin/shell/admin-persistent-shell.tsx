"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardShellView } from "@/components/layout/dashboard-shell-view";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { useAdminAccess } from "./admin-access-context";

export function AdminPersistentShell({
  notificationBell,
  children
}: {
  notificationBell?: ReactNode;
  children: ReactNode;
}) {
  const access = useAdminAccess();
  const pathname = usePathname();
  const navItems = access.navItems.map((item) => ({
    ...item,
    active: item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`)
  }));
  return (
    <DashboardShellView
      eyebrow={access.roleLabel ?? plan35AdminShellCopy.adminBadge}
      navItems={navItems}
      notificationBell={notificationBell}
      roleLabel={access.roleLabel}
      scopeLabel={access.scopeLabel}
      title={plan35AdminShellCopy.adminMode}
      userLabel={access.userLabel}
    >
      {children}
    </DashboardShellView>
  );
}
