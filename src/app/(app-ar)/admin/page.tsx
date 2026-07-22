import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { AdminCommandCenter } from "@/features/admin/dashboard/admin-command-center";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { plan35DashboardUiCopy } from "@/lib/ui-copy";
import { getAdminDashboard } from "@/server/admin/dashboard-service";
import {
  AdminPermissionBlocked as PermissionBlocked,
  requireAdminRoutePage
} from "@/server/auth/page-guards";
import { adminNavForPath } from "./admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: plan35DashboardUiCopy.metadataTitle,
  description: plan35DashboardUiCopy.metadataDescription
};

export default async function AdminHomePage() {
  const guard = await requireAdminRoutePage("/admin");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const snapshot = await getAdminDashboard(guard.context.principal);

  return (
    <DashboardShell
      eyebrow={plan35DashboardUiCopy.eyebrow}
      mode="admin"
      navItems={adminNavForPath("/admin")}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      principal={guard.context.principal}
      title={plan35DashboardUiCopy.shellTitle}
      userLabel={guard.context.user.name}
    >
      <AdminCommandCenter principal={guard.context.principal} snapshot={snapshot} />
    </DashboardShell>
  );
}
