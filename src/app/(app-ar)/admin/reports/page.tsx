import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataRecordCard,
  DataTable,
  FilterBar,
  MetricCard,
  Select,
  StateBlock,
  TextInput,
  type DataTableColumn
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { currencyValues } from "@/lib/legal-finance";
import {
  caseStatusLabels,
  consultationStatusLabels,
  formatDate,
  formatMoney,
  labelFrom,
  paymentStatusLabels,
  taskStatusLabels
} from "@/lib/legal-format";
import { canReadAdminReports, getAdminReports } from "@/server/admin/finance-report-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التقارير | KMT Legal",
  description: "تقارير مالية وتشغيلية أساسية داخل لوحة المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;
type ReportData = Awaited<ReturnType<typeof getAdminReports>>;
type RecentPaymentRow = ReportData["recentPayments"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function statusTone(status: string) {
  if (status === "PAID" || status === "ACTIVE" || status === "CONVERTED" || status === "COMPLETED") {
    return "active" as const;
  }
  if (status === "OVERDUE" || status === "REJECTED") {
    return "danger" as const;
  }
  if (status === "CANCELLED" || status === "CLOSED" || status === "ARCHIVED") {
    return "closed" as const;
  }
  return "pending" as const;
}

function summaryAmount(amount: number, currency?: string) {
  if (currency) {
    return formatMoney(amount, currency);
  }

  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(amount)} مجموع خام`;
}

function StatusBars({
  title,
  description,
  items,
  labels,
  currency
}: {
  title: string;
  description: string;
  items: Array<{ status: string; count: number; amount?: number }>;
  labels: Record<string, string>;
  currency?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <StateBlock title="لا توجد بيانات" description="لا توجد سجلات داخل نطاق التاريخ الحالي." />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const percentage = total ? Math.round((item.count / total) * 100) : 0;

              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(item.status)}>{labelFrom(labels, item.status)}</Badge>
                      <span className="text-kmt-muted">{item.count} سجل</span>
                    </div>
                    <span className="font-medium text-kmt-ink">
                      {item.amount !== undefined ? summaryAmount(item.amount, currency) : `${percentage}%`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-kmt-gold" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const recentPaymentColumns: Array<DataTableColumn<RecentPaymentRow>> = [
  {
    key: "invoice",
    header: "الفاتورة",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/finance?editPaymentId=${row.id}`}>
          {row.invoiceNumber}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{formatDate(row.issueDate)}</p>
      </div>
    )
  },
  {
    key: "client",
    header: "العميل",
    render: (row) => row.client.fullName
  },
  {
    key: "case",
    header: "القضية",
    render: (row) => row.case?.internalFileNumber ?? "بدون قضية"
  },
  {
    key: "amount",
    header: "القيمة",
    render: (row) => <span className="font-semibold tabular-nums">{formatMoney(row.amount.toString(), row.currency)}</span>
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={statusTone(row.status)}>{labelFrom(paymentStatusLabels, row.status)}</Badge>
  }
];

function RecentPaymentMobileCard({ row }: { row: RecentPaymentRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/finance?editPaymentId=${row.id}`}>
          {row.invoiceNumber}
        </Link>
      }
      description={formatDate(row.issueDate)}
      badges={<Badge tone={statusTone(row.status)}>{labelFrom(paymentStatusLabels, row.status)}</Badge>}
      fields={[
        { label: "العميل", value: row.client.fullName },
        { label: "القضية", value: row.case?.internalFileNumber ?? "بدون قضية" },
        { label: "القيمة", value: formatMoney(row.amount.toString(), row.currency), className: "sm:col-span-2" }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/finance?editPaymentId=${row.id}`}>
          فتح الفاتورة
        </Link>
      }
    />
  );
}

export default async function AdminReportsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminPage("/admin/reports");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canReadAdminReports(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بقراءة التقارير" description="هذا المسار يحتاج صلاحية report.read.any." />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const report = await getAdminReports({ actor: guard.context.principal, query });
  const selectedCurrency = report.filters.currency || undefined;

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/reports")}
      title="التقارير الأساسية"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="space-y-6">
        <form action="/admin/reports" method="get">
          <FilterBar>
            <TextInput className="min-w-36" defaultValue={report.filters.dateFrom ?? ""} label="من" name="dateFrom" type="date" />
            <TextInput className="min-w-36" defaultValue={report.filters.dateTo ?? ""} label="إلى" name="dateTo" type="date" />
            <Select className="min-w-36" defaultValue={report.filters.currency ?? ""} label="العملة" name="currency">
              <option value="">كل العملات</option>
              {currencyValues.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
          </FilterBar>
        </form>

        {!selectedCurrency ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            التقارير المالية تعرض مجموعًا خامًا عند اختيار كل العملات. اختر عملة واحدة لقراءة مالية قابلة للمقارنة.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="إجمالي الفواتير"
            value={String(report.finance.summary.invoiceCount)}
            meta={summaryAmount(report.finance.summary.totalAmount, selectedCurrency)}
          />
          <MetricCard label="مدفوع" value={String(report.finance.summary.paidCount)} meta={summaryAmount(report.finance.summary.paidAmount, selectedCurrency)} />
          <MetricCard label="مفتوح" value={String(report.finance.summary.openCount)} meta={summaryAmount(report.finance.summary.openAmount, selectedCurrency)} />
          <MetricCard label="متأخر" value={String(report.finance.summary.overdueCount)} meta={summaryAmount(report.finance.summary.overdueAmount, selectedCurrency)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="كل العملاء" value={String(report.operations.clients.total)} meta="ملفات CRM غير محذوفة" />
          <MetricCard label="عملاء نشطون" value={String(report.operations.clients.active)} meta="status = ACTIVE" />
          <MetricCard
            label="طلبات استشارة"
            value={String(report.operations.consultationsByStatus.reduce((sum, item) => sum + item.count, 0))}
            meta="حسب نطاق التاريخ"
          />
          <MetricCard
            label="مهام داخلية"
            value={String(report.operations.tasksByStatus.reduce((sum, item) => sum + item.count, 0))}
            meta="حسب نطاق التاريخ"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <StatusBars
            currency={selectedCurrency}
            description="عدد وقيمة الفواتير حسب الحالة داخل نطاق التقرير."
            items={report.finance.byStatus}
            labels={paymentStatusLabels}
            title="الفواتير حسب الحالة"
          />
          <StatusBars
            description="حالة طلبات الاستشارة العامة داخل نطاق التقرير."
            items={report.operations.consultationsByStatus}
            labels={consultationStatusLabels}
            title="الاستشارات حسب الحالة"
          />
          <StatusBars
            description="القضايا غير المحذوفة حسب الحالة التشغيلية."
            items={report.operations.casesByStatus}
            labels={caseStatusLabels}
            title="القضايا حسب الحالة"
          />
          <StatusBars
            description="المهام الداخلية حسب حالة التنفيذ."
            items={report.operations.tasksByStatus}
            labels={taskStatusLabels}
            title="المهام حسب الحالة"
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>أحدث الفواتير داخل نطاق التقرير</CardTitle>
                <CardDescription>قراءة تشغيلية سريعة، وليست كشف حساب أو تقرير ضريبي.</CardDescription>
              </div>
              <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/finance">
                فتح الفواتير
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentPaymentColumns}
              rows={report.recentPayments}
              empty="لا توجد فواتير داخل نطاق التقرير الحالي."
              mobileRender={(row) => <RecentPaymentMobileCard row={row} />}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
