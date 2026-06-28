import type { Metadata } from "next";
import Link from "next/link";
import { ClientSiteShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardHeader, CardTitle, MetricCard, StateBlock } from "@/components/ui";
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
          <MetricCard label="القضايا" value={String(dashboard.cases.length)} meta="آخر ملفاتك النشطة." />
          <MetricCard label="المواعيد القادمة" value={String(dashboard.appointments.length)} meta="قضايا واستشارات مجدولة." />
          <MetricCard label="الملفات" value={String(dashboard.documentsCount)} meta="مستندات مرئية لك." />
          <MetricCard label="المستحقات" value={formatMoney(balance)} meta="غير مدفوعة أو معلقة." />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>القضايا</CardTitle>
                <ButtonLink href="/client/cases" size="sm" variant="secondary">
                  كل القضايا
                </ButtonLink>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.cases.length ? (
                <div className="space-y-3">
                  {dashboard.cases.map((legalCase) => (
                    <Link key={legalCase.id} className="block rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/client/cases/${legalCase.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{legalCase.title}</p>
                        <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">{legalCase.internalFileNumber}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد قضايا بعد" description="أي قضية مرتبطة بحسابك ستظهر هنا." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>المواعيد</CardTitle>
                <ButtonLink href="/client/court-dates" size="sm" variant="secondary">
                  كل المواعيد
                </ButtonLink>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.appointments.length ? (
                <div className="space-y-3">
                  {dashboard.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded border border-kmt-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                        <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">{formatDateTime(appointment.startsAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مواعيد قادمة" description="مواعيد القضايا والاستشارات ستظهر بعد تأكيدها." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>المدفوعات والمستحقات</CardTitle>
              <ButtonLink href="/client/payments" size="sm" variant="secondary">
                كل المدفوعات
              </ButtonLink>
            </div>
          </CardHeader>
          <CardContent>
            {dashboard.payments.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.payments.map((payment) => (
                  <div key={payment.id} className="rounded border border-kmt-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-kmt-ink">{payment.invoiceNumber}</p>
                      <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>
                        {labelFrom(paymentStatusLabels, payment.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-kmt-ink">{formatMoney(payment.amount.toString(), payment.currency)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <StateBlock title="لا توجد مدفوعات" description="أي فاتورة أو إيصال يدوي من المكتب سيظهر هنا." />
            )}
          </CardContent>
        </Card>
      </div>
    </ClientSiteShell>
  );
}
