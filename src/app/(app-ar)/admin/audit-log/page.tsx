import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, TextInput, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/legal-format";
import { listAdminAuditLogs } from "@/server/admin/governance-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سجل التدقيق | KMT Legal",
  description: "بحث وفلترة سجل التدقيق داخل KMT Legal."
};

type SearchParams = Record<string, string | string[] | undefined>;
type AuditRow = Awaited<ReturnType<typeof listAdminAuditLogs>>["items"][number];
type AuditFilterActor = { id: string; name: string };
type AuditFilterOption = { value: string; label: string };

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function actorLabel(row: AuditRow) {
  return row.actor ? `${row.actor.name} · ${row.actor.role}` : "النظام";
}

function severityTone(severity: string) {
  if (severity === "حساس") return "danger" as const;
  if (severity === "مهم") return "pending" as const;
  return "neutral" as const;
}

function categoryTone(category: string) {
  if (category === "الأمان" || category === "المالية") return "active" as const;
  if (category === "الإدارة" || category === "النظام") return "pending" as const;
  return "neutral" as const;
}

function DetailList({ row }: { row: AuditRow }) {
  if (!row.details.length) {
    return <p className="text-sm text-kmt-muted">لا توجد تفاصيل إضافية للعرض.</p>;
  }

  return (
    <dl className="grid gap-2 text-sm">
      {row.details.slice(0, 4).map((detail) => (
        <div key={`${detail.label}-${detail.value}`} className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="font-semibold text-kmt-muted">{detail.label}:</dt>
          <dd className="text-kmt-ink">{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TechnicalDetails({ row }: { row: AuditRow }) {
  return (
    <details className="mt-3 text-xs text-kmt-muted">
      <summary className="cursor-pointer font-semibold text-kmt-navy">تفاصيل تقنية</summary>
      <dl className="mt-2 grid gap-1 rounded border border-kmt-border bg-slate-50 p-2" dir="ltr">
        <div>
          <dt className="inline font-semibold">action: </dt>
          <dd className="inline break-all">{row.technical.action}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">resourceType: </dt>
          <dd className="inline break-all">{row.technical.resourceType}</dd>
        </div>
        {row.technical.resourceId ? (
          <div>
            <dt className="inline font-semibold">resourceId: </dt>
            <dd className="inline break-all">{row.technical.resourceId}</dd>
          </div>
        ) : null}
        {(["clientId", "caseId", "lawyerId", "appointmentId", "documentId", "paymentId"] as const).map((key) =>
          row.technical[key] ? (
            <div key={key}>
              <dt className="inline font-semibold">{key}: </dt>
              <dd className="inline break-all">{row.technical[key]}</dd>
            </div>
          ) : null
        )}
      </dl>
    </details>
  );
}

function listHref(filters: {
  q?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  clientId?: string;
  caseId?: string;
  lawyerId?: string;
  appointmentId?: string;
  documentId?: string;
  paymentId?: string;
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-kmt-ink">{row.event.label}</p>
          <Badge tone={categoryTone(row.event.category)}>{row.event.category}</Badge>
          <Badge tone={severityTone(row.event.severity)}>{row.event.severity}</Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-kmt-muted">{row.summary}</p>
        <p className="mt-1 text-xs text-kmt-muted">{formatDateTime(row.occurredAt)}</p>
      </div>
    )
  },
  {
    key: "actor",
    header: "المنفذ",
    render: (row) => actorLabel(row)
  },
  {
    key: "resource",
    header: "المورد",
    render: (row) => (
      <div>
        <p>{row.resource.label}</p>
        <p className="mt-1 text-xs text-kmt-muted">المرجع الداخلي محفوظ للتدقيق</p>
      </div>
    )
  },
  {
    key: "details",
    header: "التفاصيل",
    className: "min-w-72",
    render: (row) => (
      <div>
        <DetailList row={row} />
        <TechnicalDetails row={row} />
      </div>
    )
  }
];

function AuditMobileCard({ row }: { row: AuditRow }) {
  return (
    <DataRecordCard
      title={row.event.label}
      description={row.summary}
      badges={
        <>
          <Badge tone={categoryTone(row.event.category)}>{row.event.category}</Badge>
          <Badge tone={severityTone(row.event.severity)}>{row.event.severity}</Badge>
        </>
      }
      meta={formatDateTime(row.occurredAt)}
      fields={[
        { label: "المنفذ", value: actorLabel(row) },
        { label: "المورد", value: row.resource.label },
        { label: "التفاصيل", value: <DetailList row={row} />, className: "sm:col-span-2" },
        { label: "المراجعة التقنية", value: <TechnicalDetails row={row} />, className: "sm:col-span-2" }
      ]}
    />
  );
}

export default async function AdminAuditLogPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/audit-log");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const result = await listAdminAuditLogs({ actor: guard.context.principal, query });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="حوكمة الإدارة"
      mode="admin"
      navItems={adminNavForPath("/admin/audit-log")}
      title="سجل التدقيق"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-5">
        <form action="/admin/audit-log" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="بحث في الإجراء أو المورد أو المنفذ" />
            <Select className="min-w-48" defaultValue={result.filters.actorId ?? ""} label="المنفذ" name="actorId">
              <option value="">كل المنفذين</option>
              {result.filterOptions.actors.map((actor: AuditFilterActor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name}
                </option>
              ))}
            </Select>
            <Select className="min-w-48" defaultValue={result.filters.action ?? ""} label="الإجراء" name="action">
              <option value="">كل الإجراءات</option>
              {result.filterOptions.actions.map((action: AuditFilterOption) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.resourceType ?? ""} label="المورد" name="resourceType">
              <option value="">كل الموارد</option>
              {result.filterOptions.resourceTypes.map((resourceType: AuditFilterOption) => (
                <option key={resourceType.value} value={resourceType.value}>
                  {resourceType.label}
                </option>
              ))}
            </Select>
            <TextInput className="min-w-56" defaultValue={result.filters.clientId ?? ""} label="معرف العميل" name="clientId" dir="ltr" />
            <TextInput className="min-w-56" defaultValue={result.filters.caseId ?? ""} label="معرف القضية" name="caseId" dir="ltr" />
            <TextInput className="min-w-56" defaultValue={result.filters.lawyerId ?? ""} label="معرف المحامي" name="lawyerId" dir="ltr" />
            <TextInput className="min-w-56" defaultValue={result.filters.appointmentId ?? ""} label="معرف الموعد" name="appointmentId" dir="ltr" />
            <TextInput className="min-w-56" defaultValue={result.filters.documentId ?? ""} label="معرف المستند" name="documentId" dir="ltr" />
            <TextInput className="min-w-56" defaultValue={result.filters.paymentId ?? ""} label="معرف الدفعة" name="paymentId" dir="ltr" />
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
          <p>{result.total} حدث تدقيق داخل الفلاتر الحالية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable columns={columns} rows={result.items} empty="لا توجد أحداث تدقيق مطابقة للفلاتر الحالية." mobileRender={(row) => <AuditMobileCard row={row} />} />

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
