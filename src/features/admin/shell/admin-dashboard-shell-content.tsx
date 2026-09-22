"use client";

import type { ReactNode } from "react";
import { DashboardPageFrame } from "@/components/layout/dashboard-page-frame";
import type { DashboardBreadcrumb } from "@/components/layout/dashboard-page-frame";
import { DashboardShellView } from "@/components/layout/dashboard-shell-view";
import type { DashboardNavItem } from "@/components/layout/dashboard-navigation";
import { useAdminAccess } from "./admin-access-context";

export function AdminDashboardShellContent({
  title,
  eyebrow,
  navItems,
  userLabel,
  notificationBell,
  action,
  description,
  breadcrumbs,
  className,
  children
}: {
  title: string;
  eyebrow: string;
  navItems: DashboardNavItem[];
  userLabel: string;
  notificationBell?: ReactNode;
  action?: ReactNode;
  description?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  className?: string;
  children: ReactNode;
}) {
  const access = useAdminAccess();
  if (access.persistentShell) {
    return <DashboardPageFrame action={action} breadcrumbs={breadcrumbs} description={description} eyebrow={eyebrow} title={title}>{children}</DashboardPageFrame>;
  }
  return (
    <DashboardShellView
      action={action}
      breadcrumbs={breadcrumbs}
      className={className}
      eyebrow={eyebrow}
      navItems={navItems}
      notificationBell={notificationBell}
      description={description}
      title={title}
      userLabel={userLabel}
    >
      {children}
    </DashboardShellView>
  );
}
