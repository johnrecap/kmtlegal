import { paymentRequiresReview, paymentNeedsOrderVerification } from "@/lib/legal-finance";
import Link from "next/link";
import { paymentReviewCopy } from "@/lib/ui-copy";
import { ClientPortalMetric, ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataTable, type DataTableColumn } from "@/components/ui";
import { MobileCard } from "@/features/client/payment-mobile-card";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/legal-format";
import { isPortalDuePaymentStatus } from "@/lib/portal-visibility";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { publicPaymentReceiptUrl } from "@/server/payments/payment-receipt-service";
import { getPortalDueBalances, listPortalPaymentAttempts, listPortalPayments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale, type ClientContent, type ClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("paymentsTitle");
}

type PaymentRow = Awaited<ReturnType<typeof listPortalPayments>>[number];
type PaymentAttemptRow = Awaited<ReturnType<typeof listPortalPaymentAttempts>>[number];

function isDue(payment: PaymentRow) {
  return isPortalDuePaymentStatus(payment.status);
}

type DueBalance = Awaited<ReturnType<typeof getPortalDueBalances>>[number];

function formatDueBalances(balances: DueBalance[], locale: ClientLocale) {
  if (!balances.length) {
    return formatMoney(0, "EGP", locale);
  }

  return balances
    .map((balance) => formatMoney(balance.amount.toString(), balance.currency, locale))
    .join(" · ");
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
  if (payment.status !== "PAID" || payment.paymentAttempt?.status !== "PAID" || paymentRequiresReview(payment.paymentAttempt)) {
    return null;
  }

  return publicPaymentReceiptUrl({ attemptId: payment.paymentAttempt.id, paymentId: payment.id });
}

function paymentColumns(copy: ClientContent, locale: ClientLocale): Array<DataTableColumn<PaymentRow>> {
  return [
  {
    key: "invoice",
    header: copy.common.invoice,
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.invoiceNumber}</p>
        {row.receiptNumber ? <p className="mt-1 text-xs text-kmt-muted">{copy.common.receipt}: {row.receiptNumber}</p> : null}
      </div>
    )
  },
  {
    key: "case",
    header: copy.common.case,
    render: (row) =>
      row.case ? (
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        copy.common.noCase
      )
  },
  { key: "amount", header: copy.common.amount, render: (row) => formatMoney(row.amount.toString(), row.currency, locale) },
  { key: "status", header: copy.common.status, render: (row) => <Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy[locale].review : copy.statuses.payment[row.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}</Badge> },
  { key: "issueDate", header: copy.common.issued, render: (row) => formatDateTime(row.issueDate, locale) },
  { key: "dueDate", header: copy.common.dueDate, render: (row) => formatDateTime(row.dueDate, locale) },
  {
    key: "receipt",
    header: copy.common.invoice,
    render: (row) => {
      const receiptUrl = paymentReceiptLink(row);
      return receiptUrl ? (
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-10 ${clientPortalSecondaryActionClass}` })} href={receiptUrl}>
          {copy.common.viewInvoice}
        </Link>
      ) : (
        <span className="text-sm text-kmt-muted">{copy.common.unavailable}</span>
      );
    }
  }
  ];
}


function GatewayAttemptCards({ attempts, copy, locale }: { attempts: PaymentAttemptRow[]; copy: ClientContent; locale: ClientLocale }) {
  if (!attempts.length) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="client-payment-attempts-title">
      <div>
        <h2 id="client-payment-attempts-title" className="text-lg font-semibold text-[var(--kmt-client-text)]">
          {copy.payments.bookingAttempts}
        </h2>
        <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">{copy.payments.bookingAttemptsDescription}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {attempts.map((attempt) => (
          <div key={attempt.id} className={clientPortalRowClass}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-kmt-ink">{formatMoney(attempt.amount.toString(), attempt.currency, locale)}</p>
              <Badge tone={paymentRequiresReview(attempt) ? "danger" : attemptTone(attempt.status)}>{paymentNeedsOrderVerification(attempt) ? paymentReviewCopy[locale].orderVerification : paymentRequiresReview(attempt) ? paymentReviewCopy[locale].review : copy.statuses.paymentAttempt[attempt.status as keyof typeof copy.statuses.paymentAttempt] ?? copy.common.unknown}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-kmt-muted">{attempt.appointment.title}</p>
            <p className="text-sm leading-6 text-kmt-muted">{formatDateTime(attempt.appointment.startsAt, locale)}</p>
            {attempt.payment ? <p className="mt-2 text-sm text-kmt-muted">{copy.payments.paymentInvoice}: {attempt.payment.invoiceNumber}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {attempt.checkoutUrl && !paymentRequiresReview(attempt) && ["CREATED", "PENDING"].includes(attempt.status) ? (
                <Link className={buttonClasses({ variant: "primary", size: "sm", className: `min-h-11 ${clientPortalSecondaryActionClass}` })} href={attempt.checkoutUrl}>
                  {copy.payments.continuePayment}
                </Link>
              ) : null}
              <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 ${clientPortalSecondaryActionClass}` })} href={`/payment/consultation/return?attemptId=${attempt.id}`}>
                {copy.payments.followStatus}
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
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const [payments, paymentAttempts, dueBalances] = await Promise.all([
    listPortalPayments(guard.context.principal),
    listPortalPaymentAttempts(guard.context.principal),
    getPortalDueBalances(guard.context.principal)
  ]);
  const activeGatewayAttempts = paymentAttempts.filter((attempt) => attempt.status !== "PAID" || !attempt.payment);
  const duePayments = payments.filter(isDue);

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/payments", locale)} title={copy.payments.title} userLabel={guard.context.user.name}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <ClientPortalMetric icon="pending_actions" label={copy.payments.openDues} tone={duePayments.length ? "due" : "default"} value={String(duePayments.length)} meta={copy.payments.openDuesMeta} />
          <ClientPortalMetric icon="account_balance_wallet" label={copy.payments.dueTotal} tone={dueBalances.length ? "due" : "default"} value={formatDueBalances(dueBalances, locale)} meta={copy.payments.dueTotalMeta} />
          <ClientPortalMetric icon="receipt_long" label={copy.payments.records} value={String(payments.length)} meta={copy.payments.allRecordsMeta} />
        </div>
        {payments.some(row => paymentRequiresReview(row.paymentAttempt)) ? <p className="text-sm text-kmt-muted">{paymentReviewCopy[locale].totals}</p> : null}
        <GatewayAttemptCards attempts={activeGatewayAttempts} copy={copy} locale={locale} />
        <DataTable
          className={clientPortalTableClass}
          columns={paymentColumns(copy, locale)}
          empty={copy.payments.empty}
          emptyClassName="client-portal-table-empty"
          mobileRender={(row) => <MobileCard copy={copy} locale={locale} row={row} />}
          rows={payments}
        />
      </div>
    </ClientSiteShell>
  );
}
