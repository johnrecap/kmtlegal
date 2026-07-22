import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { RolePermissionForm } from "@/features/admin/governance/role-permission-form";
import { plan35RoleGovernanceUiCopy } from "@/lib/ui-copy";
import { getRolePermissionMatrix } from "@/server/admin/role-permission-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${plan35RoleGovernanceUiCopy.title} | KMT Legal`,
  description: plan35RoleGovernanceUiCopy.metadataDescription
};

export default async function AdminRolesPage() {
  const guard = await requireAdminRoutePage("/admin/roles");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const matrix = await getRolePermissionMatrix({ actor: guard.context.principal });

  return (
    <DashboardShell
      eyebrow={plan35RoleGovernanceUiCopy.eyebrow}
      mode="admin"
      navItems={adminNavForPath("/admin/roles")}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      principal={guard.context.principal}
      title={plan35RoleGovernanceUiCopy.title}
      userLabel={guard.context.user.name}
    >
      <RolePermissionForm initialMatrix={matrix} />
    </DashboardShell>
  );
}
