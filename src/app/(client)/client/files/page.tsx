import { ClientPortalPanel, ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { DocumentUploadForm } from "@/features/portal/document-upload-form";
import { formatBytes, formatDateTime } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalCases, listPortalDocuments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";
import { getClientContent, normalizeClientLocale, type ClientContent, type ClientLocale } from "@/content/client-content";
import { clientPageMetadata } from "@/server/auth/client-page-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return clientPageMetadata("filesTitle");
}

type DocumentRow = Awaited<ReturnType<typeof listPortalDocuments>>[number];

function documentColumns(copy: ClientContent, locale: ClientLocale): Array<DataTableColumn<DocumentRow>> {
  return [
  {
    key: "file",
    header: copy.files.file,
    render: (row) => (
      <div>
        <a className="font-semibold text-kmt-navy hover:underline" href={`/api/files/${row.id}/download`}>
          {row.fileName}
        </a>
        <p className="mt-1 text-xs text-kmt-muted">{formatBytes(row.fileSize)}</p>
      </div>
    )
  },
  { key: "case", header: copy.common.case, render: (row) => (row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : copy.common.noCase) },
  { key: "category", header: copy.common.category, render: (row) => copy.statuses.documentCategory[row.category as keyof typeof copy.statuses.documentCategory] ?? copy.common.unknown },
  {
    key: "status",
    header: copy.common.status,
    render: (row) => <Badge tone={row.status === "ACCEPTED" ? "active" : "neutral"}>{copy.statuses.document[row.status as keyof typeof copy.statuses.document] ?? copy.common.unknown}</Badge>
  },
  { key: "created", header: copy.files.uploadedAt, render: (row) => formatDateTime(row.createdAt, locale) }
  ];
}

function MobileCard({ row, copy, locale }: { row: DocumentRow; copy: ClientContent; locale: ClientLocale }) {
  return (
    <DataRecordCard
      className={clientPortalRowClass}
      title={
        <a className="text-kmt-navy hover:underline" href={`/api/files/${row.id}/download`}>
          {row.fileName}
        </a>
      }
      description={formatBytes(row.fileSize)}
      badges={<Badge tone={row.status === "ACCEPTED" ? "active" : "neutral"}>{copy.statuses.document[row.status as keyof typeof copy.statuses.document] ?? copy.common.unknown}</Badge>}
      fields={[
        { label: copy.common.case, value: row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : copy.common.noCase },
        { label: copy.common.category, value: copy.statuses.documentCategory[row.category as keyof typeof copy.statuses.documentCategory] ?? copy.common.unknown },
        { label: copy.files.uploadedAt, value: formatDateTime(row.createdAt, locale), className: "sm:col-span-2" }
      ]}
      action={
        <a className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/api/files/${row.id}/download`}>
          {copy.common.download}
        </a>
      }
    />
  );
}

export default async function ClientFilesPage() {
  const guard = await requirePortalPage("/client/files");
  const locale = normalizeClientLocale(guard.context.user.locale);
  const copy = getClientContent(locale);
  if (guard.status === "forbidden") {
    return <PermissionBlocked description={guard.description} locale={locale} title={guard.title} />;
  }

  const [documents, cases] = await Promise.all([listPortalDocuments(guard.context.principal), listPortalCases(guard.context.principal)]);

  return (
    <ClientSiteShell locale={locale} navItems={clientNavForPath("/client/files", locale)} title={copy.files.title} userLabel={guard.context.user.name}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ClientPortalPanel description={copy.files.visibleDescription} title={copy.files.visibleTitle}>
          <DataTable
            className={clientPortalTableClass}
            columns={documentColumns(copy, locale)}
            empty={copy.files.empty}
            emptyClassName="client-portal-table-empty"
            mobileRender={(row) => <MobileCard copy={copy} locale={locale} row={row} />}
            rows={documents}
          />
        </ClientPortalPanel>
        <DocumentUploadForm cases={cases.map((legalCase) => ({ id: legalCase.id, title: legalCase.title, internalFileNumber: legalCase.internalFileNumber }))} locale={locale} />
      </div>
    </ClientSiteShell>
  );
}
