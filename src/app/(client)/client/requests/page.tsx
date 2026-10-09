import { ClientPortalPanel, ClientSiteShell } from "@/components/layout";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { normalizeClientLocale } from "@/content/client-content";
import { conversationCopy } from "@/content/conversation-copy";
import { listOwnConsultationRequests } from "@/server/portal/client-requests-service";
import { publicConsultationReference } from "@/server/consultations/consultation-service";
import { formatDateTime } from "@/lib/legal-format";
import { clientNavForPath } from "../client-navigation";
import Link from "next/link";
import { listServiceRequests, publishedQuestionnaire } from "@/server/services/service-request-service";
import { NewServiceRequest } from "@/features/portal/service-request-workspace";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { prisma } from "@/server/db/prisma";
import { RequestAlternativeTime } from "@/features/portal/request-alternative-time";
import { directBookingCopy } from "@/content/direct-booking-copy";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function ClientRequestsPage() {
  const guard = await requirePortalPage("/client/requests");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = conversationCopy[locale];
  const direct = directBookingCopy[locale];
  if (guard.status === "forbidden") return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  const requests = await listOwnConsultationRequests(guard.context.principal);
  const [services, questionnaire, user] = await Promise.all([listServiceRequests(guard.context.principal), publishedQuestionnaire(), prisma.user.findUnique({ where: { id: guard.context.principal.id }, select: { emailVerifiedAt: true } })]);
  const serviceCopy = serviceRequestCopy[locale];
  return <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/requests", locale)} title={copy.requests} userLabel={guard.context.user.name}>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <NewServiceRequest locale={locale} verified={Boolean(user?.emailVerifiedAt)} healthAvailable={Boolean(questionnaire)} />
      {services.map(service => <ClientPortalPanel key={service.id} title={serviceCopy.kinds[service.kind as keyof typeof serviceCopy.kinds]} description={serviceCopy.statuses[service.status as keyof typeof serviceCopy.statuses]}><Link className="break-all underline" href={`/client/requests/services/${service.id}`}>{service.reference}</Link></ClientPortalPanel>)}
      {!requests.length && <p>{copy.emptyRequests}</p>}
      {requests.map(request => <ClientPortalPanel key={request.id} title={request.publicReference ?? publicConsultationReference(request.id)} description={request.outcomeStatus === "CANCELLED" ? direct.cancelled : copy.statuses[request.status]}>
        <dl className="space-y-3 text-sm"><div><dt>{copy.requested}</dt><dd>{request.requestedStartsAt ? formatDateTime(request.requestedStartsAt, locale) : copy.noTime}</dd></div>
          <div><dt>{copy.confirmed}</dt><dd>{request.appointments.length ? request.appointments.map(appointment => formatDateTime(appointment.startsAt, locale)).join(" · ") : copy.noConfirmation}</dd></div>
          {request.confirmationSource !== "STAFF_APPROVAL" && <div><dt>{direct.channel}</dt><dd>{request.contactChannel === "WHATSAPP" ? direct.whatsapp : direct.phone}</dd></div>}
        </dl><p className="mt-4 text-sm">{request.confirmationSource === "STAFF_APPROVAL" ? copy.nextStep : request.outcomeStatus === "CANCELLED" ? direct.cancelled : request.appointments.length ? direct.confirmed : direct.callbackDone}</p>
        {request.publicReference && ["NEW", "REVIEWING"].includes(request.status) && <RequestAlternativeTime id={request.id} mode={request.preferredMode} version={request.outcomeVersion} locale={locale} />}
      </ClientPortalPanel>)}
    </div>
  </ClientSiteShell>;
}
