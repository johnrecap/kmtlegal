import type { Metadata } from "next";
import { ClientSiteShell } from "@/components/layout";
import { Badge, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, StateBlock } from "@/components/ui";
import {
  appointmentStatusLabels,
  appointmentTypeLabels,
  caseStatusLabels,
  documentStatusLabels,
  formatBytes,
  formatDateTime,
  formatMoney,
  labelFrom,
  modeLabels,
  paymentStatusLabels,
  priorityLabels
} from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalCaseDetail } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تفاصيل القضية | KMT Legal"
};

type PageProps = {
  params: {
    caseId: string;
  };
};

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-kmt-muted">{label}</p>
      <div className="mt-1 text-sm leading-6 text-kmt-ink">{value || "غير محدد"}</div>
    </div>
  );
}

export default async function ClientCaseDetailPage({ params }: PageProps) {
  const guard = await requirePortalPage(`/client/cases/${params.caseId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const legalCase = await getPortalCaseDetail(guard.context.principal, params.caseId);

  return (
    <ClientSiteShell
      navItems={clientNavForPath("/client/cases")}
      title={legalCase.title}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink href="/client/cases" size="sm" variant="secondary">
          رجوع
        </ButtonLink>
      }
    >
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{legalCase.internalFileNumber}</CardTitle>
                <CardDescription>{legalCase.caseType}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
                <Badge tone={legalCase.priority === "URGENT" || legalCase.priority === "HIGH" ? "pending" : "neutral"}>{labelFrom(priorityLabels, legalCase.priority)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="المحامي المسؤول" value={legalCase.assignedLawyer.name} />
              <DetailItem label="البريد المهني" value={legalCase.assignedLawyer.email} />
              <DetailItem label="الموعد التالي" value={formatDateTime(legalCase.nextSessionAt)} />
              <DetailItem label="تاريخ إنشاء الملف" value={formatDateTime(legalCase.createdAt)} />
            </div>
            {legalCase.summary ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-kmt-ink">{legalCase.summary}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>الجلسات</CardTitle>
            </CardHeader>
            <CardContent>
              {legalCase.sessions.length ? (
                <div className="space-y-3">
                  {legalCase.sessions.map((session) => (
                    <div key={session.id} className="rounded border border-kmt-border p-3">
                      <p className="font-semibold text-kmt-ink">{session.courtName || "جلسة متابعة"}</p>
                      <p className="mt-1 text-sm text-kmt-muted">{formatDateTime(session.sessionDate)}</p>
                      {session.decision ? <p className="mt-2 text-sm leading-6 text-kmt-ink">{session.decision}</p> : null}
                      {session.nextSessionDate ? <p className="mt-2 text-sm text-kmt-muted">الجلسة التالية: {formatDateTime(session.nextSessionDate)}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد جلسات مسجلة" description="تحديثات الجلسات ستظهر هنا عند إضافتها من المكتب." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المواعيد</CardTitle>
            </CardHeader>
            <CardContent>
              {legalCase.appointments.length ? (
                <div className="space-y-3">
                  {legalCase.appointments.map((appointment) => (
                    <div key={appointment.id} className="rounded border border-kmt-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{appointment.title}</p>
                        <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">
                        {formatDateTime(appointment.startsAt)} - {labelFrom(appointmentTypeLabels, appointment.type)} - {labelFrom(modeLabels, appointment.mode)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مواعيد" description="أي موعد مرتبط بالقضية سيظهر هنا." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>المستندات المرئية</CardTitle>
            </CardHeader>
            <CardContent>
              {legalCase.documents.length ? (
                <div className="space-y-3">
                  {legalCase.documents.map((document) => (
                    <a key={document.id} className="block rounded border border-kmt-border p-3 hover:bg-slate-50" href={`/api/files/${document.id}/download`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-navy">{document.fileName}</p>
                        <Badge tone="neutral">{labelFrom(documentStatusLabels, document.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-kmt-muted">{formatBytes(document.fileSize)}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مستندات مرئية" description="المكتب يحدد المستندات التي تظهر لك داخل البوابة." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المدفوعات</CardTitle>
            </CardHeader>
            <CardContent>
              {legalCase.payments.length ? (
                <div className="space-y-3">
                  {legalCase.payments.map((payment) => (
                    <div key={payment.id} className="rounded border border-kmt-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-kmt-ink">{payment.invoiceNumber}</p>
                        <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>{labelFrom(paymentStatusLabels, payment.status)}</Badge>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-kmt-ink">{formatMoney(payment.amount.toString(), payment.currency)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <StateBlock title="لا توجد مدفوعات" description="أي فاتورة مرتبطة بالقضية ستظهر هنا." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientSiteShell>
  );
}
