import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, type DataTableColumn } from "@/components/ui";
import { AdminUserActionPanel } from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { canChangeAdminUserPassword, canManageAdminUsers, getAdminUserDetail, getAdminUserOptions } from "@/server/admin/governance-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل المستخدم | KMT Legal",
  description: "تفاصيل حساب المستخدم وحوكمة الصلاحيات."
};

type UserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;
type SessionRow = UserDetail["sessions"][number];
type AuditRow = UserDetail["auditLogs"][number];

function statusTone(status: string) {
  if (status === "ACTIVE") return "active" as const;
  if (status === "REVOKED" || status === "EXPIRED" || status === "SUSPENDED" || status === "DELETED") return "danger" as const;
  return "pending" as const;
}

const sessionColumns: Array<DataTableColumn<SessionRow>> = [
  { key: "status", header: "الحالة", render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge> },
  { key: "created", header: "بدأت", render: (row) => formatDateTime(row.createdAt) },
  { key: "expires", header: "تنتهي", render: (row) => formatDateTime(row.expiresAt) },
  { key: "ip", header: "IP", render: (row) => row.ipAddress ?? "غير مسجل" }
];

const auditColumns: Array<DataTableColumn<AuditRow>> = [
  { key: "action", header: "الإجراء", render: (row) => row.action },
  { key: "resource", header: "المورد", render: (row) => `${row.resourceType}${row.resourceId ? ` · ${row.resourceId}` : ""}` },
  { key: "created", header: "الوقت", render: (row) => formatDateTime(row.createdAt) }
];

export default async function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const guard = await requireAdminPage(`/admin/users/${params.userId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canManageAdminUsers(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بإدارة المستخدمين" description="هذا المسار يحتاج صلاحية user.manage.any." />;
  }

  const [user, options] = await Promise.all([
    getAdminUserDetail({ actor: guard.context.principal, userId: params.userId }),
    getAdminUserOptions(guard.context.principal)
  ]);
  const permissionKeys = user.role.permissions.map((entry) => entry.permission.key);

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/users")}
      title={user.name}
      userLabel={guard.context.user.name}
    >
      <div className="mb-5">
        <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/users">
          العودة إلى المستخدمين
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>الدور</CardTitle>
                <CardDescription>{user.role.name}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الحالة</CardTitle>
                <CardDescription>
                  <Badge tone={statusTone(user.status)}>{user.status}</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>النشاط</CardTitle>
                <CardDescription>
                  {user._count.sessions} جلسة · {user._count.auditLogs} audit
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات</CardTitle>
              <CardDescription>الصلاحيات الحالية موروثة من الدور، ولا يتم تعديلها فرديًا في MVP.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {permissionKeys.slice(0, 80).map((permission) => (
                  <Badge key={permission} tone="neutral">
                    {permission}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آخر الجلسات</CardTitle>
              <CardDescription>جلسات الدخول الأخيرة بدون عرض token أو بيانات سرية.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={sessionColumns} rows={user.sessions} empty="لا توجد جلسات مسجلة." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آخر audit لهذا المستخدم</CardTitle>
              <CardDescription>أحدث الإجراءات التي نفذها هذا الحساب.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={auditColumns} rows={user.auditLogs} empty="لا توجد أحداث audit مرتبطة بهذا المستخدم." />
            </CardContent>
          </Card>

          {user.clientProfile || user.lawyerProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>الارتباطات</CardTitle>
                <CardDescription>روابط تشغيلية مرتبطة بحساب الدخول.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-kmt-muted">
                {user.clientProfile ? <p>Client: {user.clientProfile.fullName} · {user.clientProfile.status}</p> : null}
                {user.lawyerProfile ? <p>Lawyer profile: {user.lawyerProfile.title}</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <AdminUserActionPanel
          canChangePassword={canChangeAdminUserPassword(guard.context.principal)}
          roles={options.roles}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roleId: user.roleId,
            roleName: user.role.name,
            status: user.status,
            locale: user.locale
          }}
        />
      </div>
    </DashboardShell>
  );
}
