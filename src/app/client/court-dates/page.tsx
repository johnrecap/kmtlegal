import type { Metadata } from "next";
import Link from "next/link";
import { ClientSiteShell } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { appointmentStatusLabels, appointmentTypeLabels, formatDateTime, labelFrom, modeLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalAppointments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مواعيدي | KMT Legal"
};

type AppointmentRow = Awaited<ReturnType<typeof listPortalAppointments>>[number];

const columns: Array<DataTableColumn<AppointmentRow>> = [
  {
    key: "appointment",
    header: "الموعد",
    render: (row) => (
      <div>
        <p className="font-semibold text-kmt-ink">{row.title}</p>
        <p className="mt-1 text-xs text-kmt-muted">{labelFrom(appointmentTypeLabels, row.type)}</p>
      </div>
    )
  },
  {
    key: "case",
    header: "القضية",
    render: (row) =>
      row.case ? (
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        "استشارة"
      )
  },
  { key: "time", header: "الوقت", render: (row) => formatDateTime(row.startsAt) },
  { key: "mode", header: "الطريقة", render: (row) => labelFrom(modeLabels, row.mode) },
  { key: "lawyer", header: "المحامي", render: (row) => row.lawyer?.name ?? "غير محدد" },
  { key: "status", header: "الحالة", render: (row) => <Badge tone={row.status === "COMPLETED" ? "active" : "pending"}>{labelFrom(appointmentStatusLabels, row.status)}</Badge> }
];

function MobileCard({ row }: { row: AppointmentRow }) {
  return (
    <DataRecordCard
      title={row.title}
      description={labelFrom(appointmentTypeLabels, row.type)}
      badges={<Badge tone={row.status === "COMPLETED" ? "active" : "pending"}>{labelFrom(appointmentStatusLabels, row.status)}</Badge>}
      fields={[
        {
          label: "القضية",
          value: row.case ? (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.case.id}`}>
              {row.case.internalFileNumber}
            </Link>
          ) : (
            "استشارة"
          )
        },
        { label: "الوقت", value: formatDateTime(row.startsAt) },
        { label: "الطريقة", value: labelFrom(modeLabels, row.mode) },
        { label: "المحامي", value: row.lawyer?.name ?? "غير محدد" }
      ]}
      action={
        row.case ? (
          <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/client/cases/${row.case.id}`}>
            فتح القضية
          </Link>
        ) : null
      }
    />
  );
}

export default async function ClientCourtDatesPage() {
  const guard = await requirePortalPage("/client/court-dates");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const appointments = await listPortalAppointments(guard.context.principal);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/court-dates")} title="مواعيد القضايا والاستشارات" userLabel={guard.context.user.name}>
      <DataTable columns={columns} rows={appointments} empty="لا توجد مواعيد مرتبطة بحسابك حتى الآن." mobileRender={(row) => <MobileCard row={row} />} />
    </ClientSiteShell>
  );
}
