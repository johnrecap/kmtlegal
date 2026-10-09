import { paymentLedgerCopy } from "@/content/payment-ledger-copy";
import { formatDateTime, formatMoney } from "@/lib/legal-format";

export type LedgerViewValue = {
  invoiceNumber: string; currency: string;
  documents?: Array<{ id: string; fileName: string }>;
  balance: { total: { toString(): string }; paid: { toString(): string }; remaining: { toString(): string }; reviewRequired: boolean };
  entries: Array<{ id: string; kind: string; amount: { toString(): string }; currency: string; method: string; receiptNumber: string; occurredAt: Date | string }>;
};
export function PaymentLedgerView({ invoice, locale }: { invoice: LedgerViewValue; locale: "ar" | "en" }) {
  const copy = paymentLedgerCopy[locale];
  return <section className="min-w-0 space-y-4 rounded-lg border border-border bg-surface p-4 text-foreground" aria-label={`${copy.entries} ${invoice.invoiceNumber}`}>
    <h3 className="break-all font-semibold"><bdi>{invoice.invoiceNumber}</bdi></h3>
    <dl className="grid gap-3 sm:grid-cols-3">{(["total", "paid", "remaining"] as const).map(key => <div key={key}><dt className="text-sm text-muted-foreground">{copy[key]}</dt><dd className="mt-1 font-semibold">{formatMoney(invoice.balance[key].toString(), invoice.currency, locale)}</dd></div>)}</dl>
    {invoice.balance.reviewRequired && <p role="status" className="text-sm text-warning">{copy.review}</p>}
    {!!invoice.documents?.length && <div className="space-y-2"><p className="text-sm">{copy.proof}</p>{invoice.documents.map(document => <a key={document.id} className="block min-h-11 break-all py-2 underline" href={`/api/files/${document.id}/download`}>{document.fileName}</a>)}</div>}
    <details><summary className="min-h-11 cursor-pointer py-3 font-medium">{copy.entries}</summary>
      {!invoice.entries.length && <p className="py-3 text-sm">{copy.empty}</p>}
      <ol className="space-y-3">{invoice.entries.map(entry => <li key={entry.id} className="break-words rounded border border-border p-3 text-sm leading-7">
        <p className="font-semibold">{copy.kinds[entry.kind as keyof typeof copy.kinds]} · {formatMoney(entry.amount.toString(), entry.currency, locale)}</p>
        <p>{formatDateTime(entry.occurredAt, locale)} · {copy.methods[entry.method as keyof typeof copy.methods] ?? entry.method}</p>
        <p className="break-all">{copy.receipt}: <bdi>{entry.receiptNumber}</bdi></p>
      </li>)}</ol>
    </details>
  </section>;
}
