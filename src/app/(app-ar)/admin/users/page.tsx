import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AdminUserCreateForm } from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { roleDisplayLabel } from "@/lib/ui-copy";
import { canCreateAdminUsers, getAdminUserOptions, listAdminUsers } from "@/server/admin/governance-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المستخدمون | KMT Legal",
  description: "إدارة مستخدمي وأدوار KMT Legal."
};

type SearchParams = Record<string, string | string[] | undefined>;
type UserRow = Awaited<ReturnType<typeof listAdminUsers>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function statusTone(status: string) {
  if (status === "ACTIVE") return "active" as const;
  if (status === "SUSPENDED" || status === "DELETED") return "danger" as const;
  return "pending" as const;
}

function userStatusLabel(status: string) {
  return { INVITED: "مدعو", ACTIVE: "نشط", SUSPENDED: "موقوف", DELETED: "محذوف" }[status] ?? status;
}

function listHref(filters: {
  q?: string;
  roleId?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
}, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set("page", String(page));
  return `/admin/users?${params.toString()}`;
}

const columns: Array<DataTableColumn<UserRow>> = [
  {
    key: "user",
    header: "المستخدم",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/users/${row.id}`}>
          {row.name}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.email}</p>
      </div>
    )
  },
  { key: "role", header: "الدور", render: (row) => roleDisplayLabel(row.role.name) },
  { key: "status", header: "الحالة", render: (row) => <Badge tone={statusTone(row.status)}>{userStatusLabel(row.status)}</Badge> },
  {
    key: "counts",
    header: "النشاط",
    render: (row) => (
      <span className="text-sm text-kmt-muted">
        {row._count.sessions} جلسة · {row._count.auditLogs} حدث تدقيق · {row._count.assignedTasks} مهمة
      </span>
    )
  },
  { key: "updated", header: "آخر تحديث", render: (row) => formatDateTime(row.updatedAt) },
  {
    key: "action",
    header: "",
    render: (row) => (
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/users/${row.id}`}>
        فتح
      </Link>
    )
  }
];

function UserMobileCard({ row }: { row: UserRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/users/${row.id}`}>
          {row.name}
        </Link>
      }
      description={row.email}
      badges={<Badge tone={statusTone(row.status)}>{userStatusLabel(row.status)}</Badge>}
      fields={[
        { label: "الدور", value: roleDisplayLabel(row.role.name) },
        {
          label: "النشاط",
          value: `${row._count.sessions} جلسة · ${row._count.auditLogs} حدث تدقيق · ${row._count.assignedTasks} مهمة`
        },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt), className: "sm:col-span-2" }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/users/${row.id}`}>
          فتح
        </Link>
      }
    />
  );
}

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/users");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, options] = await Promise.all([
    listAdminUsers({ actor: guard.context.principal, query }),
    getAdminUserOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/users")}
      title="المستخدمون والأدوار"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-5">
        {canCreateAdminUsers(guard.context.principal) ? <AdminUserCreateForm roles={options.roles} /> : null}

        <form action="/admin/users" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="بحث بالاسم أو البريد أو الهاتف" />
            <Select className="min-w-44" defaultValue={result.filters.roleId ?? ""} label="الدور" name="roleId">
              <option value="">كل الأدوار</option>
              {options.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleDisplayLabel(role.name)}
                </option>
              ))}
            </Select>
            <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {options.statuses.map((status) => (
                <option key={status} value={status}>
                  {userStatusLabel(status)}
                </option>
              ))}
            </Select>
            <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="updatedAt">آخر تحديث</option>
              <option value="name">الاسم</option>
              <option value="email">البريد</option>
              <option value="status">الحالة</option>
            </Select>
            <Select className="min-w-32" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
          </FilterBar>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
          <p>{result.total} مستخدم داخل الفلاتر الحالية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable columns={columns} rows={result.items} empty="لا توجد حسابات مطابقة للفلاتر الحالية." mobileRender={(row) => <UserMobileCard row={row} />} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/users">
            مسح الفلاتر
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {result.page > 1 ? (
              <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page - 1)}>
                السابق
              </Link>
            ) : null}
            {result.page < totalPages ? (
              <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page + 1)}>
                التالي
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
