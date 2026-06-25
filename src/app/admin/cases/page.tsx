import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, StateBlock, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { caseStatusLabels, formatDateTime, labelFrom, priorityLabels } from "@/lib/legal-format";
import {
  canListAdminCases,
  getAdminCaseFilterOptions,
  listAdminCases
} from "@/server/admin/case-operations-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "إدارة القضايا | KMT Legal",
  description: "قائمة القضايا الداخلية مع البحث والفلاتر والربط بالجلسات والتقويم."
};

type SearchParams = Record<string, string | string[] | undefined>;
type CaseRow = Awaited<ReturnType<typeof listAdminCases>>["items"][number];

const caseStatusOptions = ["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT", "COMPLETED", "CLOSED", "ARCHIVED"];
const priorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function caseStatusTone(status: string) {
  if (status === "ACTIVE") {
    return "active" as const;
  }
  if (status === "NEW" || status === "UNDER_REVIEW" || status === "AWAITING_JUDGMENT") {
    return "pending" as const;
  }
  if (status === "COMPLETED") {
    return "neutral" as const;
  }
  return "closed" as const;
}

function priorityTone(priority: string) {
  return priority === "URGENT" || priority === "HIGH" ? ("pending" as const) : ("neutral" as const);
}

function listHref(filters: {
  q?: string;
  status?: string;
  priority?: string;
  caseType?: string;
  assignedLawyerId?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
}, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }
  params.set("page", String(page));
  return `/admin/cases?${params.toString()}`;
}

const columns: Array<DataTableColumn<CaseRow>> = [
  {
    key: "case",
    header: "القضية",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${row.id}`}>
          {row.internalFileNumber}
        </Link>
        <p className="mt-1 text-sm text-kmt-ink">{row.title}</p>
        <p className="mt-1 text-xs text-kmt-muted">{row.caseType}</p>
      </div>
    )
  },
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-medium text-kmt-navy hover:underline" href={`/admin/clients/${row.client.id}`}>
          {row.client.fullName}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.client.phone}</p>
      </div>
    )
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={caseStatusTone(row.status)}>{labelFrom(caseStatusLabels, row.status)}</Badge>
  },
  {
    key: "priority",
    header: "الأولوية",
    render: (row) => <Badge tone={priorityTone(row.priority)}>{labelFrom(priorityLabels, row.priority)}</Badge>
  },
  {
    key: "lawyer",
    header: "المحامي",
    render: (row) => row.assignedLawyer.name
  },
  {
    key: "nextSession",
    header: "الجلسة القادمة",
    render: (row) => formatDateTime(row.nextSessionAt)
  },
  {
    key: "counts",
    header: "الارتباطات",
    render: (row) => (
      <span className="text-sm text-kmt-muted">
        {row._count.sessions} جلسة · {row._count.appointments} موعد · {row._count.tasks} مهمة
      </span>
    )
  },
  {
    key: "updated",
    header: "آخر تحديث",
    render: (row) => formatDateTime(row.updatedAt)
  },
  {
    key: "action",
    header: "",
    render: (row) => (
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${row.id}`}>
        فتح
      </Link>
    )
  }
];

function CaseMobileCard({ row }: { row: CaseRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/cases/${row.id}`}>
          {row.internalFileNumber}
        </Link>
      }
      description={
        <>
          <span className="block text-kmt-ink">{row.title}</span>
          <span className="block text-xs">{row.caseType}</span>
        </>
      }
      badges={
        <>
          <Badge tone={caseStatusTone(row.status)}>{labelFrom(caseStatusLabels, row.status)}</Badge>
          <Badge tone={priorityTone(row.priority)}>{labelFrom(priorityLabels, row.priority)}</Badge>
        </>
      }
      fields={[
        {
          label: "العميل",
          value: (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${row.client.id}`}>
              {row.client.fullName}
            </Link>
          )
        },
        { label: "هاتف العميل", value: row.client.phone, dir: "ltr" },
        { label: "المحامي", value: row.assignedLawyer.name },
        { label: "الجلسة القادمة", value: formatDateTime(row.nextSessionAt) },
        {
          label: "الارتباطات",
          value: `${row._count.sessions} جلسة · ${row._count.appointments} موعد · ${row._count.tasks} مهمة`
        },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/cases/${row.id}`}>
          فتح
        </Link>
      }
    />
  );
}

export default async function AdminCasesPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const guard = await requireAdminPage("/admin/cases");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canListAdminCases(guard.context.principal)) {
    return (
      <PermissionBlocked
        title="غير مسموح بقراءة القضايا"
        description="هذا المسار يحتاج صلاحية قراءة كل القضايا أو قراءة القضايا المعينة لك."
      />
    );
  }

  const query = flattenSearchParams(searchParams);
  const [result, options] = await Promise.all([
    listAdminCases({ actor: guard.context.principal, query }),
    getAdminCaseFilterOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/cases")}
      title="إدارة القضايا"
      userLabel={guard.context.user.name}
    >
      <div className="space-y-5">
        <form action="/admin/cases" method="get">
          <FilterBar>
            <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الملف أو العميل أو نوع القضية" />
            <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {caseStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {labelFrom(caseStatusLabels, status)}
                </option>
              ))}
            </Select>
            <Select className="min-w-40" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
              <option value="">كل الأولويات</option>
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {labelFrom(priorityLabels, priority)}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.caseType ?? ""} label="نوع القضية" name="caseType">
              <option value="">كل الأنواع</option>
              {options.caseTypes.map((caseType) => (
                <option key={caseType} value={caseType}>
                  {caseType}
                </option>
              ))}
            </Select>
            {options.lawyers.length ? (
              <Select className="min-w-44" defaultValue={result.filters.assignedLawyerId ?? ""} label="المحامي" name="assignedLawyerId">
                <option value="">كل المحامين</option>
                {options.lawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
              <option value="updatedAt">آخر تحديث</option>
              <option value="createdAt">تاريخ الإنشاء</option>
              <option value="nextSessionAt">الجلسة القادمة</option>
              <option value="internalFileNumber">رقم الملف</option>
              <option value="status">الحالة</option>
              <option value="priority">الأولوية</option>
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
          <p>{result.total} ملف قضية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable columns={columns} rows={result.items} empty="لا توجد قضايا مطابقة للفلاتر الحالية." mobileRender={(row) => <CaseMobileCard row={row} />} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/cases">
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

        <StateBlock
          title="حدود هذه الشاشة"
          description="هذه الخطة تدير القضايا والجلسات والتقويم فقط. مهام القضية والمستندات الإدارية ستكتمل في PLAN-17، والماليات في PLAN-19."
        />
      </div>
    </DashboardShell>
  );
}
