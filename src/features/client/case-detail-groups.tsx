import {
  ClientPortalEmpty,
  ClientPortalRow
} from "@/components/layout";
import { Badge } from "@/components/ui";
import {
  formatBytes,
  formatDateTime,
  formatMoney
} from "@/lib/legal-format";
import { getPortalCaseDetail } from "@/server/portal/client-portal-service";
import type { ClientContent, ClientLocale } from "@/content/client-content";

export type CaseDetail = Awaited<ReturnType<typeof getPortalCaseDetail>>;

export type CaseDetailGroupProps = {
  copy: ClientContent;
  locale: ClientLocale;
  legalCase: CaseDetail;
};

export function SessionsGroup({ copy, locale, legalCase }: CaseDetailGroupProps) {
  if (!legalCase.sessions.length) {
    return <ClientPortalEmpty title={copy.cases.noSessions} description={copy.cases.noSessionsDescription} icon="event_note" />;
  }

  return (
    <div className="space-y-3">
      {legalCase.sessions.map((session) => (
        <ClientPortalRow key={session.id}>
          <p className="font-semibold text-[var(--kmt-client-text)]">{session.courtName || copy.cases.followUpSession}</p>
          <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">{formatDateTime(session.sessionDate, locale)}</p>
          {session.decision ? <p className="mt-2 text-sm leading-6 text-[var(--kmt-client-muted)]">{session.decision}</p> : null}
          {session.nextSessionDate ? <p className="mt-2 text-sm text-[var(--kmt-client-muted)]">{copy.common.nextSession}: {formatDateTime(session.nextSessionDate, locale)}</p> : null}
        </ClientPortalRow>
      ))}
    </div>
  );
}

export function CaseAppointmentsGroup({ copy, locale, legalCase }: CaseDetailGroupProps) {
  if (!legalCase.appointments.length) {
    return <ClientPortalEmpty title={copy.cases.noAppointments} description={copy.cases.noAppointmentsDescription} icon="event" />;
  }

  return (
    <div className="space-y-3">
      {legalCase.appointments.map((appointment) => (
        <ClientPortalRow key={appointment.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-[var(--kmt-client-text)]">{appointment.title}</p>
            <Badge tone="pending">{copy.statuses.appointment[appointment.status as keyof typeof copy.statuses.appointment] ?? copy.common.unknown}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">
            {formatDateTime(appointment.startsAt, locale)} - {copy.statuses.appointmentType[appointment.type as keyof typeof copy.statuses.appointmentType] ?? copy.common.unknown} - {copy.statuses.mode[appointment.mode as keyof typeof copy.statuses.mode] ?? copy.common.unknown}
          </p>
        </ClientPortalRow>
      ))}
    </div>
  );
}

export function CaseDocumentsGroup({ copy, locale, legalCase }: CaseDetailGroupProps) {
  if (!legalCase.documents.length) {
    return <ClientPortalEmpty title={copy.cases.noDocuments} description={copy.cases.noDocumentsDescription} icon="folder_open" />;
  }

  return (
    <div className="space-y-3">
      {legalCase.documents.map((document) => (
        <a key={document.id} className="block" href={`/api/files/${document.id}/download`}>
          <ClientPortalRow>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-kmt-navy">{document.fileName}</p>
              <Badge tone="neutral">{copy.statuses.document[document.status as keyof typeof copy.statuses.document] ?? copy.common.unknown}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">{formatBytes(document.fileSize)}</p>
          </ClientPortalRow>
        </a>
      ))}
    </div>
  );
}

export function CasePaymentsGroup({ copy, locale, legalCase }: CaseDetailGroupProps) {
  if (!legalCase.payments.length) {
    return <ClientPortalEmpty title={copy.cases.noPayments} description={copy.cases.noPaymentsDescription} icon="payments" />;
  }

  return (
    <div className="space-y-3">
      {legalCase.payments.map((payment) => (
        <ClientPortalRow key={payment.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-[var(--kmt-client-text)]">{payment.invoiceNumber}</p>
            <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>{copy.statuses.payment[payment.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}</Badge>
          </div>
          <p className="mt-2 text-lg font-semibold text-[var(--kmt-client-text)]">{formatMoney(payment.amount.toString(), payment.currency, locale)}</p>
        </ClientPortalRow>
      ))}
    </div>
  );
}
