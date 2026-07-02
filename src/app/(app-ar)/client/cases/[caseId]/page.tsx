import type { Metadata } from "next";
import {
  ClientPortalDetailItem,
  ClientPortalEmpty,
  ClientPortalPanel,
  ClientPortalRow,
  ClientSiteShell,
  clientPortalSecondaryActionClass
} from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
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
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ClientCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params;
  const guard = await requirePortalPage(`/client/cases/${caseId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const legalCase = await getPortalCaseDetail(guard.context.principal, caseId);

  return (
    <ClientSiteShell
      navItems={clientNavForPath("/client/cases")}
      title={legalCase.title}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink className={clientPortalSecondaryActionClass} href="/client/cases" size="sm" variant="secondary">
          رجوع
        </ButtonLink>
      }
    >
      <div className="space-y-5">
        <ClientPortalPanel
          action={
            <div className="flex flex-wrap gap-2">
              <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, legalCase.status)}</Badge>
              <Badge tone={legalCase.priority === "URGENT" || legalCase.priority === "HIGH" ? "pending" : "neutral"}>{labelFrom(priorityLabels, legalCase.priority)}</Badge>
            </div>
          }
          description={legalCase.caseType}
          title={legalCase.internalFileNumber}
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ClientPortalDetailItem label="المحامي المسؤول" value={legalCase.assignedLawyer.name} />
              <ClientPortalDetailItem label="البريد المهني" value={legalCase.assignedLawyer.email} />
              <ClientPortalDetailItem label="الموعد التالي" value={formatDateTime(legalCase.nextSessionAt)} />
              <ClientPortalDetailItem label="تاريخ إنشاء الملف" value={formatDateTime(legalCase.createdAt)} />
            </div>
            {legalCase.summary ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-100">{legalCase.summary}</p> : null}
        </ClientPortalPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel title="الجلسات">
              {legalCase.sessions.length ? (
                <div className="space-y-3">
                  {legalCase.sessions.map((session) => (
                    <ClientPortalRow key={session.id}>
                      <p className="font-semibold text-white">{session.courtName || "جلسة متابعة"}</p>
                      <p className="mt-1 text-sm text-slate-300">{formatDateTime(session.sessionDate)}</p>
                      {session.decision ? <p className="mt-2 text-sm leading-6 text-slate-100">{session.decision}</p> : null}
                      {session.nextSessionDate ? <p className="mt-2 text-sm text-slate-300">الجلسة التالية: {formatDateTime(session.nextSessionDate)}</p> : null}
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title="لا توجد جلسات مسجلة" description="تحديثات الجلسات ستظهر هنا عند إضافتها من المكتب." icon="event_note" />
              )}
          </ClientPortalPanel>

          <ClientPortalPanel title="المواعيد">
              {legalCase.appointments.length ? (
                <div className="space-y-3">
                  {legalCase.appointments.map((appointment) => (
                    <ClientPortalRow key={appointment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{appointment.title}</p>
                        <Badge tone="pending">{labelFrom(appointmentStatusLabels, appointment.status)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDateTime(appointment.startsAt)} - {labelFrom(appointmentTypeLabels, appointment.type)} - {labelFrom(modeLabels, appointment.mode)}
                      </p>
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title="لا توجد مواعيد" description="أي موعد مرتبط بالقضية سيظهر هنا." icon="event" />
              )}
          </ClientPortalPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel title="المستندات المرئية">
              {legalCase.documents.length ? (
                <div className="space-y-3">
                  {legalCase.documents.map((document) => (
                    <a key={document.id} className="block" href={`/api/files/${document.id}/download`}>
                      <ClientPortalRow>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-kmt-navy">{document.fileName}</p>
                          <Badge tone="neutral">{labelFrom(documentStatusLabels, document.status)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{formatBytes(document.fileSize)}</p>
                      </ClientPortalRow>
                    </a>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title="لا توجد مستندات مرئية" description="المكتب يحدد المستندات التي تظهر لك داخل البوابة." icon="folder_open" />
              )}
          </ClientPortalPanel>

          <ClientPortalPanel title="المدفوعات">
              {legalCase.payments.length ? (
                <div className="space-y-3">
                  {legalCase.payments.map((payment) => (
                    <ClientPortalRow key={payment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{payment.invoiceNumber}</p>
                        <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>{labelFrom(paymentStatusLabels, payment.status)}</Badge>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">{formatMoney(payment.amount.toString(), payment.currency)}</p>
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title="لا توجد مدفوعات" description="أي فاتورة مرتبطة بالقضية ستظهر هنا." icon="payments" />
              )}
          </ClientPortalPanel>
        </div>
      </div>
    </ClientSiteShell>
  );
}
