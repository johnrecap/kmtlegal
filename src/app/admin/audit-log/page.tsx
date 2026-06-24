import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Button, DataTable, FilterBar, SearchInput, Select, TextInput, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/legal-format";
import { canReadAdminAuditLog, listAdminAuditLogs } from "@/server/admin/governance-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سجل التدقيق | KMT Legal",
  description: "بحث وفلترة audit log داخل KMT Legal."
};

type SearchParams = Record<string, string | string[] | undefined>;
type AuditRow = Awaited<ReturnType<typeof listAdminAuditLogs>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function shortMetadata(metadata: unknown) {
  if (!metadata) {
    return "لا يوجد";
  }
  const value = JSON.stringify(metadata);
  return value.length > 160 ? `${value.slice(0, 160)}...` : value;
}

function listHref(filters: {
  q?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
}, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
  }
  params.set("page", String(page));
  return `/admin/audit-log?${params.toString()}`;
}

const columns: Array<DataTableColumn<AuditRow>> = [
  {
    key: "event",
    header: "الحدث",
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.action}</p>
        <p className="mt-1 text-xs text-kmt-muted">{formatDateTime(row.createdAt)}</p>
      </div>
    )
  },
  {
    key: "actor",
    header: "المنفذ",
    render: (row) => row.actor ? `${row.actor.name} · ${row.actor.role.name}` : "System"
  },
  {
    key: "resource",
    header: "المورد",
    render: (row) => (
      <div>
        <p>{row.resourceType}</p>
        {row.resourceId ? <p className="mt-1 max-w-56 truncate text-xs text-kmt-muted">{row.resourceId}</p> : null}
      </div>
    )
  },
  {
    key: "metadata",
    header: "metadata",
    className: "min-w-72",
    render: (row) => <code className="whitespace-pre-wrap break-words text-xs text-kmt-muted">{shortMetadata(row.metadata)}</code>
  },
  { key: "ip", header: "IP", render: (row) => row.ipAddress ?? "غير مسجل" }
];

export default async function AdminAuditLogPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const guard = await requireAdminPage("/admin/audit-log");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canReadAdminAuditLog(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بقراءة سجل التدقيق" description="هذا المسار يحتاج صلاحية audit.read.any." />;
  }

  const query = flattenSearchParams(searchParams);
  const result = await listAdminAuditLogs({ actor: guard.context.principal, query });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/audit-log")}
      title="سجل التدقيق"
      userLabel={guard.context.user.name}
    >
      <div className="space-y-5">
        <form action="/admin/audit-log" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="بحث في الإجراء أو المورد أو المنفذ" />
            <Select className="min-w-48" defaultValue={result.filters.actorId ?? ""} label="المنفذ" name="actorId">
              <option value="">كل المنفذين</option>
              {result.filterOptions.actors.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </Select>
            <Select className="min-w-48" defaultValue={result.filters.action ?? ""} label="الإجراء" name="action">
              <option value="">كل الإجراءات</option>
              {result.filterOptions.actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.resourceType ?? ""} label="المورد" name="resourceType">
              <option value="">كل الموارد</option>
              {result.filterOptions.resourceTypes.map((resourceType) => (
                <option key={resourceType} value={resourceType}>
                  {resourceType}
                </option>
              ))}
            </Select>
            <TextInput className="min-w-36" defaultValue={result.filters.dateFrom ?? ""} label="من" name="dateFrom" type="date" />
            <TextInput className="min-w-36" defaultValue={result.filters.dateTo ?? ""} label="إلى" name="dateTo" type="date" />
            <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
              <option value="createdAt">الوقت</option>
              <option value="action">الإجراء</option>
              <option value="resourceType">المورد</option>
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
          <p>{result.total} حدث audit داخل الفلاتر الحالية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable columns={columns} rows={result.items} empty="لا توجد أحداث audit مطابقة للفلاتر الحالية." />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/audit-log">
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
