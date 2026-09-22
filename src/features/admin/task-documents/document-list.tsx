"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminRowActions } from "@/components/admin/admin-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/animate-ui/components/radix/sheet";
import { Badge, Button, DataTable, StateBlock, type DataTableColumn } from "@/components/ui";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  formatBytes,
  formatDateTime,
  labelFrom
} from "@/lib/legal-format";
import { DocumentActionForm, DocumentDeleteForm } from "./task-document-forms";

export type AdminDocumentListItem = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  category: string;
  visibility: string;
  createdAt: string | Date;
  ownerClient: { id: string; fullName: string } | null;
  case: { id: string; internalFileNumber: string; title: string } | null;
  uploadedBy: { id: string; name: string; email: string };
};

type DocumentListOptions = {
  canManage: boolean;
};

function statusTone(status: string) {
  if (status === "ACCEPTED") return "active" as const;
  if (status === "REJECTED" || status === "DELETED") return "danger" as const;
  return "pending" as const;
}

function visibilityTone(visibility: string) {
  return visibility === "CLIENT_VISIBLE" ? ("active" as const) : ("neutral" as const);
}

function DocumentBadges({ document }: { document: AdminDocumentListItem }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge tone={statusTone(document.status)}>{labelFrom(documentStatusLabels, document.status)}</Badge>
      <Badge tone={visibilityTone(document.visibility)}>{labelFrom(documentVisibilityLabels, document.visibility)}</Badge>
    </span>
  );
}

function DocumentCard({ document, onOpen }: { document: AdminDocumentListItem; onOpen: () => void }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-semibold text-foreground" dir="auto">{document.fileName}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {formatBytes(document.fileSize)} · {document.ownerClient?.fullName ?? "بدون عميل مالك"}
          </p>
        </div>
        <DocumentBadges document={document} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{formatDateTime(document.createdAt)}</span>
        <Button onClick={onOpen} size="sm" type="button" variant="secondary">عرض وإدارة</Button>
      </div>
    </article>
  );
}

export function DocumentList({
  documents,
  options,
  caption
}: {
  documents: AdminDocumentListItem[];
  options: DocumentListOptions;
  caption: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => documents.find((document) => document.id === selectedId) ?? null, [documents, selectedId]);

  const columns: Array<DataTableColumn<AdminDocumentListItem>> = [
    {
      key: "file",
      header: "الملف",
      render: (document) => (
        <div>
          <Link className="break-words font-semibold text-primary hover:underline" dir="auto" href={`/api/files/${document.id}/download`}>{document.fileName}</Link>
          <p className="mt-1 text-xs text-muted-foreground"><bdi>{formatBytes(document.fileSize)} · {document.fileType}</bdi></p>
        </div>
      )
    },
    {
      key: "owner",
      header: "المالك / القضية",
      render: (document) => (
        <div className="space-y-1">
          <p>{document.ownerClient?.fullName ?? "غير محدد"}</p>
          {document.case ? <Link className="text-xs font-semibold text-primary hover:underline" href={`/admin/cases/${document.case.id}?tab=documents`}><bdi>{document.case.internalFileNumber}</bdi></Link> : <p className="text-xs text-muted-foreground">بدون قضية</p>}
        </div>
      )
    },
    { key: "category", header: "التصنيف", render: (document) => labelFrom(documentCategoryLabels, document.category) },
    { key: "status", header: "الحالة والظهور", render: (document) => <DocumentBadges document={document} /> },
    {
      key: "uploaded",
      header: "الرفع",
      render: (document) => <div><p>{document.uploadedBy.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(document.createdAt)}</p></div>
    },
    { key: "actions", header: "الإجراء", render: (document) => <Button onClick={() => setSelectedId(document.id)} size="sm" type="button" variant="secondary">عرض وإدارة</Button> }
  ];

  return (
    <>
      <DataTable
        caption={caption}
        columns={columns}
        empty={<StateBlock title="لا توجد مستندات" description="غيّر الفلاتر أو ارفع مستندًا جديدًا داخل نطاق صلاحياتك." />}
        mobileBreakpoint="lg"
        mobileRender={(document) => <DocumentCard document={document} onOpen={() => setSelectedId(document.id)} />}
        rows={documents}
        stickyHeader
      />
      <Sheet open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <SheetContent aria-label={selected ? `تفاصيل المستند ${selected.fileName}` : "تفاصيل المستند"} className="overflow-y-auto" side="right">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle className="break-words" dir="auto">{selected.fileName}</SheetTitle>
                <SheetDescription>{formatBytes(selected.fileSize)} · <bdi>{selected.fileType}</bdi></SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DocumentBadges document={selected} />
                  <AdminRowActions
                    label={`إجراءات المستند ${selected.fileName}`}
                    entries={[
                      { kind: "action", action: { key: "download", label: "تنزيل الملف", href: `/api/files/${selected.id}/download` } },
                      ...(selected.case ? [{ kind: "action" as const, action: { key: "case", label: "فتح القضية", href: `/admin/cases/${selected.case.id}?tab=documents` } }] : [])
                    ]}
                  />
                </div>
                <dl className="grid gap-3 rounded-lg border border-border bg-surface-muted p-4 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold text-foreground">التصنيف</dt><dd className="mt-1 text-muted-foreground">{labelFrom(documentCategoryLabels, selected.category)}</dd></div>
                  <div><dt className="font-semibold text-foreground">تاريخ الرفع</dt><dd className="mt-1 text-muted-foreground">{formatDateTime(selected.createdAt)}</dd></div>
                  <div><dt className="font-semibold text-foreground">المالك</dt><dd className="mt-1 text-muted-foreground">{selected.ownerClient?.fullName ?? "غير محدد"}</dd></div>
                  <div><dt className="font-semibold text-foreground">القضية</dt><dd className="mt-1 text-muted-foreground">{selected.case ? <Link className="font-semibold text-primary hover:underline" href={`/admin/cases/${selected.case.id}?tab=documents`}><bdi>{selected.case.internalFileNumber}</bdi> - {selected.case.title}</Link> : "غير مرتبط"}</dd></div>
                </dl>
                {options.canManage ? (
                  <>
                    <DocumentActionForm canManage document={{ id: selected.id, status: selected.status, category: selected.category, visibility: selected.visibility }} />
                    <DocumentDeleteForm canManage documentId={selected.id} />
                  </>
                ) : <StateBlock tone="permission" title="عرض للقراءة فقط" description="يمكنك تنزيل هذا المستند، لكن تعديل بياناته أو حذفه يحتاج صلاحية إدارة المستندات." />}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
