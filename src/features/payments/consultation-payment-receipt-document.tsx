import Link from "next/link";
import type { ReactNode } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatMoney, labelFrom, modeLabels, serviceCategoryLabels } from "@/lib/legal-format";
import type { PaymentReceiptView } from "@/server/payments/payment-receipt-service";
import { ReceiptPrintButton } from "./receipt-print-button";

const providerLabels: Record<string, string> = {
  paytabs: "PayTabs",
  paymob: "Paymob"
};

export function ConsultationPaymentReceiptDocument({ receipt }: { receipt: PaymentReceiptView }) {
  const serviceCategory = labelFrom(serviceCategoryLabels, receipt.consultation?.serviceCategory ?? receipt.attempt.serviceCategory);
  const mode = labelFrom(modeLabels, receipt.attempt.mode);
  const provider = providerLabels[receipt.provider] ?? receipt.provider;

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 text-kmt-ink print:bg-white print:p-0" dir="rtl">
      <div className="mx-auto mb-5 flex max-w-[980px] flex-wrap items-center justify-between gap-3 print:hidden">
        <Link className={buttonClasses({ variant: "secondary", size: "md", className: "min-h-11 bg-white" })} href="/client/payments">
          <MaterialSymbol name="arrow_back" />
          <span>الرجوع للمدفوعات</span>
        </Link>
        <ReceiptPrintButton />
      </div>

      <article className="mx-auto max-w-[980px] overflow-hidden rounded-xl border border-kmt-gold/25 bg-white shadow-[0_28px_90px_-55px_rgba(47,36,20,0.65)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-kmt-border bg-white px-6 py-6 text-kmt-ink sm:px-9">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <KmtBrandLogo size="md" sublabel="فاتورة حجز استشارة" surface="light" variant="lockup" />
            <div className="text-start sm:text-end">
              <p className="text-sm font-semibold text-kmt-gold">KMT Legal Office</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold">فاتورة وإيصال دفع</h1>
              <p className="mt-2 text-sm leading-6 text-kmt-muted">رسوم حجز استشارة قانونية مؤكدة من بوابة الدفع</p>
            </div>
          </div>
        </header>

        <section className="grid gap-0 border-b border-kmt-border md:grid-cols-3">
          <ReceiptStat label="رقم الفاتورة" value={receipt.invoiceNumber} />
          <ReceiptStat label="رقم الإيصال" value={receipt.receiptNumber ?? "غير متاح"} />
          <ReceiptStat label="حالة الدفع" value="مدفوع" tone="success" />
        </section>

        <div className="space-y-8 px-6 py-7 sm:px-9">
          <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <ReceiptPanel title="بيانات العميل">
              <ReceiptRow label="اسم العميل" value={receipt.client.name} />
              <ReceiptRow label="رقم الهاتف" value={receipt.client.phone} dir="ltr" />
              {receipt.client.email ? <ReceiptRow label="البريد الإلكتروني" value={receipt.client.email} dir="ltr" /> : null}
            </ReceiptPanel>

            <ReceiptPanel title="بيانات الدفع">
              <ReceiptRow label="المبلغ المدفوع" value={formatMoney(receipt.amount, receipt.currency)} highlight />
              <ReceiptRow label="تاريخ الدفع" value={formatReceiptDate(receipt.paidAt ?? receipt.issueDate)} />
              <ReceiptRow label="بوابة الدفع" value={provider} />
              <ReceiptRow label="رقم معاملة المزود" value={receipt.providerPaymentId ?? receipt.receiptNumber ?? "غير متاح"} dir="ltr" />
            </ReceiptPanel>
          </section>

          <ReceiptPanel title="تفاصيل الاستشارة">
            <ReceiptRow label="مجال الاستشارة" value={serviceCategory} />
            <ReceiptRow label="طريقة الاستشارة" value={mode} />
            <ReceiptRow label="الموعد" value={formatReceiptDate(receipt.appointment.startsAt)} />
            <ReceiptRow label="مرجع الحجز" value={receipt.attempt.id} dir="ltr" />
          </ReceiptPanel>

          <section className="rounded-lg border border-kmt-gold/30 bg-[#fffaf1] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-kmt-muted">الإجمالي المدفوع</p>
                <p className="mt-1 text-3xl font-semibold text-kmt-ink">{formatMoney(receipt.amount, receipt.currency)}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <MaterialSymbol name="check_circle" />
                مؤكد عبر بوابة الدفع
              </span>
            </div>
          </section>

          <footer className="border-t border-kmt-border pt-5 text-sm leading-7 text-kmt-muted">
            <p>هذه الفاتورة تخص رسوم حجز الاستشارة فقط. يتم تأكيد الموعد بعد وصول إشعار دفع موثوق من بوابة الدفع وربطه برقم الفاتورة أعلاه.</p>
            <p className="mt-2">KMT Legal Office</p>
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

function formatReceiptDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(new Date(value));
}
