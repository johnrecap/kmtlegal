import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardHeader, CardTitle, MetricCard, StateBlock } from "@/components/ui";
import { appointmentStatusLabels, caseStatusLabels, formatDateTime, formatMoney, labelFrom, paymentStatusLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalDashboard } from "@/server/portal/client-portal-service";
import { portalNavForPath } from "./portal-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة العميل | KMT Legal",
  description: "مدخل محمي لعملاء KMT Legal."
};

function paymentBalance(payments: Awaited<ReturnType<typeof getPortalDashboard>>["payments"]) {
  return payments
    .filter((payment) => payment.status !== "PAID" && payment.status !== "CANCELLED")
    .reduce((total, payment) => total + Number(payment.amount.toString()), 0);
}

export default async function PortalHomePage() {
  const guard = await requirePortalPage("/portal");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const dashboard = await getPortalDashboard(guard.context.principal);
  const openBalance = paymentBalance(dashboard.payments);

  return (
    <DashboardShell
      eyebrow="بوابة العميل"
      mode="portal"
      navItems={portalNavForPath("/portal")}
      title={`مرحباً ${dashboard.client.fullName}`}
      userLabel={guard.context.user.name}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="القضايا" value={String(dashboard.cases.length)} meta="أحدث الملفات المرتبطة بحسابك." />
          <MetricCard label="المواعيد القادمة" value={String(dashboard.appointments.length)} meta="المواعيد المجدولة للمتابعة." />
          <MetricCard label="المستندات" value={String(dashboard.documentsCount)} meta="مستندات مرئية لك بعد المراجعة." />
          <MetricCard label="رصيد مفتوح" value={formatMoney(openBalance)} meta="فواتير غير مدفوعة أو معلقة." />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>القضايا النشطة</CardTitle>
                <ButtonLink href="/portal/cases" size="sm" variant="secondary">
                  كل القضايا
                </ButtonLink>
              </div>
            </CardHeader>
            <CardContent>
              {dashboard.cases.length ? (
                <div className="space-y-3">
                  {dashboard.cases.map((legalCase) => (
                    <Link key={legalCase.id} className="block rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/portal/cases/${legalCase.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{legalCase.title}</p>
                        <Badge tone="active">{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">{legalCase.internalFileNumber}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد قضايا بعد" description="عند تحويل طلب الاستشارة إلى قضية ستظهر هنا تلقائياً." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>المواعيد القادمة</CardTitle>
                <ButtonLink href="/portal/appointments" size="sm" variant="secondary">
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
                <StateBlock title="لا توجد مواعيد قادمة" description="سيظهر أي موعد متابعة أو استشارة بعد تأكيده من المكتب." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أحدث الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.payments.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dashboard.payments.map((payment) => (
                  <div key={payment.id} className="rounded border border-kmt-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-kmt-ink">{payment.invoiceNumber}</p>
                      <Badge tone={payment.status === "PAID" ? "active" : "pending"}>{labelFrom(paymentStatusLabels, payment.status)}</Badge>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-kmt-ink">{formatMoney(payment.amount.toString(), payment.currency)}</p>
                    <p className="mt-1 text-sm text-kmt-muted">تاريخ الإصدار: {formatDateTime(payment.issueDate)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <StateBlock title="لا توجد فواتير" description="أي فاتورة أو إيصال يدوي من المكتب سيظهر هنا للمتابعة فقط." />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
