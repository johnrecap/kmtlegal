import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { AdminUserCreateForm } from "@/features/admin/governance/governance-forms";
import { formatDateTime } from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy, roleDisplayLabel } from "@/lib/ui-copy";
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
        {row.counts.sessions} جلسة · {row.counts.auditLogs} حدث تدقيق · {row.counts.assignedTasks} مهمة
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
          value: `${row.counts.sessions} جلسة · ${row.counts.auditLogs} حدث تدقيق · ${row.counts.assignedTasks} مهمة`
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

        <div className="flex flex-wrap items-start gap-3">
        <form action="/admin/users" className="min-w-0 flex-1" method="get">
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.users.filters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.users.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="بحث بالاسم أو البريد أو الهاتف" />
            <span className="hidden lg:contents">
            <Select className="min-w-44" defaultValue={result.filters.roleId ?? ""} label="الدور" name="roleId">
              <option value="">كل الأدوار</option>
              {options.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleDisplayLabel(role.name)}
                </option>
              ))}
            </Select>
            </span>
            <span className="hidden lg:contents">
            <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {options.statuses.map((status) => (
                <option key={status} value={status}>
                  {userStatusLabel(status)}
                </option>
              ))}
            </Select>
            </span>
            <input type="hidden" name="sortBy" value={result.filters.sortBy} />
            <input type="hidden" name="sortDirection" value={result.filters.sortDirection} />
            <span className="hidden lg:contents">
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
            </span>
          </FilterBar>
        </form>
        <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
          <form action="/admin/users" className="space-y-3" method="get">
            <input type="hidden" name="q" value={result.filters.q ?? ""} />
            <input type="hidden" name="roleId" value={result.filters.roleId ?? ""} />
            <input type="hidden" name="status" value={result.filters.status ?? ""} />
            <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="updatedAt">آخر تحديث</option>
              <option value="name">الاسم</option>
              <option value="email">البريد</option>
              <option value="status">الحالة</option>
            </Select>
            <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </Select>
            <Button className="w-full" type="submit" variant="secondary">
              تطبيق
            </Button>
          </form>
        </MoreFiltersPopover>
        <MobileFiltersSheet description="ابحث وصفِّ حسابات المستخدمين." title="فلاتر المستخدمين" triggerLabel="الفلاتر">
          <form action="/admin/users" className="space-y-3" method="get">
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.users.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="بحث بالاسم أو البريد أو الهاتف" />
            <Select className="w-full" defaultValue={result.filters.roleId ?? ""} label="الدور" name="roleId">
              <option value="">كل الأدوار</option>
              {options.roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleDisplayLabel(role.name)}
                </option>
              ))}
            </Select>
            <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {options.statuses.map((status) => (
                <option key={status} value={status}>
                  {userStatusLabel(status)}
                </option>
              ))}
            </Select>
            <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="updatedAt">آخر تحديث</option>
              <option value="name">الاسم</option>
              <option value="email">البريد</option>
              <option value="status">الحالة</option>
            </Select>
            <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </Select>
            <Button className="w-full" type="submit" variant="secondary">
              تطبيق
            </Button>
          </form>
        </MobileFiltersSheet>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
          <p>{result.total} مستخدم داخل الفلاتر الحالية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable caption={plan35AdminListAccessibilityCopy.users.table} columns={columns} rows={result.items} empty="لا توجد حسابات مطابقة للفلاتر الحالية." mobileRender={(row) => <UserMobileCard row={row} />} />

        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          hrefForPage={(page) => listHref(result.filters, page)}
          resetHref="/admin/users"
          resetLabel="مسح الفلاتر"
        />
      </div>
    </DashboardShell>
  );
}
