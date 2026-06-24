import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { Badge, DataTable, type DataTableColumn } from "@/components/ui";
import { appointmentStatusLabels, appointmentTypeLabels, formatDateTime, labelFrom, modeLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalAppointments } from "@/server/portal/client-portal-service";
import { portalNavForPath } from "../portal-navigation";

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
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/portal/cases/${row.case.id}`}>
          {row.case.internalFileNumber}
        </Link>
      ) : (
        "بدون قضية"
      )
  },
  {
    key: "time",
    header: "الوقت",
    render: (row) => formatDateTime(row.startsAt)
  },
  {
    key: "mode",
    header: "الطريقة",
    render: (row) => labelFrom(modeLabels, row.mode)
  },
  {
    key: "lawyer",
    header: "المحامي",
    render: (row) => row.lawyer?.name ?? "غير محدد"
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={row.status === "COMPLETED" ? "active" : "pending"}>{labelFrom(appointmentStatusLabels, row.status)}</Badge>
  }
];

export default async function PortalAppointmentsPage() {
  const guard = await requirePortalPage("/portal/appointments");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const appointments = await listPortalAppointments(guard.context.principal);

  return (
    <DashboardShell
      eyebrow="بوابة العميل"
      mode="portal"
      navItems={portalNavForPath("/portal/appointments")}
      title="مواعيدي"
      userLabel={guard.context.user.name}
    >
      <DataTable columns={columns} rows={appointments} empty="لا توجد مواعيد مرتبطة بحسابك حتى الآن." />
    </DashboardShell>
  );
}
