import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { Badge, DataRecordCard, DataTable, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { DocumentUploadForm } from "@/features/portal/document-upload-form";
import { documentCategoryLabels, documentStatusLabels, formatBytes, formatDateTime, labelFrom } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { listPortalCases, listPortalDocuments } from "@/server/portal/client-portal-service";
import { portalNavForPath } from "../portal-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مستنداتي | KMT Legal"
};

type DocumentRow = Awaited<ReturnType<typeof listPortalDocuments>>[number];

const columns: Array<DataTableColumn<DocumentRow>> = [
  {
    key: "file",
    header: "المستند",
    render: (row) => (
      <div>
        <a className="font-semibold text-kmt-navy hover:underline" href={`/api/files/${row.id}/download`}>
          {row.fileName}
        </a>
        <p className="mt-1 text-xs text-kmt-muted">{formatBytes(row.fileSize)}</p>
      </div>
    )
  },
  {
    key: "case",
    header: "القضية",
    render: (row) => row.case ? `${row.case.internalFileNumber} - ${row.case.title}` : "بدون قضية"
  },
  {
    key: "category",
    header: "التصنيف",
    render: (row) => labelFrom(documentCategoryLabels, row.category)
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={row.status === "ACCEPTED" ? "active" : "neutral"}>{labelFrom(documentStatusLabels, row.status)}</Badge>
  },
  {
    key: "created",
    header: "تاريخ الرفع",
    render: (row) => formatDateTime(row.createdAt)
  }
];

function PortalDocumentMobileCard({ row }: { row: DocumentRow }) {
  return (
    <DataRecordCard
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
        <a className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/api/files/${row.id}/download`}>
          تنزيل
        </a>
      }
    />
  );
}

export default async function PortalDocumentsPage() {
  const guard = await requirePortalPage("/portal/documents");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const [documents, cases] = await Promise.all([listPortalDocuments(guard.context.principal), listPortalCases(guard.context.principal)]);

  return (
    <DashboardShell
      eyebrow="بوابة العميل"
      mode="portal"
      navItems={portalNavForPath("/portal/documents")}
      title="مستنداتي"
      userLabel={guard.context.user.name}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <DataTable columns={columns} rows={documents} empty="لا توجد مستندات مرئية لحسابك حتى الآن." mobileRender={(row) => <PortalDocumentMobileCard row={row} />} />
        <DocumentUploadForm cases={cases.map((legalCase) => ({ id: legalCase.id, title: legalCase.title, internalFileNumber: legalCase.internalFileNumber }))} />
      </div>
    </DashboardShell>
  );
}
