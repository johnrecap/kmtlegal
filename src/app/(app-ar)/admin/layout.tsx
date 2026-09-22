import type { ReactNode } from "react";
import { AdminAccessProvider } from "@/features/admin/shell/admin-access-context";
import { AdminPersistentShell } from "@/features/admin/shell/admin-persistent-shell";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { adminRoleScopeLabel, plan35AdminShellCopy, roleDisplayLabel } from "@/lib/ui-copy";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "./admin-navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const guard = await requireAdminPage("/admin");
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} title={guard.title} />;
  }

  const snapshot = {
    navItems: adminNavForPath("/admin", guard.context.principal),
    userLabel: guard.context.user.name || plan35AdminShellCopy.fallbackUser,
    roleLabel: roleDisplayLabel(guard.context.principal.roleName),
    scopeLabel: adminRoleScopeLabel(guard.context.principal.roleName),
    persistentShell: true
  };
  return (
    <AdminAccessProvider snapshot={snapshot}>
      <AdminPersistentShell notificationBell={<AdminNotificationBell principal={guard.context.principal} />}>
        {children}
      </AdminPersistentShell>
    </AdminAccessProvider>
  );
}
