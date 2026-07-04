import Link from "next/link";
import { Badge, MaterialSymbol, buttonClasses } from "@/components/ui";
import { formatDateTime } from "@/lib/legal-format";
import { listAdminNotifications } from "@/server/admin/notification-service";
import type { Principal } from "@/server/auth/policy";

export async function AdminNotificationBell({ principal }: { principal: Principal }) {
  const summary = await listAdminNotifications({ actor: principal }).catch(() => null);
  if (!summary) {
    return null;
  }

  const count = summary.unreviewedConsultationCount;

  return (
    <details className="relative">
      <summary
        className={buttonClasses({
          variant: count ? "secondary" : "ghost",
          size: "sm",
          className: "min-w-9 list-none gap-2 px-2 sm:px-3 [&::-webkit-details-marker]:hidden"
        })}
        aria-label="إشعارات مراجعة الاستشارات"
      >
        <MaterialSymbol className="text-[20px]" name="notifications" />
        {count ? <Badge tone="pending">{count}</Badge> : null}
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded border border-kmt-border bg-white p-3 text-sm shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-kmt-ink">طلبات الاستشارة الجديدة</p>
            <p className="mt-1 text-xs text-kmt-muted">{count ? `${count} طلب يحتاج مراجعة السكرتيرة.` : "لا توجد طلبات جديدة غير مراجعة."}</p>
          </div>
          {summary.nextReviewHref ? (
            <Link className="shrink-0 text-xs font-semibold text-kmt-navy hover:underline" href={summary.nextReviewHref}>
              مراجعة التالي
            </Link>
          ) : null}
        </div>
        {summary.consultations.length ? (
          <div className="mt-3 space-y-2">
            {summary.consultations.map((consultation) => (
              <Link key={consultation.id} className="block rounded border border-kmt-border p-2 hover:bg-kmt-canvas" href={consultation.href}>
                <span className="block font-semibold text-kmt-ink">{consultation.fullName}</span>
                <span className="mt-1 block text-xs text-kmt-muted" dir="ltr">
                  {consultation.reference}
                </span>
                {consultation.startsAt ? <span className="mt-1 block text-xs text-kmt-muted">{formatDateTime(new Date(consultation.startsAt))}</span> : null}
              </Link>
            ))}
          </div>
        ) : null}
        <Link className="mt-3 block text-center text-xs font-semibold text-kmt-navy hover:underline" href="/admin/consultations?review=unreviewed">
          فتح كل الطلبات غير المراجعة
        </Link>
      </div>
    </details>
  );
}
