import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent, navForPath, type PublicContent } from "@/content/public-content";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/legal-format";
import { PaymentStatusPoller } from "@/features/public-site/payment-status-poller";
import { getPublicPaymentAttemptStatus } from "@/server/payments/payment-service";

export const dynamic = "force-dynamic";

type PaymentReturnPageProps = {
  searchParams?: Promise<{
    attemptId?: string;
    token?: string;
    locale?: string;
  }>;
};

export default async function ConsultationPaymentReturnPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const attemptId = params?.attemptId ?? "";
  const token = params?.token ?? "";
  const locale = params?.locale === "en" ? "en" : "ar";
  const content = getPublicContent(locale);
  const paymentReturnCopy = content.paymentReturn;
  const result = attemptId ? await getPaymentStatus(attemptId, token) : null;
  const tone = statusTone(result?.status, paymentReturnCopy);
  const isPaid = result?.status === "PAID" && result.payment;
  const isPending = result?.status === "CREATED" || result?.status === "PENDING";
  const bookingHref = resumeBookingHref(result, token, locale);

  return (
    <PublicShell currentPath="/payment/consultation/return" locale={locale} navItems={navForPath("/", locale)}>
      <section className="mx-auto min-h-[68vh] max-w-[940px] px-4 py-16 sm:px-6 lg:px-10" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className="rounded-[1.75rem] border border-kmt-gold/30 bg-[#100d08] p-6 shadow-[0_34px_120px_-68px_rgba(183,134,64,0.58)] sm:p-8">
          <div className="flex items-start gap-4">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", tone.iconClass)}>
              <MaterialSymbol name={tone.icon} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-kmt-gold">{paymentReturnCopy.eyebrow}</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">{tone.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-amber-50/78">{tone.description}</p>
            </div>
          </div>

          {result ? (
            <div className="mt-8 space-y-5">
              {isPaid ? <PaidConfirmation copy={paymentReturnCopy} result={result} /> : null}

              {!result.access.verified ? (
                <p className="rounded-2xl border border-amber-300/25 bg-amber-950/20 px-4 py-3 text-sm leading-7 text-amber-50/82">
                  {paymentReturnCopy.safeLinkNotice}
                </p>
              ) : null}

              {isPending ? (
                <PaymentStatusPoller
                  attemptId={result.id}
                  token={token}
                  expiresAt={result.expiresAt}
                  initialStatus={result.status}
                  labels={{
                    pending: paymentReturnCopy.pending,
                    countdown: paymentReturnCopy.countdown,
                    expired: paymentReturnCopy.expired
                  }}
                />
              ) : null}

              <dl className="grid gap-3 text-sm text-amber-50/86 sm:grid-cols-2">
                <StatusItem label={paymentReturnCopy.labels.attemptId} value={result.id} dir="ltr" />
                <StatusItem label={paymentReturnCopy.labels.status} value={result.status} />
                <StatusItem label={paymentReturnCopy.labels.amount} value={formatMoney(result.amount, result.currency)} />
                <StatusItem label={paymentReturnCopy.labels.appointment} value={formatPaymentDate(result.appointment.startsAt, locale)} />
                {result.payment ? <StatusItem label={paymentReturnCopy.labels.invoiceNumber} value={result.payment.invoiceNumber ?? "N/A"} dir="ltr" /> : null}
                <StatusItem label={paymentReturnCopy.labels.temporaryHoldExpiresAt} value={formatPaymentDate(result.expiresAt, locale)} />
              </dl>
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-red-300/25 bg-red-950/30 px-4 py-3 text-sm leading-7 text-red-100">
              {paymentReturnCopy.missingStatusTitle}. {paymentReturnCopy.missingStatusDescription}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {result?.checkoutUrl && ["CREATED", "PENDING"].includes(result.status) ? (
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363]" href={result.checkoutUrl}>
                <MaterialSymbol name="lock" />
                {paymentReturnCopy.actions.pay}
              </Link>
            ) : null}
            {result?.payment?.receiptUrl ? (
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363]" href={result.payment.receiptUrl}>
                <MaterialSymbol name="receipt_long" />
                {paymentReturnCopy.actions.receipt}
              </Link>
            ) : null}
            {result?.clientAccountSetup ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363]"
                href={result.clientAccountSetup.status === "setup_available" ? result.clientAccountSetup.setupUrl : result.clientAccountSetup.loginUrl}
              >
                <MaterialSymbol name="account_circle" />
                {result.clientAccountSetup.status === "setup_available" ? paymentReturnCopy.actions.accountSetup : paymentReturnCopy.actions.accountLogin}
              </Link>
            ) : null}
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-amber-50 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold" href={bookingHref}>
              <MaterialSymbol name="event_available" />
              {paymentReturnCopy.actions.newBooking}
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

async function getPaymentStatus(attemptId: string, token?: string | null) {
  try {
    return await getPublicPaymentAttemptStatus({ attemptId, token });
  } catch {
    return null;
  }
}

function resumeBookingHref(
  result: Awaited<ReturnType<typeof getPaymentStatus>>,
  token: string,
  locale: "ar" | "en"
) {
  const basePath = locale === "ar" ? "/ar/book-consultation" : "/book-consultation";
  if (!result?.access.verified || !token || !["FAILED", "EXPIRED", "CANCELLED"].includes(result.status)) {
    return basePath;
  }

  const params = new URLSearchParams({
    resumeAttemptId: result.id,
    token,
    locale
  });
  return `${basePath}?${params.toString()}`;
}

function PaidConfirmation({
  copy,
  result
}: {
  copy: PublicContent["paymentReturn"];
  result: NonNullable<Awaited<ReturnType<typeof getPaymentStatus>>>;
}) {
  if (!result.payment) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-emerald-300/25 bg-emerald-950/20 p-4 text-amber-50 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{copy.paidConfirmation.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-amber-50/78">{copy.paidConfirmation.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-100">
          <MaterialSymbol name="check_circle" />
          {copy.paidConfirmation.badge}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {result.client ? <StatusItem label={copy.labels.clientName} value={result.client.fullName} /> : null}
        {result.client ? <StatusItem label={copy.labels.phone} value={result.client.phone} dir="ltr" /> : null}
        <StatusItem label={copy.labels.paidAmount} value={formatMoney(result.payment.amount, result.payment.currency)} />
        <StatusItem label={copy.labels.receiptNumber} value={result.payment.receiptNumber ?? copy.labels.unavailable} dir="ltr" />
      </dl>
    </section>
  );
}

function statusTone(status: string | undefined, copy: PublicContent["paymentReturn"]) {
  if (status === "PAID") {
    return {
      icon: "check_circle",
      iconClass: "border-emerald-300/40 bg-emerald-950/35 text-emerald-200",
      title: copy.statusTones.paid.title,
      description: copy.statusTones.paid.description
    };
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return {
      icon: "error",
      iconClass: "border-red-300/40 bg-red-950/35 text-red-200",
      title: copy.statusTones.failed.title,
      description: copy.statusTones.failed.description
    };
  }
  if (status === "EXPIRED") {
    return {
      icon: "timer_off",
      iconClass: "border-amber-300/40 bg-amber-950/35 text-amber-100",
      title: copy.statusTones.expired.title,
      description: copy.statusTones.expired.description
    };
  }
  if (status === "PENDING" || status === "CREATED") {
    return {
      icon: "pending",
      iconClass: "border-kmt-gold/45 bg-kmt-gold/15 text-kmt-gold",
      title: copy.statusTones.pending.title,
      description: copy.statusTones.pending.description
    };
  }
  return {
    icon: "help",
    iconClass: "border-red-300/40 bg-red-950/35 text-red-100",
    title: copy.statusTones.unknown.title,
    description: copy.statusTones.unknown.description
  };
}

function StatusItem({ label, value, dir }: { label: string; value: string; dir?: "rtl" | "ltr" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <dt className="text-xs font-semibold text-amber-100/55">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold leading-7 text-white" dir={dir}>
        {value}
      </dd>
    </div>
  );
}

function formatPaymentDate(value: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(new Date(value));
}
