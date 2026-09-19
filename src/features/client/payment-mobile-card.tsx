import Link from "next/link";
import { paymentRequiresReview } from "@/lib/legal-finance";
import { paymentReviewCopy } from "@/lib/ui-copy";
import { clientPortalRowClass, clientPortalSecondaryActionClass } from "@/components/layout";
import { Badge } from "@/components/ui";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/legal-format";
import { publicPaymentReceiptUrl } from "@/server/payments/payment-receipt-service";
import { listPortalPayments } from "@/server/portal/client-portal-service";
import type { ClientContent, ClientLocale } from "@/content/client-content";

export type PaymentRow = Awaited<ReturnType<typeof listPortalPayments>>[number];

function paymentReceiptLink(payment: PaymentRow) {
  if (payment.status !== "PAID" || payment.paymentAttempt?.status !== "PAID" || paymentRequiresReview(payment.paymentAttempt)) {
    return null;
  }

  return publicPaymentReceiptUrl({ attemptId: payment.paymentAttempt.id, paymentId: payment.id });
}

function statusTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (status === "CANCELLED") return "closed" as const;
  if (status === "OVERDUE" || status === "PENDING") return "danger" as const;
  return "pending" as const;
}

/**
 * Mobile payment card (Phase 08). Amount, payment status, and the primary
 * navigation actions (receipt view / open case) stay visible; case, issued,
 * and due dates collapse into one Animate UI Accordion. All actions remain
 * semantic navigation Links — never async buttons.
 */
export function MobileCard({ row, copy, locale }: { row: PaymentRow; copy: ClientContent; locale: ClientLocale }) {
  const receiptUrl = paymentReceiptLink(row);

  return (
    <div className={clientPortalRowClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[var(--kmt-client-text)]">{row.invoiceNumber}</p>
        <Badge tone={paymentRequiresReview(row.paymentAttempt) ? "danger" : statusTone(row.status)}>{paymentRequiresReview(row.paymentAttempt) ? paymentReviewCopy[locale].review : copy.statuses.payment[row.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}</Badge>
      </div>
      <p className="mt-2 text-lg font-semibold text-[var(--kmt-client-text)]">{formatMoney(row.amount.toString(), row.currency, locale)}</p>
      {receiptUrl || row.case ? (
        <div className="mt-4 grid gap-2">
          {receiptUrl ? (
            <Link className={buttonClasses({ variant: "primary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={receiptUrl}>
              {copy.common.viewInvoice}
            </Link>
          ) : null}
          {row.case ? (
            <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.case.id}`}>
              {copy.common.openCase}
            </Link>
          ) : null}
        </div>
      ) : null}
      <Accordion className="mt-3" collapsible data-testid={`client-payment-details-${row.id}`} type="single">
        <AccordionItem
          className="rounded border border-[var(--kmt-client-line)] bg-transparent px-3 py-1"
          value="details"
        >
          <AccordionTrigger className="py-2 text-start text-sm font-semibold text-[var(--kmt-client-muted)] hover:no-underline">
            {row.receiptNumber ? `${copy.common.receipt}: ${row.receiptNumber}` : copy.common.invoice}
          </AccordionTrigger>
          <AccordionContent>
            <dl className="grid gap-2 pb-3 text-sm">
              <div>
                <dt className="font-semibold text-[var(--kmt-client-muted)]">{copy.common.case}</dt>
                <dd className="mt-0.5 break-words text-[var(--kmt-client-text)]" dir="auto">
                  {row.case ? (
                    <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
                      {row.case.internalFileNumber}
                    </Link>
                  ) : (
                    copy.common.noCase
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--kmt-client-muted)]">{copy.common.issued}</dt>
                <dd className="mt-0.5 break-words text-[var(--kmt-client-text)]">{formatDateTime(row.issueDate, locale)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--kmt-client-muted)]">{copy.common.dueDate}</dt>
                <dd className="mt-0.5 break-words text-[var(--kmt-client-text)]">{formatDateTime(row.dueDate, locale)}</dd>
              </div>
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
