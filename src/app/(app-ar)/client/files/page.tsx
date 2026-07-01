import type { Metadata } from "next";
import { ClientPortalPanel, ClientSiteShell, clientPortalRowClass, clientPortalSecondaryActionClass, clientPortalTableClass } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { DocumentUploadForm } from "@/features/portal/document-upload-form";
import { documentCategoryLabels, documentStatusLabels, formatBytes, formatDateTime, labelFrom } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalCases, listPortalDocuments } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ملفاتي | KMT Legal"
};

type DocumentRow = Awaited<ReturnType<typeof listPortalDocuments>>[number];

const columns: Array<DataTableColumn<DocumentRow>> = [
  {
    key: "file",
    header: "الملف",
    render: (row) => (
      <div>
        <a className="font-semibold text-kmt-navy hover:underline" href={`/api/files/${row.id}/download`}>
          {row.fileName}
        </a>
        <p className="mt-1 text-xs text-kmt-muted">{formatBytes(row.fileSize)}</p>
      </div>
    )
  },
  { key: "case", header: "القضية", render: (row) => (row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية") },
  { key: "category", header: "التصنيف", render: (row) => labelFrom(documentCategoryLabels, row.category) },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={row.status === "ACCEPTED" ? "active" : "neutral"}>{labelFrom(documentStatusLabels, row.status)}</Badge>
  },
  { key: "created", header: "تاريخ الرفع", render: (row) => formatDateTime(row.createdAt) }
];

function MobileCard({ row }: { row: DocumentRow }) {
  return (
    <DataRecordCard
      className={clientPortalRowClass}
      title={
        <a className="text-kmt-navy hover:underline" href={`/api/files/${row.id}/download`}>
          {row.fileName}
        </a>
      }
      description={formatBytes(row.fileSize)}
      badges={<Badge tone={row.status === "ACCEPTED" ? "active" : "neutral"}>{labelFrom(documentStatusLabels, row.status)}</Badge>}
      fields={[
        { label: "القضية", value: row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية" },
        { label: "التصنيف", value: labelFrom(documentCategoryLabels, row.category) },
        { label: "تاريخ الرفع", value: formatDateTime(row.createdAt), className: "sm:col-span-2" }
      ]}
      action={
        <a className={buttonClasses({ variant: "secondary", size: "sm", className: `min-h-11 w-full ${clientPortalSecondaryActionClass}` })} href={`/api/files/${row.id}/download`}>
          تنزيل
        </a>
      }
    />
  );
}

export default async function ClientFilesPage() {
  const guard = await requirePortalPage("/client/files");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [documents, cases] = await Promise.all([listPortalDocuments(guard.context.principal), listPortalCases(guard.context.principal)]);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/files")} title="ملفاتي" userLabel={guard.context.user.name}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ClientPortalPanel description="كل المستندات التي سمح المكتب بظهورها لك أو رفعتها من حسابك." title="المستندات المرئية">
          <DataTable
            className={clientPortalTableClass}
            columns={columns}
            empty="لا توجد مستندات مرئية لحسابك حتى الآن."
            emptyClassName="client-portal-table-empty"
            mobileRender={(row) => <MobileCard row={row} />}
            rows={documents}
          />
        </ClientPortalPanel>
        <DocumentUploadForm cases={cases.map((legalCase) => ({ id: legalCase.id, title: legalCase.title, internalFileNumber: legalCase.internalFileNumber }))} />
      </div>
    </ClientSiteShell>
  );
}
