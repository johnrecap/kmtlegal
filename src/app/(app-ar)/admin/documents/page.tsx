import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  FilterBar,
  SearchInput,
  Select,
  StateBlock
} from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import {
  AdminDocumentUploadForm,
  DocumentActionForm,
  DocumentDeleteForm
} from "@/features/admin/task-documents/task-document-forms";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  formatDateTime,
  labelFrom
} from "@/lib/legal-format";
import {
  getAdminDocumentOptions,
  listAdminDocuments
} from "@/server/admin/task-document-service";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مستندات المكتب | KMT Legal",
  description: "إدارة مستندات القضايا والعملاء مع صلاحيات تنزيل وتحديث وحذف مراقبة."
};

type SearchParams = Record<string, string | string[] | undefined>;
type DocumentRow = Awaited<ReturnType<typeof listAdminDocuments>>["items"][number];
type DocumentOptions = Awaited<ReturnType<typeof getAdminDocumentOptions>>;

const documentStatusOptions = ["NEW", "UNDER_REVIEW", "NEEDS_CLARIFICATION", "ACCEPTED", "REJECTED"];
const documentCategoryOptions = ["CONTRACT", "COURT_FILE", "IDENTITY", "EVIDENCE", "PAYMENT", "OTHER"];
const documentVisibilityOptions = ["CLIENT_VISIBLE", "STAFF_ONLY", "INTERNAL_ONLY"];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function statusTone(status: string) {
  if (status === "ACCEPTED") {
    return "active" as const;
  }
  if (status === "REJECTED" || status === "DELETED") {
    return "danger" as const;
  }
  return "pending" as const;
}

function visibilityTone(visibility: string) {
  return visibility === "CLIENT_VISIBLE" ? ("active" as const) : ("neutral" as const);
}

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${Math.ceil(value / 1024)} KB`;
  }
  return `${value} B`;
}

function listHref(
  filters: {
    q?: string;
    status?: string;
    category?: string;
    visibility?: string;
    caseId?: string;
    ownerClientId?: string;
    sortBy?: string;
    sortDirection?: string;
    pageSize?: number;
  },
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }
  params.set("page", String(page));
  return `/admin/documents?${params.toString()}`;
}

function DocumentCard({ document, options }: { document: DocumentRow; options: DocumentOptions }) {
  return (
    <details className="rounded border border-kmt-border bg-white p-3">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="font-semibold text-kmt-navy hover:underline"
              href={`/api/files/${document.id}/download`}
            >
              {document.fileName}
            </Link>
            <p className="mt-1 text-sm leading-6 text-kmt-muted">
              {formatBytes(document.fileSize)} · {document.ownerClient?.fullName ?? "بدون عميل مالك"} ·{" "}
              {document.uploadedBy.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(document.status)}>{labelFrom(documentStatusLabels, document.status)}</Badge>
            <Badge tone={visibilityTone(document.visibility)}>
              {labelFrom(documentVisibilityLabels, document.visibility)}
            </Badge>
          </div>
        </div>
      </summary>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-kmt-muted sm:grid-cols-2">
        <p>
          <span className="font-semibold text-kmt-ink">التصنيف: </span>
          {labelFrom(documentCategoryLabels, document.category)}
        </p>
        <p>
          <span className="font-semibold text-kmt-ink">تاريخ الرفع: </span>
          {formatDateTime(document.createdAt)}
        </p>
        <p>
          <span className="font-semibold text-kmt-ink">نوع الملف: </span>
          {document.fileType}
        </p>
        <p>
          <span className="font-semibold text-kmt-ink">القضية: </span>
          {document.case ? (
            <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${document.case.id}?tab=documents`}>
              {document.case.internalFileNumber} - {document.case.title}
            </Link>
          ) : (
            "غير مرتبط"
          )}
        </p>
      </div>
      <DocumentActionForm
        canManage={options.canManage}
        document={{
          id: document.id,
          status: document.status,
          category: document.category,
          visibility: document.visibility
        }}
      />
      <DocumentDeleteForm canManage={options.canManage} documentId={document.id} />
    </details>
  );
}

export default async function AdminDocumentsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/documents");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, options] = await Promise.all([
    listAdminDocuments({ actor: guard.context.principal, query }),
    getAdminDocumentOptions(guard.context.principal)
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="لوحة المكتب"
      mode="admin"
      navItems={adminNavForPath("/admin/documents")}
      title="مستندات المكتب"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <form action="/admin/documents" method="get">
            <FilterBar>
              <SearchInput
                className="min-w-0 flex-1 sm:min-w-80"
                defaultValue={result.filters.q ?? ""}
                name="q"
                placeholder="ابحث باسم الملف أو العميل أو القضية"
              />
              <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {documentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(documentStatusLabels, status)}
                  </option>
                ))}
              </Select>
              <Select className="min-w-40" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                <option value="">كل التصنيفات</option>
                {documentCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {labelFrom(documentCategoryLabels, category)}
                  </option>
                ))}
              </Select>
              <Select className="min-w-40" defaultValue={result.filters.visibility ?? ""} label="الظهور" name="visibility">
                <option value="">كل مستويات الظهور</option>
                {documentVisibilityOptions.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {labelFrom(documentVisibilityLabels, visibility)}
                  </option>
                ))}
              </Select>
              {options.clients.length ? (
                <Select
                  className="min-w-44"
                  defaultValue={result.filters.ownerClientId ?? ""}
                  label="العميل"
                  name="ownerClientId"
                >
                  <option value="">كل العملاء</option>
                  {options.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Select className="min-w-40" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="createdAt">تاريخ الرفع</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="fileName">اسم الملف</option>
                <option value="status">الحالة</option>
                <option value="category">التصنيف</option>
              </Select>
              <Select className="min-w-32" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </Select>
              <Button type="submit" variant="secondary">
                تطبيق
              </Button>
            </FilterBar>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
            <p>{result.total} مستند داخل الفلاتر الحالية</p>
            <p>
              صفحة {result.page} من {totalPages}
            </p>
          </div>

          <DataTable
            columns={[
              {
                key: "file",
                header: "الملف",
                render: (document) => (
                  <div>
                    <Link className="font-semibold text-kmt-navy hover:underline" href={`/api/files/${document.id}/download`}>
                      {document.fileName}
                    </Link>
                    <p className="mt-1 text-xs text-kmt-muted">
                      {formatBytes(document.fileSize)} · {document.fileType}
                    </p>
                  </div>
                )
              },
              {
                key: "owner",
                header: "المالك / القضية",
                render: (document) => (
                  <div className="space-y-1">
                    <p>{document.ownerClient?.fullName ?? "غير محدد"}</p>
                    {document.case ? (
                      <Link className="text-xs font-semibold text-kmt-navy hover:underline" href={`/admin/cases/${document.case.id}?tab=documents`}>
                        {document.case.internalFileNumber}
                      </Link>
                    ) : (
                      <p className="text-xs text-kmt-muted">بدون قضية</p>
                    )}
                  </div>
                )
              },
              {
                key: "category",
                header: "التصنيف",
                render: (document) => labelFrom(documentCategoryLabels, document.category)
              },
              {
                key: "status",
                header: "الحالة",
                render: (document) => (
                  <Badge tone={statusTone(document.status)}>{labelFrom(documentStatusLabels, document.status)}</Badge>
                )
              },
              {
                key: "visibility",
                header: "الظهور",
                render: (document) => (
                  <Badge tone={visibilityTone(document.visibility)}>
                    {labelFrom(documentVisibilityLabels, document.visibility)}
                  </Badge>
                )
              },
              {
                key: "uploaded",
                header: "الرفع",
                render: (document) => (
                  <div>
                    <p>{document.uploadedBy.name}</p>
                    <p className="mt-1 text-xs text-kmt-muted">{formatDateTime(document.createdAt)}</p>
                  </div>
                )
              }
            ]}
            empty={<StateBlock title="لا توجد مستندات" description="غير الفلاتر أو ارفع مستندًا جديدًا داخل نطاق صلاحياتك." />}
            rows={result.items}
            mobileRender={(document) => <DocumentCard document={document} options={options} />}
          />

          <div className="hidden space-y-3 lg:block">
            {result.items.map((document) => (
              <DocumentCard key={document.id} document={document} options={options} />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className="text-sm font-semibold text-kmt-navy hover:underline" href="/admin/documents">
              مسح الفلاتر
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              {result.page > 1 ? (
                <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page - 1)}>
                  السابق
                </Link>
              ) : null}
              {result.page < totalPages ? (
                <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={listHref(result.filters, result.page + 1)}>
                  التالي
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>رفع مستند</CardTitle>
            <CardDescription>
              الرفع يستخدم عقد PLAN-07: تخزين VPS خاص، حد 5MB، وتنزيل عبر الخادم بعد فحص الصلاحيات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminDocumentUploadForm cases={options.cases} canManage={options.canManage} clients={options.clients} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
