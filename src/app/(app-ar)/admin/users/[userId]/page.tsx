import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { AdminUserActionPanel } from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { permissionDisplayLabel, plan35AdminListAccessibilityCopy, plan35UserGovernanceUiCopy, roleDisplayLabel } from "@/lib/ui-copy";
import { canManageClientAccounts } from "@/server/admin/client-crm-service";
import { canChangeAdminUserPassword, getAdminUserDetail, getAdminUserOptions } from "@/server/admin/governance-service";
import { auditActionOptionLabel, auditResourceLabel } from "@/server/audit/audit-event-catalog";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل المستخدم | KMT Legal",
  description: "تفاصيل حساب المستخدم وحوكمة الصلاحيات."
};

type UserDetail = Awaited<ReturnType<typeof getAdminUserDetail>>;
type SessionRow = UserDetail["safeSessions"][number];
type AuditRow = UserDetail["safeAuditRows"][number];

function statusTone(status: string) {
  if (status === "ACTIVE") return "active" as const;
  if (status === "REVOKED" || status === "EXPIRED" || status === "SUSPENDED" || status === "DELETED") return "danger" as const;
  return "pending" as const;
}

function userStatusLabel(status: string) {
  return { INVITED: "مدعو", ACTIVE: "نشط", SUSPENDED: "موقوف", DELETED: "محذوف" }[status] ?? status;
}

function sessionStatusLabel(status: string) {
  return { ACTIVE: "نشطة", REVOKED: "منتهية يدويًا", EXPIRED: "منتهية" }[status] ?? status;
}

const sessionColumns: Array<DataTableColumn<SessionRow>> = [
  { key: "status", header: "الحالة", render: (row) => <Badge tone={statusTone(row.status)}>{sessionStatusLabel(row.status)}</Badge> },
  { key: "created", header: "بدأت", render: (row) => formatDateTime(row.createdAt) },
  { key: "expires", header: "تنتهي", render: (row) => formatDateTime(row.expiresAt) },
  { key: "ip", header: "IP", render: (row) => row.ipAddress ?? "غير مسجل" }
];

const auditColumns: Array<DataTableColumn<AuditRow>> = [
  {
    key: "event",
    header: "الإجراء",
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{auditActionOptionLabel(row.action)}</p>
        <p className="mt-1 text-xs text-kmt-muted">
          {row.actor
            ? `${row.actor.name} · ${roleDisplayLabel(row.actor.roleName)}`
            : plan35UserGovernanceUiCopy.systemAction}
        </p>
      </div>
    )
  },
  { key: "resource", header: "المورد", render: (row) => auditResourceLabel(row.resourceType) },
  { key: "created", header: "الوقت", render: (row) => formatDateTime(row.createdAt) }
];

function SessionMobileCard({ row }: { row: SessionRow }) {
  return (
    <DataRecordCard
      title="جلسة دخول"
      badges={<Badge tone={statusTone(row.status)}>{sessionStatusLabel(row.status)}</Badge>}
      fields={[
        { label: "بدأت", value: formatDateTime(row.createdAt) },
        { label: "تنتهي", value: formatDateTime(row.expiresAt) },
        { label: "IP", value: row.ipAddress ?? "غير مسجل", dir: "ltr", className: "sm:col-span-2" }
      ]}
    />
  );
}

function AuditMobileCard({ row }: { row: AuditRow }) {
  return (
    <DataRecordCard
      title={auditActionOptionLabel(row.action)}
      description={
        row.actor
          ? `${row.actor.name} · ${roleDisplayLabel(row.actor.roleName)}`
          : plan35UserGovernanceUiCopy.systemAction
      }
      fields={[
        { label: "المورد", value: auditResourceLabel(row.resourceType) },
        { label: "الوقت", value: formatDateTime(row.createdAt) }
      ]}
    />
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const guard = await requireAdminRoutePage(`/admin/users/${userId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [user, options] = await Promise.all([
    getAdminUserDetail({ actor: guard.context.principal, userId }),
    getAdminUserOptions(guard.context.principal)
  ]);
  const permissionKeys = user.rolePermissionKeys;

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/users")}
      title={user.name}
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
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
                <CardDescription>{roleDisplayLabel(user.role.name)}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الحالة</CardTitle>
                <CardDescription>
                  <Badge tone={statusTone(user.status)}>{userStatusLabel(user.status)}</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>النشاط</CardTitle>
                <CardDescription>
                  {user.counts.sessions} جلسة · {user.counts.auditLogs} حدث تدقيق
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>الصلاحيات</CardTitle>
              <CardDescription>الصلاحيات الحالية موروثة من الدور، ولا يتم تعديلها فرديًا من هذه الشاشة.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {permissionKeys.slice(0, 80).map((permission) => (
                  <Badge key={permission} tone="neutral">
                    {permissionDisplayLabel(permission)}
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
              <DataTable caption={plan35AdminListAccessibilityCopy.userDetail.sessionsTable} columns={sessionColumns} rows={user.safeSessions} empty="لا توجد جلسات مسجلة." mobileRender={(row) => <SessionMobileCard row={row} />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آخر أحداث التدقيق لهذا المستخدم</CardTitle>
              <CardDescription>أحدث الإجراءات التي نفذها هذا الحساب.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable caption={plan35AdminListAccessibilityCopy.userDetail.auditTable} columns={auditColumns} rows={user.safeAuditRows} empty="لا توجد أحداث تدقيق مرتبطة بهذا المستخدم." mobileRender={(row) => <AuditMobileCard row={row} />} />
            </CardContent>
          </Card>

          {user.clientProfile || user.lawyerProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>الارتباطات</CardTitle>
                <CardDescription>روابط تشغيلية مرتبطة بحساب الدخول.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-kmt-muted">
                {user.clientProfile ? <p>ملف العميل: {user.clientProfile.fullName} · {user.clientProfile.status}</p> : null}
                {user.lawyerProfile ? <p>ملف المحامي: {user.lawyerProfile.title}</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <AdminUserActionPanel
          canChangePassword={canChangeAdminUserPassword(guard.context.principal)}
          canManageClientAccount={canManageClientAccounts(guard.context.principal)}
          clientProfile={user.clientProfile}
          roles={options.roles}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roleId: user.role.id,
            roleName: user.role.name,
            status: user.status,
            locale: user.locale,
            updatedAt: user.updatedAt
          }}
        />
      </div>
    </DashboardShell>
  );
}
