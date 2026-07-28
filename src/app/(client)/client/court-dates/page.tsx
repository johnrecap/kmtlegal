import Link from "next/link";
import { ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalAppointments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale, type ClientContent, type ClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("appointmentsTitle");
}

type AppointmentRow = Awaited<ReturnType<typeof listPortalAppointments>>[number];

function isPendingOfficeReview(row: AppointmentRow) {
  return row.type === "CONSULTATION" && Boolean(row.consultationRequest) && !row.consultationRequest?.assignedLawyerId;
}

function appointmentDisplayStatus(row: AppointmentRow, copy: ClientContent) {
  return isPendingOfficeReview(row)
    ? copy.common.pendingOfficeReview
    : copy.statuses.appointment[row.status as keyof typeof copy.statuses.appointment] ?? copy.common.unknown;
}

function appointmentStatusTone(row: AppointmentRow) {
  if (isPendingOfficeReview(row)) {
    return "neutral" as const;
  }
  return row.status === "COMPLETED" ? ("active" as const) : ("pending" as const);
}

function appointmentColumns(copy: ClientContent, locale: ClientLocale): Array<DataTableColumn<AppointmentRow>> {
  return [
  {
    key: "appointment",
    header: copy.appointments.appointment,
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.title}</p>
        <p className="mt-1 text-xs text-kmt-muted">{copy.statuses.appointmentType[row.type as keyof typeof copy.statuses.appointmentType] ?? copy.common.unknown}</p>
      </div>
    )
  },
  {
    key: "case",
    header: copy.common.case,
    render: (row) =>
      row.case ? (
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        copy.common.consultation
      )
  },
  { key: "time", header: copy.common.time, render: (row) => formatDateTime(row.startsAt, locale) },
  { key: "mode", header: copy.common.mode, render: (row) => copy.statuses.mode[row.mode as keyof typeof copy.statuses.mode] ?? copy.common.unknown },
  { key: "lawyer", header: copy.common.lawyer, render: (row) => row.lawyer?.name ?? (isPendingOfficeReview(row) ? copy.common.pendingAssignment : copy.common.unknown) },
  { key: "status", header: copy.common.status, render: (row) => <Badge tone={appointmentStatusTone(row)}>{appointmentDisplayStatus(row, copy)}</Badge> }
  ];
}

function MobileCard({ row, copy, locale }: { row: AppointmentRow; copy: ClientContent; locale: ClientLocale }) {
  return (
    <DataRecordCard
      className={clientPortalRowClass}
      title={row.title}
      description={copy.statuses.appointmentType[row.type as keyof typeof copy.statuses.appointmentType] ?? copy.common.unknown}
      badges={<Badge tone={appointmentStatusTone(row)}>{appointmentDisplayStatus(row, copy)}</Badge>}
      fields={[
        {
          label: copy.common.case,
          value: row.case ? (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
              {row.case.internalFileNumber}
            </Link>
          ) : (
            copy.common.consultation
          )
        },
        { label: copy.common.time, value: formatDateTime(row.startsAt, locale) },
        { label: copy.common.mode, value: copy.statuses.mode[row.mode as keyof typeof copy.statuses.mode] ?? copy.common.unknown },
        { label: copy.common.lawyer, value: row.lawyer?.name ?? (isPendingOfficeReview(row) ? copy.common.pendingAssignment : copy.common.unknown) }
      ]}
      action={
        row.case ? (
          <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.case.id}`}>
            {copy.common.openCase}
          </Link>
        ) : null
      }
    />
  );
}

export default async function ClientCourtDatesPage() {
  const guard = await requirePortalPage("/client/court-dates");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const appointments = await listPortalAppointments(guard.context.principal);

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/court-dates", locale)} title={copy.appointments.title} userLabel={guard.context.user.name}>
      <DataTable
        className={clientPortalTableClass}
        columns={appointmentColumns(copy, locale)}
        empty={copy.appointments.empty}
        emptyClassName="client-portal-table-empty"
        mobileRender={(row) => <MobileCard copy={copy} locale={locale} row={row} />}
        rows={appointments}
      />
    </ClientSiteShell>
  );
}
