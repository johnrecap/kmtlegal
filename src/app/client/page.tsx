import type { Metadata } from "next";
import Link from "next/link";
import {
  ClientPortalEmpty,
  ClientPortalMetric,
  ClientPortalPanel,
  ClientPortalRow,
  ClientSiteShell,
  clientPortalSecondaryActionClass
} from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
import { appointmentStatusLabels, caseStatusLabels, formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalDashboard } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "./client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة العميل | KMT Legal",
  description: "مساحة محمية لملفات ومواعيد ومدفوعات عملاء KMT Legal."
};

function openBalance(payments: Awaited<ReturnType<typeof getPortalDashboard>>["payments"]) {
  return payments
    .filter((payment) => payment.status !== "PAID" && payment.status !== "CANCELLED")
    .reduce((total, payment) => total + Number(payment.amount.toString()), 0);
}

export default async function ClientHomePage() {
  const guard = await requirePortalPage("/client");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const dashboard = await getPortalDashboard(guard.context.principal);
  const balance = openBalance(dashboard.payments);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client")} title={`مرحبًا ${dashboard.client.fullName}`} userLabel={guard.context.user.name}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <ClientPortalMetric icon="gavel" label="القضايا" value={String(dashboard.cases.length)} meta="آخر ملفاتك النشطة." />
          <ClientPortalMetric icon="event" label="المواعيد القادمة" value={String(dashboard.appointments.length)} meta="قضايا واستشارات مجدولة." />
          <ClientPortalMetric icon="folder" label="الملفات" value={String(dashboard.documentsCount)} meta="مستندات مرئية لك." />
          <ClientPortalMetric icon="payments" label="المستحقات" tone={balance > 0 ? "due" : "default"} value={formatMoney(balance)} meta="غير مدفوعة أو معلقة." />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel
            action={
              <ButtonLink className={clientPortalSecondaryActionClass} href="/client/cases" size="sm" variant="secondary">
                كل القضايا
              </ButtonLink>
            }
            title="القضايا"
          >
            {dashboard.cases.length ? (
              <div className="space-y-3">
                {dashboard.cases.map((legalCase) => (
                  <Link key={legalCase.id} className="block" href={`/client/cases/${legalCase.id}`}>
                    <ClientPortalRow>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{legalCase.title}</p>
                        <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{legalCase.internalFileNumber}</p>
                    </ClientPortalRow>
                  </Link>
                ))}
              </div>
            ) : (
              <ClientPortalEmpty title="لا توجد قضايا بعد" description="أي قضية مرتبطة بحسابك ستظهر هنا." icon="gavel" />
            )}
          </ClientPortalPanel>

          <ClientPortalPanel
            action={
              <ButtonLink className={clientPortalSecondaryActionClass} href="/client/court-dates" size="sm" variant="secondary">
                كل المواعيد
              </ButtonLink>
            }
            title="المواعيد"
          >
            {dashboard.appointments.length ? (
              <div className="space-y-3">
                {dashboard.appointments.map((appointment) => (
                  <ClientPortalRow key={appointment.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">{appointment.title}</p>
                      <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{formatDateTime(appointment.startsAt)}</p>
                  </ClientPortalRow>
                ))}
              </div>
            ) : (
              <ClientPortalEmpty title="لا توجد مواعيد قادمة" description="مواعيد القضايا والاستشارات ستظهر بعد تأكيدها." icon="event" />
            )}
          </ClientPortalPanel>
        </div>

        <ClientPortalPanel
          action={
            <ButtonLink className={clientPortalSecondaryActionClass} href="/client/payments" size="sm" variant="secondary">
              كل المدفوعات
            </ButtonLink>
          }
          title="المدفوعات والمستحقات"
        >
          {dashboard.payments.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.payments.map((payment) => (
                <ClientPortalRow key={payment.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{payment.invoiceNumber}</p>
                    <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>
                      {labelFrom(paymentStatusLabels, payment.status)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{formatMoney(payment.amount.toString(), payment.currency)}</p>
                </ClientPortalRow>
              ))}
            </div>
          ) : (
            <ClientPortalEmpty title="لا توجد مدفوعات" description="أي فاتورة أو إيصال يدوي من المكتب سيظهر هنا." icon="payments" />
          )}
        </ClientPortalPanel>
      </div>
    </ClientSiteShell>
  );
}
