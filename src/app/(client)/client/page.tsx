import Link from "next/link";
import {
  ClientPortalEmpty,
  ClientPortalMetric,
  ClientPortalPanel,
  ClientPortalRow,
  ClientSiteShell,
  clientPortalSecondaryActionClass
} from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalDashboard } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "./client-navigation";
import {
  getClientContent,
  interpolateClientCopy,
  normalizeClientLocale,
  type ClientContent,
  type ClientLocale
} from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("homeTitle");
}

type DashboardAppointment = Awaited<ReturnType<typeof getPortalDashboard>>["appointments"][number];
type PortalDashboard = Awaited<ReturnType<typeof getPortalDashboard>>;

function formatDueBalances(dashboard: PortalDashboard, locale: ClientLocale) {
  if (!dashboard.dueBalances.length) {
    return formatMoney(0, "EGP", locale);
  }

  return dashboard.dueBalances
    .map((balance) => formatMoney(balance.amount.toString(), balance.currency, locale))
    .join(" · ");
}

function dashboardAppointmentStatus(
  appointment: DashboardAppointment,
  copy: ClientContent
) {
  const pendingReview = appointment.type === "CONSULTATION" && Boolean(appointment.consultationRequest) && !appointment.consultationRequest?.assignedLawyerId;
  return pendingReview
    ? copy.common.pendingOfficeReview
    : copy.statuses.appointment[appointment.status as keyof typeof copy.statuses.appointment] ?? copy.common.unknown;
}

function dashboardAppointmentTone(appointment: DashboardAppointment) {
  const pendingReview = appointment.type === "CONSULTATION" && Boolean(appointment.consultationRequest) && !appointment.consultationRequest?.assignedLawyerId;
  return pendingReview ? ("neutral" as const) : ("pending" as const);
}

function nextPortalStep(
  dashboard: PortalDashboard,
  copy: ClientContent,
  locale: ClientLocale
) {
  const duePayment = dashboard.nextDuePayment;
  if (duePayment) {
    return {
      icon: "payments",
      title: copy.dashboard.dueTitle,
      description: `${duePayment.invoiceNumber} · ${formatMoney(duePayment.amount.toString(), duePayment.currency, locale)}`,
      href: "/client/payments",
      action: copy.dashboard.dueAction
    };
  }

  const appointment = dashboard.appointments[0];
  if (appointment) {
    return {
      icon: "event",
      title: copy.dashboard.appointmentTitle,
      description: `${appointment.title} · ${formatDateTime(appointment.startsAt, locale)}`,
      href: "/client/court-dates",
      action: copy.dashboard.appointmentAction
    };
  }

  if (dashboard.documentsCount === 0) {
    return {
      icon: "folder",
      title: copy.dashboard.documentsTitle,
      description: copy.dashboard.documentsDescription,
      href: "/client/files",
      action: copy.dashboard.documentsAction
    };
  }

  return {
    icon: "forum",
    title: copy.dashboard.followTitle,
    description: copy.dashboard.followDescription,
    href: "/client/assistant",
    action: copy.dashboard.followAction
  };
}

export default async function ClientHomePage() {
  const guard = await requirePortalPage("/client");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const dashboard = await getPortalDashboard(guard.context.principal);
  const nextStep = nextPortalStep(dashboard, copy, locale);
  const dueBalanceLabel = formatDueBalances(dashboard, locale);

  return (
    <ClientSiteShell
      locale={locale}
      navItems={clientNavForPath("/client", locale)}
      title={interpolateClientCopy(copy.dashboard.welcome, { name: dashboard.client.fullName })}
      userLabel={guard.context.user.name}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <ClientPortalMetric icon="gavel" label={copy.dashboard.cases} value={String(dashboard.casesCount)} meta={copy.dashboard.casesMeta} />
          <ClientPortalMetric icon="event" label={copy.dashboard.upcoming} value={String(dashboard.appointmentsCount)} meta={copy.dashboard.upcomingMeta} />
          <ClientPortalMetric icon="folder" label={copy.dashboard.files} value={String(dashboard.documentsCount)} meta={copy.dashboard.filesMeta} />
          <ClientPortalMetric icon="payments" label={copy.dashboard.dues} tone={dashboard.dueBalances.length ? "due" : "default"} value={dueBalanceLabel} meta={copy.dashboard.duesMeta} />
        </div>

        <ClientPortalPanel
          action={
            <ButtonLink className={clientPortalSecondaryActionClass} href={nextStep.href} size="sm" variant="secondary">
              {nextStep.action}
            </ButtonLink>
          }
          description={nextStep.description}
          title={copy.dashboard.nextStep}
        >
          <ClientPortalRow>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kmt-gold/35 bg-kmt-gold/10 text-[var(--kmt-client-gold)]" aria-hidden="true">
                <MaterialSymbol name={nextStep.icon} />
              </span>
              <div>
                <p className="font-semibold text-[var(--kmt-client-text)]">{nextStep.title}</p>
                <p className="mt-1 text-sm leading-7 text-[var(--kmt-client-muted)]">{nextStep.description}</p>
              </div>
            </div>
          </ClientPortalRow>
        </ClientPortalPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <ClientPortalPanel
            action={
              <ButtonLink className={clientPortalSecondaryActionClass} href="/client/cases" size="sm" variant="secondary">
                {copy.dashboard.allCases}
              </ButtonLink>
            }
            title={copy.dashboard.cases}
          >
            {dashboard.cases.length ? (
              <div className="space-y-3">
                {dashboard.cases.map((legalCase) => (
                  <Link key={legalCase.id} className="block" href={`/client/cases/${legalCase.id}`}>
                    <ClientPortalRow>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--kmt-client-text)]">{legalCase.title}</p>
                        <Badge tone={legalCase.status === "ACTIVE" ? "active" : "neutral"}>
                          {copy.statuses.case[legalCase.status as keyof typeof copy.statuses.case] ?? copy.common.unknown}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">{legalCase.internalFileNumber}</p>
                    </ClientPortalRow>
                  </Link>
                ))}
              </div>
            ) : (
              <ClientPortalEmpty title={copy.dashboard.noCases} description={copy.dashboard.noCasesDescription} icon="gavel" />
            )}
          </ClientPortalPanel>

          <ClientPortalPanel
            action={
              <ButtonLink className={clientPortalSecondaryActionClass} href="/client/court-dates" size="sm" variant="secondary">
                {copy.dashboard.allAppointments}
              </ButtonLink>
            }
            title={copy.dashboard.appointments}
          >
            {dashboard.appointments.length ? (
              <div className="space-y-3">
                {dashboard.appointments.map((appointment) => (
                  <ClientPortalRow key={appointment.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--kmt-client-text)]">{appointment.title}</p>
                      <Badge tone={dashboardAppointmentTone(appointment)}>{dashboardAppointmentStatus(appointment, copy)}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--kmt-client-muted)]">{formatDateTime(appointment.startsAt, locale)}</p>
                  </ClientPortalRow>
                ))}
              </div>
            ) : (
              <ClientPortalEmpty title={copy.dashboard.noAppointments} description={copy.dashboard.noAppointmentsDescription} icon="event" />
            )}
          </ClientPortalPanel>
        </div>

        <ClientPortalPanel
          action={
            <ButtonLink className={clientPortalSecondaryActionClass} href="/client/payments" size="sm" variant="secondary">
              {copy.dashboard.allPayments}
            </ButtonLink>
          }
          title={copy.dashboard.payments}
        >
          {dashboard.payments.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.payments.map((payment) => (
                <ClientPortalRow key={payment.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--kmt-client-text)]">{payment.invoiceNumber}</p>
                    <Badge tone={payment.status === "PAID" ? "active" : payment.status === "CANCELLED" ? "closed" : "pending"}>
                      {copy.statuses.payment[payment.status as keyof typeof copy.statuses.payment] ?? copy.common.unknown}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-[var(--kmt-client-text)]">{formatMoney(payment.amount.toString(), payment.currency, locale)}</p>
                </ClientPortalRow>
              ))}
            </div>
          ) : (
            <ClientPortalEmpty title={copy.dashboard.noPayments} description={copy.dashboard.noPaymentsDescription} icon="payments" />
          )}
        </ClientPortalPanel>
      </div>
    </ClientSiteShell>
  );
}
