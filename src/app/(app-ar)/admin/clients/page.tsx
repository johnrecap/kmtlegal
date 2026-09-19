import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, StateBlock, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { ClientCreateForm } from "@/features/admin/clients/client-crm-forms";
import { clientStatusLabels, formatDateTime, labelFrom } from "@/lib/legal-format";
import { commonUiCopy, plan35AdminListAccessibilityCopy, sourceTypeDisplayLabel } from "@/lib/ui-copy";
import {
  getAdminClientFilterOptions,
  listAdminClients
} from "@/server/admin/client-crm-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CRM العملاء | KMT Legal",
  description: "قائمة العملاء والعملاء المحتملين داخل لوحة المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;
type ClientRow = Awaited<ReturnType<typeof listAdminClients>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function clientStatusTone(status: string) {
  if (status === "ACTIVE") {
    return "active" as const;
  }
  if (status === "LEAD") {
    return "pending" as const;
  }
  if (status === "ARCHIVED" || status === "INACTIVE") {
    return "closed" as const;
  }
  return "neutral" as const;
}

function sourceLabel(source?: string | null) {
  if (!source) {
    return commonUiCopy.unknown;
  }
  return sourceTypeDisplayLabel(source);
}

function listHref(filters: {
  q?: string;
  status?: string;
  source?: string;
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
  return `/admin/clients?${params.toString()}`;
}

const columns: Array<DataTableColumn<ClientRow>> = [
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${row.id}`}>
          {row.fullName}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.phone}</p>
      </div>
    )
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={clientStatusTone(row.status)}>{labelFrom(clientStatusLabels, row.status)}</Badge>
  },
  {
    key: "source",
    header: "المصدر",
    render: (row) => sourceLabel(row.source)
  },
  {
    key: "lawyer",
    header: "المحامي المسؤول",
    render: (row) => row.assignedLawyer?.name ?? "غير معين"
  },
  {
    key: "counts",
    header: "الارتباطات",
    render: (row) => (
      <span className="text-sm text-kmt-muted">
        {row._count.cases} قضية · {row._count.consultationRequests} استشارة · {row._count.documents} مستند
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
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${row.id}`}>
        فتح
      </Link>
    )
  }
];

function ClientMobileCard({ row }: { row: ClientRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/clients/${row.id}`}>
          {row.fullName}
        </Link>
      }
      description={<span dir="ltr">{row.phone}</span>}
      badges={<Badge tone={clientStatusTone(row.status)}>{labelFrom(clientStatusLabels, row.status)}</Badge>}
      fields={[
        { label: "المصدر", value: sourceLabel(row.source) },
        { label: "المحامي المسؤول", value: row.assignedLawyer?.name ?? "غير معين" },
        {
          label: "الارتباطات",
          value: `${row._count.cases} قضية · ${row._count.consultationRequests} استشارة · ${row._count.documents} مستند`
        },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/clients/${row.id}`}>
          فتح
        </Link>
      }
    />
  );
}

export default async function AdminClientsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/clients");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, options] = await Promise.all([
    listAdminClients({ actor: guard.context.principal, query }),
    getAdminClientFilterOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/clients")}
      title="CRM العملاء"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      {options.canManage ? (
        <div className="mb-4 md:hidden">
          <Link className={buttonClasses({ className: "min-h-11 w-full" })} href="#client-create">
            إضافة عميل
          </Link>
        </div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start gap-3">
          <form action="/admin/clients" className="min-w-0 flex-1" method="get">
            <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.clients.filters}>
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.clients.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث بالاسم أو الهاتف أو البريد" />
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {Object.entries(clientStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              </span>
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.source ?? ""} label="المصدر" name="source">
                <option value="">كل المصادر</option>
                {options.sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel(source)}
                  </option>
                ))}
              </Select>
              </span>
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
            <form action="/admin/clients" className="space-y-3" method="get">
              <input type="hidden" name="q" value={result.filters.q ?? ""} />
              <input type="hidden" name="status" value={result.filters.status ?? ""} />
              <input type="hidden" name="source" value={result.filters.source ?? ""} />
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
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="fullName">الاسم</option>
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
          <MobileFiltersSheet description="ابحث وصفِّ ملفات العملاء." title="فلاتر العملاء" triggerLabel="الفلاتر">
            <form action="/admin/clients" className="space-y-3" method="get">
              <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.clients.search} className="w-full" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث بالاسم أو الهاتف أو البريد" />
              <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {Object.entries(clientStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.source ?? ""} label="المصدر" name="source">
                <option value="">كل المصادر</option>
                {options.sources.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel(source)}
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
                <option value="createdAt">تاريخ الإنشاء</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="fullName">الاسم</option>
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
            <p>{result.total} ملف عميل</p>
            <p>
              صفحة {result.page} من {totalPages}
            </p>
          </div>

          <DataTable
            caption={plan35AdminListAccessibilityCopy.clients.table}
            columns={columns}
            rows={result.items}
            empty="لا توجد ملفات عملاء مطابقة للفلاتر الحالية."
            mobileRender={(row) => <ClientMobileCard row={row} />}
          />

          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            hrefForPage={(page) => listHref(result.filters, page)}
            resetHref="/admin/clients"
            resetLabel="مسح الفلاتر"
          />
        </div>

        {options.canManage ? (
          <div id="client-create" className="scroll-mt-24">
            <ClientCreateForm lawyers={options.lawyers} />
          </div>
        ) : (
          <StateBlock
            tone="permission"
            title="إضافة العملاء غير متاحة"
            description="يمكنك قراءة العملاء داخل نطاقك، لكن إنشاء أو تعديل ملفات CRM يحتاج صلاحية إدارة العملاء."
          />
        )}
      </div>
    </DashboardShell>
  );
}
