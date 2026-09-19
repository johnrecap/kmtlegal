import { kmtTokens } from "@/lib/design-system/tokens";
import {
  ClientPortalDetailItem,
  ClientPortalPanel,
  ClientSiteShell,
  clientPortalSecondaryActionClass
} from "@/components/layout";
import { Badge, ButtonLink } from "@/components/ui";
import { ClientMobileAccordion } from "@/features/client/client-mobile-accordion";
import {
  CaseAppointmentsGroup,
  CaseDocumentsGroup,
  CasePaymentsGroup,
  SessionsGroup
} from "@/features/client/case-detail-groups";
import { formatDateTime } from "@/lib/legal-format";
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
            {legalCase.summary ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[var(--kmt-client-muted)]">{legalCase.summary}</p> : null}
        </ClientPortalPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel className="hidden lg:block" title={copy.cases.sessions}>
            <SessionsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientPortalPanel>
          <ClientMobileAccordion testId="case-detail-sessions-accordion" title={copy.cases.sessions} value="sessions">
            <SessionsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientMobileAccordion>

          <ClientPortalPanel className="hidden lg:block" title={copy.cases.appointments}>
            <CaseAppointmentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientPortalPanel>
          <ClientMobileAccordion testId="case-detail-appointments-accordion" title={copy.cases.appointments} value="appointments">
            <CaseAppointmentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientMobileAccordion>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel className="hidden lg:block" title={copy.cases.visibleDocuments}>
            <CaseDocumentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientPortalPanel>
          <ClientMobileAccordion testId="case-detail-documents-accordion" title={copy.cases.visibleDocuments} value="documents">
            <CaseDocumentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientMobileAccordion>

          <ClientPortalPanel className="hidden lg:block" title={copy.cases.payments}>
            <CasePaymentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientPortalPanel>
          <ClientMobileAccordion testId="case-detail-payments-accordion" title={copy.cases.payments} value="payments">
            <CasePaymentsGroup copy={copy} legalCase={legalCase} locale={locale} />
          </ClientMobileAccordion>
        </div>
      </div>
    </ClientSiteShell>
  );
}
