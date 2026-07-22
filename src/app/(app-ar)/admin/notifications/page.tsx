import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminNotificationCenter } from "@/features/admin/notifications/admin-notification-popover";
import { plan35NotificationUiCopy as copy } from "@/lib/ui-copy";
import { listAdminNotifications } from "@/server/admin/notification-service";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${copy.title} | KMT Legal`,
  description: copy.description
};

export default async function AdminNotificationsPage() {
  const guard = await requireAdminRoutePage("/admin/notifications");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked title={guard.title} description={guard.description} />;
  }

  const snapshot = await listAdminNotifications({
    actor: guard.context.principal,
    query: { pageSize: 20 }
  });

  return (
    <DashboardShell
      eyebrow={copy.eyebrow}
      mode="admin"
      navItems={adminNavForPath("/admin/notifications")}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      principal={guard.context.principal}
      title={copy.title}
      userLabel={guard.context.user.name}
    >
      <p className="mb-5 max-w-3xl text-sm leading-7 text-kmt-muted">{copy.description}</p>
      <AdminNotificationCenter initialSnapshot={snapshot} />
    </DashboardShell>
  );
}
