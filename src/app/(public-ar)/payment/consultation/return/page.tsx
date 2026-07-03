import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { MaterialSymbol } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { cn } from "@/lib/cn";
import { getPublicPaymentAttemptStatus } from "@/server/payments/payment-service";

export const dynamic = "force-dynamic";

type PaymentReturnPageProps = {
  searchParams?: Promise<{
    attemptId?: string;
  }>;
};

export default async function ConsultationPaymentReturnPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const attemptId = params?.attemptId ?? "";
  const result = attemptId ? await getPaymentStatus(attemptId) : null;

  return (
    <PublicShell currentPath="/payment/consultation/return" locale="ar" navItems={navForPath("/", "ar")}>
      <section className="mx-auto min-h-[68vh] max-w-[900px] px-4 py-16 sm:px-6 lg:px-10" dir="rtl">
        <div className="rounded-[1.75rem] border border-kmt-gold/30 bg-[#100d08] p-6 shadow-[0_34px_120px_-68px_rgba(183,134,64,0.58)] sm:p-8">
          <div className="flex items-start gap-4">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border", statusTone(result?.status).iconClass)}>
              <MaterialSymbol name={statusTone(result?.status).icon} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-kmt-gold">حالة دفع حجز الاستشارة</p>
              <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">{statusTone(result?.status).title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-amber-50/78">{statusTone(result?.status).description}</p>
            </div>
          </div>

          {result ? (
            <dl className="mt-8 grid gap-3 text-sm text-amber-50/86 sm:grid-cols-2">
              <StatusItem label="رقم محاولة الدفع" value={result.id} />
              <StatusItem label="الحالة" value={result.status} />
              <StatusItem label="المبلغ" value={`${result.amount} ${result.currency}`} />
              <StatusItem label="الموعد" value={formatCairoDate(result.appointment.startsAt)} />
              {result.payment ? <StatusItem label="رقم الفاتورة" value={result.payment.invoiceNumber} /> : null}
              <StatusItem label="انتهاء الحجز المؤقت" value={formatCairoDate(result.expiresAt)} />
            </dl>
          ) : (
            <p className="mt-8 rounded-2xl border border-red-300/25 bg-red-950/30 px-4 py-3 text-sm leading-7 text-red-100">
              رابط الدفع غير مكتمل. ارجع إلى صفحة الحجز وابدأ المحاولة مرة أخرى.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {result?.checkoutUrl && ["CREATED", "PENDING"].includes(result.status) ? (
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363]" href={result.checkoutUrl}>
                <MaterialSymbol name="lock" />
                استكمال الدفع
              </Link>
            ) : null}
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-amber-50 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold" href="/ar/book-consultation">
              <MaterialSymbol name="event_available" />
              حجز موعد جديد
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

async function getPaymentStatus(attemptId: string) {
  try {
    return await getPublicPaymentAttemptStatus({ attemptId });
  } catch {
    return null;
  }
}

function statusTone(status: string | undefined) {
  if (status === "PAID") {
    return {
      icon: "check_circle",
      iconClass: "border-emerald-300/40 bg-emerald-950/35 text-emerald-200",
      title: "تم تأكيد الدفع",
      description: "تم تأكيد موعد الاستشارة بعد وصول إشعار دفع موثوق من بوابة الدفع."
    };
  }
  if (status === "FAILED" || status === "CANCELLED") {
    return {
      icon: "error",
      iconClass: "border-red-300/40 bg-red-950/35 text-red-200",
      title: "تعذر إكمال الدفع",
      description: "لم يتم تأكيد الموعد. يمكنك الرجوع لصفحة الحجز واختيار موعد جديد أو التواصل مع المكتب."
    };
  }
  if (status === "EXPIRED") {
    return {
      icon: "timer_off",
      iconClass: "border-amber-300/40 bg-amber-950/35 text-amber-100",
      title: "انتهت مهلة الحجز المؤقت",
      description: "تم تحرير الموعد المؤقت لأنه لم يصل تأكيد دفع موثوق خلال المهلة."
    };
  }
  if (status === "PENDING" || status === "CREATED") {
    return {
      icon: "pending",
      iconClass: "border-kmt-gold/45 bg-kmt-gold/15 text-kmt-gold",
      title: "ننتظر تأكيد بوابة الدفع",
      description: "لا يتم تأكيد الموعد من صفحة الرجوع. سنعرض التأكيد فقط بعد وصول webhook/IPN موثوق."
    };
  }
  return {
    icon: "help",
    iconClass: "border-red-300/40 bg-red-950/35 text-red-100",
    title: "تعذر قراءة حالة الدفع",
    description: "تحقق من الرابط أو ابدأ محاولة حجز جديدة."
  };
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
      <dt className="text-xs font-semibold text-amber-100/55">{label}</dt>
      <dd className="mt-1 break-words text-base font-semibold leading-7 text-white">{value}</dd>
    </div>
  );
}

function formatCairoDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(new Date(value));
}
