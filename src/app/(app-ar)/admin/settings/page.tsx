import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import {
  EmailPolicySettingForm,
  OfficeProfileSettingForm,
  SecurityStaff2faSettingForm,
  StorageRuntimeDiagnosticPanel
} from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { plan35StorageDiagnosticUiCopy } from "@/lib/ui-copy";
import { listAdminSettings } from "@/server/admin/governance-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الإعدادات | KMT Legal",
  description: "إعدادات تشغيل وحوكمة KMT Legal."
};

type SettingRow = Awaited<ReturnType<typeof listAdminSettings>>["settings"][number];

function SettingForm({ setting }: { setting: SettingRow }) {
  switch (setting.key) {
    case "office.profile":
      return <OfficeProfileSettingForm value={setting.value} />;
    case "security.staff2fa":
      return <SecurityStaff2faSettingForm value={setting.value} />;
    case "email.policy":
      return <EmailPolicySettingForm value={setting.value} />;
    default:
      return null;
  }
}

export default async function AdminSettingsPage() {
  const guard = await requireAdminRoutePage("/admin/settings");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const { settings, storageRuntimeDiagnostic } = await listAdminSettings(guard.context.principal);

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/settings")}
      title="الإعدادات"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{plan35StorageDiagnosticUiCopy.title}</CardTitle>
            <CardDescription>{plan35StorageDiagnosticUiCopy.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <StorageRuntimeDiagnosticPanel diagnostic={storageRuntimeDiagnostic} />
          </CardContent>
        </Card>
        {settings.map((setting) => (
          <Card key={setting.key}>
            <CardHeader>
              <CardTitle>{setting.label}</CardTitle>
              <CardDescription>
                {setting.description}
                <span className="mt-1 block">
                  آخر تحديث: {formatDateTime(setting.updatedAt)} · بواسطة {setting.updatedBy?.name ?? "غير مسجل"}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingForm setting={setting} />
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
