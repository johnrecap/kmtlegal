import type { Metadata } from "next";
import Link from "next/link";
import { ClientPortalMetric, ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalPayments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدفوعاتي | KMT Legal"
};

type PaymentRow = Awaited<ReturnType<typeof listPortalPayments>>[number];

function isDue(payment: PaymentRow) {
  return payment.status !== "PAID" && payment.status !== "CANCELLED";
}

function statusTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (status === "CANCELLED") return "closed" as const;
  if (status === "OVERDUE" || status === "PENDING") return "danger" as const;
  return "pending" as const;
}

const columns: Array<DataTableColumn<PaymentRow>> = [
  {
    key: "invoice",
    header: "الفاتورة",
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.invoiceNumber}</p>
        {row.receiptNumber ? <p className="mt-1 text-xs text-kmt-muted">إيصال: {row.receiptNumber}</p> : null}
      </div>
    )
  },
  {
    key: "case",
    header: "القضية",
    render: (row) =>
      row.case ? (
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        "بدون قضية"
      )
  },
  { key: "amount", header: "المبلغ", render: (row) => formatMoney(row.amount.toString(), row.currency) },
  { key: "status", header: "الحالة", render: (row) => <Badge tone={statusTone(row.status)}>{labelFrom(paymentStatusLabels, row.status)}</Badge> },
  { key: "issueDate", header: "الإصدار", render: (row) => formatDateTime(row.issueDate) },
  { key: "dueDate", header: "الاستحقاق", render: (row) => formatDateTime(row.dueDate) }
];

function MobileCard({ row }: { row: PaymentRow }) {
  return (
    <DataRecordCard
      className={clientPortalRowClass}
      title={row.invoiceNumber}
      description={row.receiptNumber ? `إيصال: ${row.receiptNumber}` : undefined}
      badges={<Badge tone={statusTone(row.status)}>{labelFrom(paymentStatusLabels, row.status)}</Badge>}
      fields={[
        {
          label: "القضية",
          value: row.case ? (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
              {row.case.internalFileNumber}
            </Link>
          ) : (
            "بدون قضية"
          )
        },
        { label: "المبلغ", value: formatMoney(row.amount.toString(), row.currency) },
        { label: "الإصدار", value: formatDateTime(row.issueDate) },
        { label: "الاستحقاق", value: formatDateTime(row.dueDate) }
      ]}
      action={
        row.case ? (
          <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.case.id}`}>
            فتح القضية
          </Link>
        ) : null
      }
    />
  );
}

export default async function ClientPaymentsPage() {
  const guard = await requirePortalPage("/client/payments");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const payments = await listPortalPayments(guard.context.principal);
  const duePayments = payments.filter(isDue);
  const dueBalance = duePayments.reduce((total, payment) => total + Number(payment.amount.toString()), 0);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/payments")} title="المدفوعات والمستحقات" userLabel={guard.context.user.name}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <ClientPortalMetric icon="pending_actions" label="المستحقات المفتوحة" tone={duePayments.length ? "due" : "default"} value={String(duePayments.length)} meta="ليست مدفوعة أو ملغاة." />
          <ClientPortalMetric icon="account_balance_wallet" label="إجمالي المستحق" tone={dueBalance > 0 ? "due" : "default"} value={formatMoney(dueBalance)} meta="حسب الفواتير الظاهرة لك." />
          <ClientPortalMetric icon="receipt_long" label="كل السجلات" value={String(payments.length)} meta="فواتير وإيصالات مرتبطة بحسابك." />
        </div>
        <DataTable
          className={clientPortalTableClass}
          columns={columns}
          empty="لا توجد فواتير أو إيصالات مرتبطة بحسابك حتى الآن."
          emptyClassName="client-portal-table-empty"
          mobileRender={(row) => <MobileCard row={row} />}
          rows={payments}
        />
      </div>
    </ClientSiteShell>
  );
}
