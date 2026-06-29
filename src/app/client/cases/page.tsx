import type { Metadata } from "next";
import Link from "next/link";
import { ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { caseStatusLabels, formatDateTime, labelFrom, priorityLabels } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalCases } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قضاياي | KMT Legal"
};

type CaseRow = Awaited<ReturnType<typeof listPortalCases>>[number];

const columns: Array<DataTableColumn<CaseRow>> = [
  {
    key: "case",
    header: "القضية",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.id}`}>
          {row.title}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.internalFileNumber}</p>
      </div>
    )
  },
  { key: "status", header: "الحالة", render: (row) => <Badge tone={row.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, row.status)}</Badge> },
  {
    key: "priority",
    header: "الأولوية",
    render: (row) => <Badge tone={row.priority === "URGENT" || row.priority === "HIGH" ? "pending" : "neutral"}>{labelFrom(priorityLabels, row.priority)}</Badge>
  },
  { key: "lawyer", header: "المحامي", render: (row) => row.assignedLawyer.name },
  { key: "next", header: "الموعد التالي", render: (row) => formatDateTime(row.nextSessionAt) }
];

function MobileCard({ row }: { row: CaseRow }) {
  return (
    <DataRecordCard
      className={clientPortalRowClass}
      title={
        <Link className="text-kmt-navy hover:underline" href={`/client/cases/${row.id}`}>
          {row.title}
        </Link>
      }
      description={row.internalFileNumber}
      badges={
        <>
          <Badge tone={row.status === "ACTIVE" ? "active" : "neutral"}>{labelFrom(caseStatusLabels, row.status)}</Badge>
          <Badge tone={row.priority === "URGENT" || row.priority === "HIGH" ? "pending" : "neutral"}>{labelFrom(priorityLabels, row.priority)}</Badge>
        </>
      }
      fields={[
        { label: "المحامي", value: row.assignedLawyer.name },
        { label: "الموعد التالي", value: formatDateTime(row.nextSessionAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.id}`}>
          فتح
        </Link>
      }
    />
  );
}

export default async function ClientCasesPage() {
  const guard = await requirePortalPage("/client/cases");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const cases = await listPortalCases(guard.context.principal);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/cases")} title="قضاياي" userLabel={guard.context.user.name}>
      <DataTable
        className={clientPortalTableClass}
        columns={columns}
        empty="لا توجد قضايا مرتبطة بحسابك حتى الآن."
        emptyClassName="client-portal-table-empty"
        mobileRender={(row) => <MobileCard row={row} />}
        rows={cases}
      />
    </ClientSiteShell>
  );
}
