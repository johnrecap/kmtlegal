import Link from "next/link";
import type { ReactNode } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { getPublicContent } from "@/content/public-content";
import { formatMoney } from "@/lib/legal-format";
import type { PublicLocale } from "@/lib/public-locale";
import type { PaymentReceiptView } from "@/server/payments/payment-receipt-service";
import { ReceiptPrintButton } from "./receipt-print-button";

const providerLabels: Record<string, string> = {
  paytabs: "PayTabs",
  paymob: "Paymob"
};

export function ConsultationPaymentReceiptDocument({ receipt, locale }: { receipt: PaymentReceiptView; locale: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.paymentReceipt;
  const category = receipt.consultation?.serviceCategory ?? receipt.attempt.serviceCategory;
  const serviceCategory = (content.serviceCategories as Record<string, string>)[category] ?? category;
  const mode = copy.modeLabels[receipt.attempt.mode as keyof typeof copy.modeLabels] ?? receipt.attempt.mode;
  const provider = providerLabels[receipt.provider] ?? receipt.provider;

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 text-kmt-ink print:bg-white print:p-0" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto mb-5 flex max-w-[980px] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className={buttonClasses({ variant: "secondary", size: "md", className: "min-h-11 bg-white" })} href={`/login?next=/client/payments&locale=${locale}`}>
          <MaterialSymbol name="arrow_back" />
          <span>{copy.back}</span>
        </Link>
        <ReceiptPrintButton label={copy.print} />
      </div>

      <article className="mx-auto max-w-[980px] overflow-hidden rounded-xl border border-kmt-gold/25 bg-white shadow-[0_28px_90px_-55px_rgba(47,36,20,0.65)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-kmt-border bg-white px-6 py-6 text-kmt-ink sm:px-9">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <KmtBrandLogo size="md" sublabel={copy.sublabel} surface="light" variant="lockup" />
            <div className="text-start sm:text-end">
              <p className="text-sm font-semibold text-kmt-gold">{copy.officeName}</p>
              <h1 className="mt-2 text-3xl font-semibold">{copy.title}</h1>
              <p className="mt-2 text-sm leading-6 text-kmt-muted">{copy.description}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-0 border-b border-kmt-border md:grid-cols-3">
          <ReceiptStat label={copy.invoiceNumber} value={receipt.invoiceNumber} />
          <ReceiptStat label={copy.receiptNumber} value={receipt.receiptNumber ?? copy.unavailable} />
          <ReceiptStat label={copy.paymentStatus} value={copy.paid} tone="success" />
        </section>

        <div className="space-y-8 px-6 py-7 sm:px-9">
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <ReceiptPanel title={copy.clientDetails}>
              <ReceiptRow label={copy.clientName} value={receipt.client.name} />
            </ReceiptPanel>

            <ReceiptPanel title={copy.paymentDetails}>
              <ReceiptRow label={copy.paidAmount} value={formatMoney(receipt.amount, receipt.currency, locale)} highlight />
              <ReceiptRow label={copy.paidAt} value={formatReceiptDate(receipt.paidAt ?? receipt.issueDate, locale)} />
              <ReceiptRow label={copy.provider} value={provider} />
              <ReceiptRow label={copy.providerReference} value={receipt.providerPaymentId ?? receipt.receiptNumber ?? copy.unavailable} dir="ltr" />
            </ReceiptPanel>
          </section>

          <ReceiptPanel title={copy.consultationDetails}>
            <ReceiptRow label={copy.serviceCategory} value={serviceCategory} />
            <ReceiptRow label={copy.consultationMode} value={mode} />
            <ReceiptRow label={copy.appointment} value={formatReceiptDate(receipt.appointment.startsAt, locale)} />
            <ReceiptRow label={copy.bookingReference} value={receipt.attempt.id} dir="ltr" />
          </ReceiptPanel>

          <section className="rounded-lg border border-kmt-gold/30 bg-[#fffaf1] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-kmt-muted">{copy.totalPaid}</p>
                <p className="mt-1 text-3xl font-semibold text-kmt-ink">{formatMoney(receipt.amount, receipt.currency, locale)}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <MaterialSymbol name="check_circle" />
                {copy.confirmed}
              </span>
            </div>
          </section>

          <footer className="border-t border-kmt-border pt-5 text-sm leading-7 text-kmt-muted">
            <p>{copy.note}</p>
            <p className="mt-2">{copy.officeName}</p>
          </footer>
        </div>
      </article>
    </main>
  );
}

function ReceiptPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-kmt-border bg-white">
      <h2 className="border-b border-kmt-border px-4 py-3 text-base font-semibold text-kmt-ink">{title}</h2>
      <dl className="divide-y divide-kmt-border">{children}</dl>
    </section>
  );
}

function ReceiptRow({ label, value, dir, highlight }: { label: string; value: string; dir?: "rtl" | "ltr"; highlight?: boolean }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:items-center">
      <dt className="text-sm font-semibold text-kmt-muted">{label}</dt>
      <dd className={highlight ? "text-xl font-semibold text-kmt-ink" : "break-words text-base font-semibold text-kmt-ink"} dir={dir}>
        {value}
      </dd>
    </div>
  );
}

function ReceiptStat({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="border-b border-kmt-border px-6 py-4 md:border-b-0 md:border-l last:md:border-l-0 sm:px-9">
      <p className="text-xs font-semibold text-kmt-muted">{label}</p>
      <p className={tone === "success" ? "mt-1 text-lg font-semibold text-emerald-700" : "mt-1 break-words text-lg font-semibold text-kmt-ink"}>{value}</p>
    </div>
  );
}

function formatReceiptDate(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(new Date(value));
}
