import { kmtTokens } from "@/lib/design-system/tokens";
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
  formatBytes,
  formatDateTime,
  formatMoney
} from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalCaseDetail } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../../client-navigation";
import { getClientContent, normalizeClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("caseDetailTitle");
}

type PageProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export default async function ClientCaseDetailPage({ params }: PageProps) {
  const { caseId } = await params;
  const guard = await requirePortalPage(`/client/cases/${caseId}`);
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const legalCase = await getPortalCaseDetail(guard.context.principal, caseId);

  return (
    <ClientSiteShell
      locale={locale}
      navItems={clientNavForPath("/client/cases", locale)}
      title={legalCase.title}
      userLabel={guard.context.user.name}
      action={
        <ButtonLink className={clientPortalSecondaryActionClass} href="/client/cases" size="sm" variant="secondary">
          {copy.common.back}
        </ButtonLink>
      }
    >
      <div className="space-y-5">
        <ClientPortalPanel
          action={
            <div className="flex flex-wrap gap-2">
              <Badge style={legalCase.status === "ACTIVE" ? undefined : { color: kmtTokens.color.muted }} tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>{copy.statuses.case[legalCase.status as keyof typeof copy.statuses.case] ?? copy.common.unknown}</Badge>
              <Badge style={legalCase.priority === "URGENT" || legalCase.priority === "HIGH" ? undefined : { color: kmtTokens.color.muted }} tone={legalCase.priority === "URGENT" || legalCase.priority === "HIGH" ? "pending" : "neutral"}>{copy.statuses.priority[legalCase.priority as keyof typeof copy.statuses.priority] ?? copy.common.unknown}</Badge>
            </div>
          }
          description={legalCase.caseType}
          title={legalCase.internalFileNumber}
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ClientPortalDetailItem label={copy.cases.detailsResponsibleLawyer} value={legalCase.assignedLawyer.name} />
              <ClientPortalDetailItem label={copy.cases.professionalEmail} value={legalCase.assignedLawyer.email} />
              <ClientPortalDetailItem label={copy.common.nextDate} value={formatDateTime(legalCase.nextSessionAt, locale)} />
              <ClientPortalDetailItem label={copy.cases.fileCreated} value={formatDateTime(legalCase.createdAt, locale)} />
            </div>
            {legalCase.summary ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-100">{legalCase.summary}</p> : null}
        </ClientPortalPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel title={copy.cases.sessions}>
              {legalCase.sessions.length ? (
                <div className="space-y-3">
                  {legalCase.sessions.map((session) => (
                    <ClientPortalRow key={session.id}>
                      <p className="font-semibold text-white">{session.courtName || copy.cases.followUpSession}</p>
                      <p className="mt-1 text-sm text-slate-300">{formatDateTime(session.sessionDate, locale)}</p>
                      {session.decision ? <p className="mt-2 text-sm leading-6 text-slate-100">{session.decision}</p> : null}
                      {session.nextSessionDate ? <p className="mt-2 text-sm text-slate-300">{copy.common.nextSession}: {formatDateTime(session.nextSessionDate, locale)}</p> : null}
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title={copy.cases.noSessions} description={copy.cases.noSessionsDescription} icon="event_note" />
              )}
          </ClientPortalPanel>

          <ClientPortalPanel title={copy.cases.appointments}>
              {legalCase.appointments.length ? (
                <div className="space-y-3">
                  {legalCase.appointments.map((appointment) => (
                    <ClientPortalRow key={appointment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{appointment.title}</p>
                        <Badge tone="pending">{copy.statuses.appointment[appointment.status as keyof typeof copy.statuses.appointment] ?? copy.common.unknown}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDateTime(appointment.startsAt, locale)} - {copy.statuses.appointmentType[appointment.type as keyof typeof copy.statuses.appointmentType] ?? copy.common.unknown} - {copy.statuses.mode[appointment.mode as keyof typeof copy.statuses.mode] ?? copy.common.unknown}
                      </p>
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title={copy.cases.noAppointments} description={copy.cases.noAppointmentsDescription} icon="event" />
              )}
          </ClientPortalPanel>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel title={copy.cases.visibleDocuments}>
              {legalCase.documents.length ? (
                <div className="space-y-3">
                  {legalCase.documents.map((document) => (
                    <a key={document.id} className="block" href={`/api/files/${document.id}/download`}>
                      <ClientPortalRow>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-kmt-navy">{document.fileName}</p>
                          <Badge tone="neutral">{copy.statuses.document[document.status as keyof typeof copy.statuses.document] ?? copy.common.unknown}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{formatBytes(document.fileSize)}</p>
                      </ClientPortalRow>
                    </a>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title={copy.cases.noDocuments} description={copy.cases.noDocumentsDescription} icon="folder_open" />
              )}
          </ClientPortalPanel>

          <ClientPortalPanel title={copy.cases.payments}>
              {legalCase.payments.length ? (
                <div className="space-y-3">
                  {legalCase.payments.map((payment) => (
                    <ClientPortalRow key={payment.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{payment.invoiceNumber}</p>
                        <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>{copy.statuses.payment[payment.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}</Badge>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">{formatMoney(payment.amount.toString(), payment.currency, locale)}</p>
                    </ClientPortalRow>
                  ))}
                </div>
              ) : (
                <ClientPortalEmpty title={copy.cases.noPayments} description={copy.cases.noPaymentsDescription} icon="payments" />
              )}
          </ClientPortalPanel>
        </div>
      </div>
    </ClientSiteShell>
  );
}
