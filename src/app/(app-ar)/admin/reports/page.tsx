import { paymentRequiresReview } from "@/lib/legal-finance";
import type { Metadata } from "next";
import Link from "next/link";
import { paymentReviewCopy } from "@/lib/ui-copy";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { CountingNumber } from "@/components/animate-ui";
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
  InlineFeedback,
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
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";
import { getAdminReports } from "@/server/admin/finance-report-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
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
  return "اختر عملة لعرض القيمة";
}

function comparisonLabel(current: number, previous?: number) {
  if (previous === undefined) return null;
  if (previous === 0) return current === 0 ? "دون تغير عن الفترة السابقة" : "لا توجد قيمة مقابلة في الفترة السابقة";
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}% مقارنة بالفترة السابقة`;
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
                      <span className="text-muted-foreground">{item.count} سجل</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {item.amount !== undefined ? summaryAmount(item.amount, currency) : `${percentage}%`}
                    </span>
                  </div>
                  <div
                    aria-label={`${labelFrom(labels, item.status)}: ${item.count} سجل، ${percentage}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percentage}
                    className="h-2 rounded-full bg-surface-muted"
                    role="progressbar"
                  >
                    <div aria-hidden="true" className="h-2 rounded-full bg-kmt-gold" style={{ width: `${percentage}%` }} />
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
        <Link className="font-semibold text-primary hover:underline" href={`/admin/finance?editPaymentId=${row.id}`}>
          {row.invoiceNumber}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.issueDate)}</p>
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
    render: (row) => <Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy.ar.review : labelFrom(paymentStatusLabels, row.status)}</Badge>
  }
];

function RecentPaymentMobileCard({ row }: { row: RecentPaymentRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-primary hover:underline" href={`/admin/finance?editPaymentId=${row.id}`}>
          {row.invoiceNumber}
        </Link>
      }
      description={formatDate(row.issueDate)}
      badges={<Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy.ar.review : labelFrom(paymentStatusLabels, row.status)}</Badge>}
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
  const guard = await requireAdminRoutePage("/admin/reports");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
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
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.reports.filters}>
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

        {!selectedCurrency ? <InlineFeedback title="القيم المالية معروضة منفصلة حسب العملة؛ اختر عملة واحدة لإجراء مقارنة مالية مباشرة." tone="info" /> : null}

        {!selectedCurrency && report.finance.byCurrency.length ? (
          <section aria-labelledby="report-currencies-title">
            <h2 className="text-lg font-semibold text-foreground" id="report-currencies-title">الإجماليات حسب العملة</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {report.finance.byCurrency.map((item) => (
                <Card key={item.currency} className="p-4">
                  <p className="text-sm font-semibold text-muted-foreground"><bdi>{item.currency}</bdi></p>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{formatMoney(item.amount, item.currency)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.count} فاتورة</p>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

          <p className="text-sm text-muted-foreground">{paymentReviewCopy.ar.totals} {paymentReviewCopy.ar.count}: {report.finance.summary.reviewCount}. {paymentReviewCopy.ar.unallocated}: {report.finance.summary.unallocatedReviewCount}</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="إجمالي الفواتير"
            value={<CountingNumber initiallyStable number={report.finance.summary.invoiceCount} />}
            meta={<>{summaryAmount(report.finance.summary.totalAmount, selectedCurrency)}{comparisonLabel(report.finance.summary.invoiceCount, report.comparison?.finance.summary.invoiceCount) ? <> · {comparisonLabel(report.finance.summary.invoiceCount, report.comparison?.finance.summary.invoiceCount)}</> : null}</>}
          />
          <MetricCard label="مدفوع" value={<CountingNumber initiallyStable number={report.finance.summary.paidCount} />} meta={<>{summaryAmount(report.finance.summary.paidAmount, selectedCurrency)}{comparisonLabel(report.finance.summary.paidCount, report.comparison?.finance.summary.paidCount) ? <> · {comparisonLabel(report.finance.summary.paidCount, report.comparison?.finance.summary.paidCount)}</> : null}</>} />
          <MetricCard label="مفتوح" value={<CountingNumber initiallyStable number={report.finance.summary.openCount} />} meta={<>{summaryAmount(report.finance.summary.openAmount, selectedCurrency)}{comparisonLabel(report.finance.summary.openCount, report.comparison?.finance.summary.openCount) ? <> · {comparisonLabel(report.finance.summary.openCount, report.comparison?.finance.summary.openCount)}</> : null}</>} />
          <MetricCard label="متأخر" value={<CountingNumber initiallyStable number={report.finance.summary.overdueCount} />} meta={<>{summaryAmount(report.finance.summary.overdueAmount, selectedCurrency)}{comparisonLabel(report.finance.summary.overdueCount, report.comparison?.finance.summary.overdueCount) ? <> · {comparisonLabel(report.finance.summary.overdueCount, report.comparison?.finance.summary.overdueCount)}</> : null}</>} />
        </div>

        <Card className="p-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div><dt className="text-muted-foreground">كل العملاء</dt><dd className="mt-1 text-lg font-semibold text-foreground">{report.operations.clients.total}</dd></div>
            <div><dt className="text-muted-foreground">عملاء نشطون</dt><dd className="mt-1 text-lg font-semibold text-foreground">{report.operations.clients.active}</dd></div>
            <div><dt className="text-muted-foreground">طلبات استشارة في الفترة</dt><dd className="mt-1 text-lg font-semibold text-foreground">{report.operations.consultationsByStatus.reduce((sum, item) => sum + item.count, 0)}</dd></div>
            <div><dt className="text-muted-foreground">مهام داخلية في الفترة</dt><dd className="mt-1 text-lg font-semibold text-foreground">{report.operations.tasksByStatus.reduce((sum, item) => sum + item.count, 0)}</dd></div>
          </dl>
        </Card>

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
              <Link className="text-sm font-semibold text-primary hover:underline" href="/admin/finance">
                فتح الفواتير
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              caption={plan35AdminListAccessibilityCopy.reports.paymentsTable}
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
