import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import {
  EmailPolicySettingForm,
  OfficeProfileSettingForm,
  SecurityStaff2faSettingForm,
  StoragePolicySettingForm
} from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { canManageAdminSettings, listAdminSettings } from "@/server/admin/governance-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الإعدادات | KMT Legal",
  description: "إعدادات تشغيل وحوكمة KMT Legal."
};

type SettingRow = Awaited<ReturnType<typeof listAdminSettings>>[number];

function SettingForm({ setting }: { setting: SettingRow }) {
  switch (setting.key) {
    case "office.profile":
      return <OfficeProfileSettingForm value={setting.value} />;
    case "security.staff2fa":
      return <SecurityStaff2faSettingForm value={setting.value} />;
    case "storage.policy":
      return <StoragePolicySettingForm value={setting.value} />;
    case "email.policy":
      return <EmailPolicySettingForm value={setting.value} />;
    default:
      return null;
  }
}

export default async function AdminSettingsPage() {
  const guard = await requireAdminPage("/admin/settings");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canManageAdminSettings(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بإدارة الإعدادات" description="هذا المسار يحتاج صلاحية settings.manage.any." />;
  }

  const settings = await listAdminSettings(guard.context.principal);

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/settings")}
      title="الإعدادات"
      userLabel={guard.context.user.name}
    >
      <div className="grid gap-5 xl:grid-cols-2">
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
