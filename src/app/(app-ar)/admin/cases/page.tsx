import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { Badge, Button, ButtonLink, DataRecordCard, DataTable, FilterBar, SearchInput, Select, StateBlock, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { caseStatusLabels, formatDateTime, labelFrom, priorityLabels } from "@/lib/legal-format";
import { adminCurrentCapabilityCopy, plan35AdminListAccessibilityCopy, plan35ManualCaseUiCopy as manualCaseCopy } from "@/lib/ui-copy";
import {
  getAdminCaseFilterOptions,
  listAdminCases
} from "@/server/admin/case-operations-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
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
        <Link className="font-semibold text-primary hover:underline" href={`/admin/cases/${row.id}`}>
          {row.internalFileNumber}
        </Link>
        <p className="mt-1 text-sm text-foreground">{row.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.caseType}</p>
      </div>
    )
  },
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-medium text-primary hover:underline" href={`/admin/clients/${row.client.id}`}>
          {row.client.fullName}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{row.client.phone}</p>
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
      <span className="text-sm text-muted-foreground">
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
      <Link className="text-sm font-semibold text-primary hover:underline" href={`/admin/cases/${row.id}`}>
        فتح
      </Link>
    )
  }
];

function CaseMobileCard({ row }: { row: CaseRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-primary hover:underline" href={`/admin/cases/${row.id}`}>
          {row.internalFileNumber}
        </Link>
      }
      description={
        <>
          <span className="block text-foreground">{row.title}</span>
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
            <Link className="font-semibold text-primary hover:underline" href={`/admin/clients/${row.client.id}`}>
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

export default async function AdminCasesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/cases");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, options] = await Promise.all([
    listAdminCases({ actor: guard.context.principal, query }),
    getAdminCaseFilterOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      action={<ButtonLink href="/admin/cases/new">{manualCaseCopy.createTitle}</ButtonLink>}
      actionRouteId="cases.create"
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/cases")}
      title="إدارة القضايا"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start gap-3">
          <form action="/admin/cases" className="min-w-0 flex-1" method="get">
            <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.cases.filters}>
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.cases.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الملف أو العميل أو نوع القضية" />
              <span className="hidden lg:contents">
              <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {caseStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(caseStatusLabels, status)}
                  </option>
                ))}
              </Select>
              </span>
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
                <option value="">كل الأولويات</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {labelFrom(priorityLabels, priority)}
                  </option>
                ))}
              </Select>
              </span>
              <input type="hidden" name="caseType" value={result.filters.caseType ?? ""} />
              <input type="hidden" name="assignedLawyerId" value={result.filters.assignedLawyerId ?? ""} />
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
            <form action="/admin/cases" className="space-y-3" method="get">
              <input type="hidden" name="q" value={result.filters.q ?? ""} />
              <input type="hidden" name="status" value={result.filters.status ?? ""} />
              <input type="hidden" name="priority" value={result.filters.priority ?? ""} />
              <Select className="w-full" defaultValue={result.filters.caseType ?? ""} label="نوع القضية" name="caseType">
                <option value="">كل الأنواع</option>
                {options.caseTypes.map((caseType) => (
                  <option key={caseType} value={caseType}>
                    {caseType}
                  </option>
                ))}
              </Select>
              {options.lawyers.length ? (
                <Select className="w-full" defaultValue={result.filters.assignedLawyerId ?? ""} label="المحامي" name="assignedLawyerId">
                  <option value="">كل المحامين</option>
                  {options.lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="updatedAt">آخر تحديث</option>
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="nextSessionAt">الجلسة القادمة</option>
                <option value="internalFileNumber">رقم الملف</option>
                <option value="status">الحالة</option>
                <option value="priority">الأولوية</option>
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
          <MobileFiltersSheet description="ابحث وصفِّ قائمة القضايا." title="فلاتر القضايا" triggerLabel="الفلاتر">
            <form action="/admin/cases" className="space-y-3" method="get">
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.cases.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الملف أو العميل أو نوع القضية" />
              <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {caseStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(caseStatusLabels, status)}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.priority ?? ""} label="الأولوية" name="priority">
                <option value="">كل الأولويات</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {labelFrom(priorityLabels, priority)}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.caseType ?? ""} label="نوع القضية" name="caseType">
                <option value="">كل الأنواع</option>
                {options.caseTypes.map((caseType) => (
                  <option key={caseType} value={caseType}>
                    {caseType}
                  </option>
                ))}
              </Select>
              {options.lawyers.length ? (
                <Select className="w-full" defaultValue={result.filters.assignedLawyerId ?? ""} label="المحامي" name="assignedLawyerId">
                  <option value="">كل المحامين</option>
                  {options.lawyers.map((lawyer) => (
                    <option key={lawyer.id} value={lawyer.id}>
                      {lawyer.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="updatedAt">آخر تحديث</option>
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="nextSessionAt">الجلسة القادمة</option>
                <option value="internalFileNumber">رقم الملف</option>
                <option value="status">الحالة</option>
                <option value="priority">الأولوية</option>
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

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{result.total} ملف قضية</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable caption={plan35AdminListAccessibilityCopy.cases.table} columns={columns} rows={result.items} empty="لا توجد قضايا مطابقة للفلاتر الحالية." mobileRender={(row) => <CaseMobileCard row={row} />} />

        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          hrefForPage={(page) => listHref(result.filters, page)}
          resetHref="/admin/cases"
          resetLabel="مسح الفلاتر"
        />

        <StateBlock
          title={adminCurrentCapabilityCopy.casesListScopeTitle}
          description={adminCurrentCapabilityCopy.casesListScopeDescription}
        />
      </div>
    </DashboardShell>
  );
}
