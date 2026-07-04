import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { consultationStatusLabels, formatDateTime, labelFrom, modeLabels, urgencyLabels } from "@/lib/legal-format";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { listAdminConsultations } from "@/server/admin/consultation-review-service";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مراجعة الاستشارات | KMT Legal",
  description: "قائمة مراجعة طلبات الاستشارة وتحويلها إلى قضايا."
};

type SearchParams = Record<string, string | string[] | undefined>;
type ConsultationRow = Awaited<ReturnType<typeof listAdminConsultations>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function badgeTone(status: string) {
  if (status === "CONVERTED") {
    return "active" as const;
  }
  if (status === "REJECTED") {
    return "danger" as const;
  }
  if (status === "REVIEWING" || status === "SCHEDULED") {
    return "pending" as const;
  }
  return "neutral" as const;
}

function listHref(filters: { q?: string; status?: string; assigned?: string; pageSize?: number }, page: number) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.assigned) {
    params.set("assigned", filters.assigned);
  }
  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }
  params.set("page", String(page));
  return `/admin/consultations?${params.toString()}`;
}

function summaryPreview(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

const columns: Array<DataTableColumn<ConsultationRow>> = [
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
          {row.fullName}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.phone}</p>
      </div>
    )
  },
  {
    key: "requestText",
    header: "نص طلب العميل",
    render: (row) => (
      <div className="min-w-0">
        <p className="break-words font-medium">{summaryPreview(row.summary)}</p>
        <p className="mt-1 text-xs text-kmt-muted">{labelFrom(modeLabels, row.preferredMode)}</p>
      </div>
    )
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={badgeTone(row.status)}>{labelFrom(consultationStatusLabels, row.status)}</Badge>
  },
  {
    key: "urgency",
    header: "الأولوية",
    render: (row) => <Badge tone={row.urgency === "URGENT" || row.urgency === "HIGH" ? "pending" : "neutral"}>{labelFrom(urgencyLabels, row.urgency)}</Badge>
  },
  {
    key: "lawyer",
    header: "المحامي",
    render: (row) => row.assignedLawyer?.name ?? "غير معين"
  },
  {
    key: "created",
    header: "تاريخ الطلب",
    render: (row) => formatDateTime(row.createdAt)
  },
  {
    key: "action",
    header: "",
    render: (row) => (
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
        مراجعة
      </Link>
    )
  }
];

function ConsultationMobileCard({ row }: { row: ConsultationRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/consultations/${row.id}`}>
          {row.fullName}
        </Link>
      }
      description={<span dir="ltr">{row.phone}</span>}
      badges={
        <>
          <Badge tone={badgeTone(row.status)}>{labelFrom(consultationStatusLabels, row.status)}</Badge>
          <Badge tone={row.urgency === "URGENT" || row.urgency === "HIGH" ? "pending" : "neutral"}>{labelFrom(urgencyLabels, row.urgency)}</Badge>
        </>
      }
      fields={[
        { label: "نص طلب العميل", value: summaryPreview(row.summary, 90) },
        { label: "طريقة التواصل", value: labelFrom(modeLabels, row.preferredMode) },
        { label: "المحامي", value: row.assignedLawyer?.name ?? "غير معين" },
        { label: "تاريخ الطلب", value: formatDateTime(row.createdAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/consultations/${row.id}`}>
          مراجعة
        </Link>
      }
    />
  );
}

export default async function AdminConsultationsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminPage("/admin/consultations");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const result = await listAdminConsultations({
    actor: guard.context.principal,
    query: flattenSearchParams((await searchParams) ?? {})
  });
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/consultations")}
      title="مراجعة الاستشارات"
      userLabel={guard.context.user.name}
    >
      <div className="min-w-0 space-y-5">
        <form action="/admin/consultations" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث بالاسم أو الهاتف أو نص طلب العميل" />
            <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {Object.entries(consultationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.assigned ?? ""} label="التعيين" name="assigned">
              <option value="">كل الطلبات</option>
              <option value="unassigned">يحتاج تعيين محامي</option>
              <option value="assigned">تم تعيين محامي</option>
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
          </FilterBar>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
          <Link className={buttonClasses({ variant: result.filters.assigned === "unassigned" ? "primary" : "secondary", size: "sm" })} href="/admin/consultations?assigned=unassigned">
            {result.unassignedTotal} يحتاج تعيين محامي
          </Link>
          <p>{result.total} طلب استشارة</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable
          columns={columns}
          rows={result.items}
          empty="لا توجد طلبات استشارة مطابقة للفلاتر الحالية."
          mobileRender={(row) => <ConsultationMobileCard row={row} />}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
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
    </DashboardShell>
  );
}
