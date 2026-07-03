import type { Metadata } from "next";
import Link from "next/link";
import { ClientPortalMetric, ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { publicPaymentReceiptUrl } from "@/server/payments/payment-receipt-service";
import { listPortalPaymentAttempts, listPortalPayments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدفوعاتي | KMT Legal"
};

type PaymentRow = Awaited<ReturnType<typeof listPortalPayments>>[number];
type PaymentAttemptRow = Awaited<ReturnType<typeof listPortalPaymentAttempts>>[number];

function isDue(payment: PaymentRow) {
  return payment.status !== "PAID" && payment.status !== "CANCELLED";
}

function statusTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (status === "CANCELLED") return "closed" as const;
  if (status === "OVERDUE" || status === "PENDING") return "danger" as const;
  return "pending" as const;
}

function attemptTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (status === "REFUNDED" || status === "CANCELLED") return "closed" as const;
  if (status === "FAILED" || status === "EXPIRED" || status === "DISPUTED") return "danger" as const;
  return "pending" as const;
}

function paymentReceiptLink(payment: PaymentRow) {
  if (payment.status !== "PAID" || !payment.paymentAttempt?.id) {
    return null;
  }

  return publicPaymentReceiptUrl({ attemptId: payment.paymentAttempt.id, paymentId: payment.id });
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
  { key: "dueDate", header: "الاستحقاق", render: (row) => formatDateTime(row.dueDate) },
  {
    key: "receipt",
    header: "الفاتورة",
    render: (row) => {
      const receiptUrl = paymentReceiptLink(row);
      return receiptUrl ? (
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-10 ${clientPortalSecondaryActionClass}` })} href={receiptUrl}>
          عرض الفاتورة
        </Link>
      ) : (
        <span className="text-sm text-kmt-muted">غير متاحة</span>
      );
    }
  }
];

function MobileCard({ row }: { row: PaymentRow }) {
  const receiptUrl = paymentReceiptLink(row);

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
        receiptUrl || row.case ? (
          <div className="grid gap-2">
            {receiptUrl ? (
              <Link className={buttonClasses({ variant: "primary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={receiptUrl}>
                عرض الفاتورة
              </Link>
            ) : null}
            {row.case ? (
              <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.case.id}`}>
                فتح القضية
              </Link>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}

function GatewayAttemptCards({ attempts }: { attempts: PaymentAttemptRow[] }) {
  if (!attempts.length) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="client-payment-attempts-title">
      <div>
        <h2 id="client-payment-attempts-title" className="text-lg font-semibold text-kmt-ink">
          محاولات دفع حجز الاستشارة
        </h2>
        <p className="mt-1 text-sm text-kmt-muted">يتم تأكيد الموعد فقط بعد إشعار دفع موثوق من بوابة الدفع.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="rounded border border-kmt-border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-kmt-ink">{formatMoney(attempt.amount.toString(), attempt.currency)}</p>
              <Badge tone={attemptTone(attempt.status)}>{attempt.status}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-kmt-muted">{attempt.appointment.title}</p>
            <p className="text-sm leading-6 text-kmt-muted">{formatDateTime(attempt.appointment.startsAt)}</p>
            {attempt.payment ? <p className="mt-2 text-sm text-kmt-muted">فاتورة: {attempt.payment.invoiceNumber}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {attempt.checkoutUrl && ["CREATED", "PENDING"].includes(attempt.status) ? (
                <Link className={buttonClasses({ variant: "primary", size: "sm", className: `min-h-11 ${clientPortalSecondaryActionClass}` })} href={attempt.checkoutUrl}>
                  استكمال الدفع
                </Link>
              ) : null}
              <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 ${clientPortalSecondaryActionClass}` })} href={`/payment/consultation/return?attemptId=${attempt.id}`}>
                متابعة الحالة
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ClientPaymentsPage() {
  const guard = await requirePortalPage("/client/payments");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [payments, paymentAttempts] = await Promise.all([
    listPortalPayments(guard.context.principal),
    listPortalPaymentAttempts(guard.context.principal)
  ]);
  const activeGatewayAttempts = paymentAttempts.filter((attempt) => attempt.status !== "PAID" || !attempt.payment);
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
        <GatewayAttemptCards attempts={activeGatewayAttempts} />
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
