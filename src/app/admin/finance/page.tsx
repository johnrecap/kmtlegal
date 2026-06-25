import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
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
  SearchInput,
  Select,
  StateBlock,
  TextInput,
  type DataTableColumn
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { PaymentForm } from "@/features/admin/finance/finance-forms";
import { currencyValues, paymentStatusValues } from "@/lib/legal-finance";
import { formatDate, formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import {
  canReadAdminFinance,
  getAdminFinanceOptions,
  getAdminPaymentDetail,
  listAdminPayments
} from "@/server/admin/finance-report-service";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الفواتير والتحصيل | KMT Legal",
  description: "إدارة الفواتير اليدوية وسجلات الدفع الأساسية داخل لوحة المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;
type PaymentRow = Awaited<ReturnType<typeof listAdminPayments>>["items"][number];
type PaymentDetail = Awaited<ReturnType<typeof getAdminPaymentDetail>>;

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function statusTone(status: string) {
  if (status === "PAID") {
    return "active" as const;
  }
  if (status === "OVERDUE") {
    return "danger" as const;
  }
  if (status === "CANCELLED") {
    return "closed" as const;
  }
  return status === "DRAFT" ? ("neutral" as const) : ("pending" as const);
}

function summaryAmount(amount: number, currency?: string) {
  if (currency) {
    return formatMoney(amount, currency);
  }

  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(amount)} مجموع خام`;
}

function listHref(
  filters: {
    q?: string;
    status?: string;
    currency?: string;
    clientId?: string;
    caseId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortDirection?: string;
    pageSize?: number;
  },
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }
  params.set("page", String(page));
  return `/admin/finance?${params.toString()}`;
}

function editHref(paymentId: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.set("editPaymentId", paymentId);
  return `/admin/finance?${params.toString()}`;
}

function paymentFormValue(payment: PaymentDetail) {
  return {
    id: payment.id,
    invoiceNumber: payment.invoiceNumber,
    clientId: payment.clientId,
    caseId: payment.caseId,
    issueDate: payment.issueDate.toISOString(),
    dueDate: payment.dueDate?.toISOString() ?? null,
    amount: payment.amount.toString(),
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt?.toISOString() ?? null,
    notes: payment.notes
  };
}

function columns(query: Record<string, string>): Array<DataTableColumn<PaymentRow>> {
  return [
    {
      key: "invoice",
      header: "الفاتورة",
      render: (row) => (
        <div>
          <p className="font-semibold text-kmt-ink">{row.invoiceNumber}</p>
          <p className="mt-1 text-xs text-kmt-muted">أُنشئت بواسطة {row.createdBy.name}</p>
        </div>
      )
    },
    {
      key: "client",
      header: "العميل / القضية",
      render: (row) => (
        <div>
          <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${row.client.id}`}>
            {row.client.fullName}
          </Link>
          <p className="mt-1 text-xs text-kmt-muted">
            {row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية مرتبطة"}
          </p>
        </div>
      )
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
    },
    {
      key: "dates",
      header: "التواريخ",
      render: (row) => (
        <div className="text-sm leading-6">
          <p>إصدار: {formatDate(row.issueDate)}</p>
          <p className="text-kmt-muted">استحقاق: {formatDate(row.dueDate)}</p>
        </div>
      )
    },
    {
      key: "receipt",
      header: "الدفع",
      render: (row) => (
        <div className="text-sm leading-6">
          <p>{row.paymentMethod || "غير محدد"}</p>
          <p className="text-kmt-muted">{row.receiptNumber || "بدون إيصال"}</p>
        </div>
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
        <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={editHref(row.id, query)}>
          تعديل
        </Link>
      )
    }
  ];
}

function PaymentMobileCard({ row, query }: { row: PaymentRow; query: Record<string, string> }) {
  return (
    <DataRecordCard
      title={row.invoiceNumber}
      description={`أُنشئت بواسطة ${row.createdBy.name}`}
      badges={<Badge tone={statusTone(row.status)}>{labelFrom(paymentStatusLabels, row.status)}</Badge>}
      fields={[
        {
          label: "العميل",
          value: (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/clients/${row.client.id}`}>
              {row.client.fullName}
            </Link>
          )
        },
        { label: "القضية", value: row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية مرتبطة" },
        { label: "القيمة", value: formatMoney(row.amount.toString(), row.currency) },
        { label: "التواريخ", value: `إصدار: ${formatDate(row.issueDate)} · استحقاق: ${formatDate(row.dueDate)}` },
        { label: "الدفع", value: `${row.paymentMethod || "غير محدد"} · ${row.receiptNumber || "بدون إيصال"}` },
        { label: "آخر تحديث", value: formatDateTime(row.updatedAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={editHref(row.id, query)}>
          تعديل
        </Link>
      }
    />
  );
}

export default async function AdminFinancePage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const guard = await requireAdminPage("/admin/finance");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canReadAdminFinance(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بقراءة الفواتير" description="هذا المسار يحتاج صلاحية finance.read.any أو finance.manage.any." />;
  }

  const query = flattenSearchParams(searchParams);
  const [result, options] = await Promise.all([
    listAdminPayments({ actor: guard.context.principal, query }),
    getAdminFinanceOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectedCurrency = result.filters.currency || undefined;
  const editPaymentId = query.editPaymentId;
  let editPayment: PaymentDetail | null = null;

  if (editPaymentId && options.canManage) {
    try {
      editPayment = await getAdminPaymentDetail({ actor: guard.context.principal, paymentId: editPaymentId });
    } catch {
      editPayment = null;
    }
  }

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/finance")}
      title="الفواتير والتحصيل"
      userLabel={guard.context.user.name}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="إجمالي الفواتير"
            value={String(result.summary.invoiceCount)}
            meta={summaryAmount(result.summary.totalAmount, selectedCurrency)}
          />
          <MetricCard label="المدفوع" value={String(result.summary.paidCount)} meta={summaryAmount(result.summary.paidAmount, selectedCurrency)} />
          <MetricCard label="المفتوح" value={String(result.summary.openCount)} meta={summaryAmount(result.summary.openAmount, selectedCurrency)} />
          <MetricCard label="المتأخر" value={String(result.summary.overdueCount)} meta={summaryAmount(result.summary.overdueAmount, selectedCurrency)} />
        </div>

        {!selectedCurrency ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            الأرقام المجمعة المعروضة هنا مجموع خام عبر العملات. استخدم فلتر العملة للحصول على قراءة مالية دقيقة.
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="space-y-5">
            <form action="/admin/finance" method="get">
              <FilterBar>
                <SearchInput className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث برقم الفاتورة أو العميل أو الإيصال" />
                <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                  <option value="">كل الحالات</option>
                  {paymentStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {labelFrom(paymentStatusLabels, status)}
                    </option>
                  ))}
                </Select>
                <Select className="min-w-36" defaultValue={result.filters.currency ?? ""} label="العملة" name="currency">
                  <option value="">كل العملات</option>
                  {currencyValues.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Select>
                <Select className="min-w-48" defaultValue={result.filters.clientId ?? ""} label="العميل" name="clientId">
                  <option value="">كل العملاء</option>
                  {options.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </Select>
                <Select className="min-w-48" defaultValue={result.filters.caseId ?? ""} label="القضية" name="caseId">
                  <option value="">كل القضايا</option>
                  {options.cases.map((legalCase) => (
                    <option key={legalCase.id} value={legalCase.id}>
                      {legalCase.internalFileNumber} - {legalCase.title}
                    </option>
                  ))}
                </Select>
                <TextInput className="min-w-36" defaultValue={result.filters.dateFrom ?? ""} label="من" name="dateFrom" type="date" />
                <TextInput className="min-w-36" defaultValue={result.filters.dateTo ?? ""} label="إلى" name="dateTo" type="date" />
                <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                  <option value="issueDate">تاريخ الإصدار</option>
                  <option value="dueDate">تاريخ الاستحقاق</option>
                  <option value="createdAt">تاريخ الإدخال</option>
                  <option value="amount">القيمة</option>
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
              <p>{result.total} فاتورة داخل الفلاتر الحالية</p>
              <p>
                صفحة {result.page} من {totalPages}
              </p>
            </div>

            <DataTable columns={columns(query)} rows={result.items} empty="لا توجد فواتير مطابقة للفلاتر الحالية." mobileRender={(row) => <PaymentMobileCard row={row} query={query} />} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/finance">
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

          <Card>
            <CardHeader>
              <CardTitle>{editPayment ? "تعديل فاتورة" : "فاتورة يدوية جديدة"}</CardTitle>
              <CardDescription>
                سجلات مالية يدوية فقط للـMVP. لا يوجد payment gateway أو ضرائب أو line items في هذه المرحلة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {options.canManage ? (
                <PaymentForm
                  cases={options.cases}
                  clients={options.clients}
                  mode={editPayment ? "edit" : "create"}
                  payment={editPayment ? paymentFormValue(editPayment) : undefined}
                />
              ) : (
                <StateBlock tone="permission" title="إدارة الفواتير غير متاحة" description="يمكنك قراءة الفواتير فقط. الإنشاء والتعديل يحتاجان صلاحية finance.manage.any." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
