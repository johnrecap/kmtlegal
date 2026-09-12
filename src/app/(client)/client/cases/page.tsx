import Link from "next/link";
import { kmtTokens } from "@/lib/design-system/tokens";
import { ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalCases } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale, type ClientContent, type ClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("casesTitle");
}

type CaseRow = Awaited<ReturnType<typeof listPortalCases>>[number];

function caseColumns(copy: ClientContent, locale: ClientLocale): Array<DataTableColumn<CaseRow>> {
  return [
  {
    key: "case",
    header: copy.common.case,
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/client/cases/${row.id}`}>
          {row.title}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted">{row.internalFileNumber}</p>
      </div>
    )
  },
  { key: "status", header: copy.common.status, render: (row) => <Badge style={row.status === "ACTIVE" ? undefined : { color: kmtTokens.color.muted }} tone={row.status === "ACTIVE" ? "active" : "neutral"}>{copy.statuses.case[row.status as keyof typeof copy.statuses.case] ?? copy.common.unknown}</Badge> },
  {
    key: "priority",
    header: copy.common.priority,
    render: (row) => <Badge style={row.priority === "URGENT" || row.priority === "HIGH" ? undefined : { color: kmtTokens.color.muted }} tone={row.priority === "URGENT" || row.priority === "HIGH" ? "pending" : "neutral"}>{copy.statuses.priority[row.priority as keyof typeof copy.statuses.priority] ?? copy.common.unknown}</Badge>
  },
  { key: "lawyer", header: copy.common.lawyer, render: (row) => row.assignedLawyer.name },
  { key: "next", header: copy.common.nextDate, render: (row) => formatDateTime(row.nextSessionAt, locale) }
  ];
}

function MobileCard({ row, copy, locale }: { row: CaseRow; copy: ClientContent; locale: ClientLocale }) {
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
          <Badge style={row.status === "ACTIVE" ? undefined : { color: kmtTokens.color.muted }} tone={row.status === "ACTIVE" ? "active" : "neutral"}>{copy.statuses.case[row.status as keyof typeof copy.statuses.case] ?? copy.common.unknown}</Badge>
          <Badge style={row.priority === "URGENT" || row.priority === "HIGH" ? undefined : { color: kmtTokens.color.muted }} tone={row.priority === "URGENT" || row.priority === "HIGH" ? "pending" : "neutral"}>{copy.statuses.priority[row.priority as keyof typeof copy.statuses.priority] ?? copy.common.unknown}</Badge>
        </>
      }
      fields={[
        { label: copy.common.lawyer, value: row.assignedLawyer.name },
        { label: copy.common.nextDate, value: formatDateTime(row.nextSessionAt, locale) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/client/cases/${row.id}`}>
          {copy.common.open}
        </Link>
      }
    />
  );
}

export default async function ClientCasesPage() {
  const guard = await requirePortalPage("/client/cases");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const cases = await listPortalCases(guard.context.principal);

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/cases", locale)} title={copy.cases.title} userLabel={guard.context.user.name}>
      <DataTable
        className={clientPortalTableClass}
        columns={caseColumns(copy, locale)}
        empty={copy.cases.empty}
        emptyClassName="client-portal-table-empty"
        mobileRender={(row) => <MobileCard copy={copy} locale={locale} row={row} />}
        rows={cases}
      />
    </ClientSiteShell>
  );
}
