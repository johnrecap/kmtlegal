import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import { AdminRowActions } from "@/components/admin/admin-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
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
import {
  AdminDocumentUploadForm,
  DocumentActionForm,
  DocumentDeleteForm
} from "@/features/admin/task-documents/task-document-forms";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
  formatBytes,
  formatDateTime,
  labelFrom
} from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";
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
    <Accordion type="single" collapsible>
      <AccordionItem value={document.id} className="rounded border border-kmt-border bg-white px-3">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-wrap items-start justify-between gap-3 text-start">
            <span className="min-w-0">
              <span className="block font-semibold text-kmt-navy">{document.fileName}</span>
              <span className="mt-1 block text-sm font-normal leading-6 text-kmt-muted">
                {formatBytes(document.fileSize)} · {document.ownerClient?.fullName ?? "بدون عميل مالك"} ·{" "}
                {document.uploadedBy.name}
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(document.status)}>{labelFrom(documentStatusLabels, document.status)}</Badge>
              <Badge tone={visibilityTone(document.visibility)}>
                {labelFrom(documentVisibilityLabels, document.visibility)}
              </Badge>
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mb-3 flex justify-end">
            <AdminRowActions
              label={`إجراءات المستند ${document.fileName}`}
              entries={[
                {
                  kind: "action",
                  action: { key: "download", label: "تنزيل الملف", href: `/api/files/${document.id}/download` }
                },
                ...(document.case
                  ? [
                      {
                        kind: "action" as const,
                        action: {
                          key: "case",
                          label: "فتح القضية",
                          href: `/admin/cases/${document.case.id}?tab=documents`
                        }
                      }
                    ]
                  : [])
              ]}
            />
          </div>
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
          <div className="flex flex-wrap items-start gap-3">
          <form action="/admin/documents" className="min-w-0 flex-1" method="get">
            <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.documents.filters}>
              <SearchInput
                ariaLabel={plan35AdminListAccessibilityCopy.documents.search}
                className="min-w-0 flex-1 sm:min-w-80"
                defaultValue={result.filters.q ?? ""}
                name="q"
                placeholder="ابحث باسم الملف أو العميل أو القضية"
              />
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {documentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(documentStatusLabels, status)}
                  </option>
                ))}
              </Select>
              </span>
              <span className="hidden lg:contents">
              <Select className="min-w-40" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                <option value="">كل التصنيفات</option>
                {documentCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {labelFrom(documentCategoryLabels, category)}
                  </option>
                ))}
              </Select>
              </span>
              <input type="hidden" name="visibility" value={result.filters.visibility ?? ""} />
              <input type="hidden" name="ownerClientId" value={result.filters.ownerClientId ?? ""} />
              <input type="hidden" name="sortBy" value={result.filters.sortBy} />
              <input type="hidden" name="sortDirection" value={result.filters.sortDirection} />
              <span className="hidden lg:contents">
              <Button type="submit" variant="secondary">
                تطبيق
              </Button>
              </span>
            </FilterBar>
          </form>
          <MoreFiltersPopover triggerLabel="المزيد من الفلاتر">
            <form action="/admin/documents" className="space-y-3" method="get">
              <input type="hidden" name="q" value={result.filters.q ?? ""} />
              <input type="hidden" name="status" value={result.filters.status ?? ""} />
              <input type="hidden" name="category" value={result.filters.category ?? ""} />
              <Select className="w-full" defaultValue={result.filters.visibility ?? ""} label="الظهور" name="visibility">
                <option value="">كل مستويات الظهور</option>
                {documentVisibilityOptions.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {labelFrom(documentVisibilityLabels, visibility)}
                  </option>
                ))}
              </Select>
              {options.clients.length ? (
                <Select
                  className="w-full"
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
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="createdAt">تاريخ الرفع</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="fileName">اسم الملف</option>
                <option value="status">الحالة</option>
                <option value="category">التصنيف</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </Select>
              <Button className="w-full" type="submit" variant="secondary">
                تطبيق
              </Button>
            </form>
          </MoreFiltersPopover>
          <MobileFiltersSheet description="ابحث وصفِّ مستندات المكتب." title="فلاتر المستندات" triggerLabel="الفلاتر">
            <form action="/admin/documents" className="space-y-3" method="get">
              <SearchInput
                ariaLabel={plan35AdminListAccessibilityCopy.documents.search}
                className="w-full"
                defaultValue={result.filters.q ?? ""}
                name="q"
                placeholder="ابحث باسم الملف أو العميل أو القضية"
              />
              <Select className="w-full" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
                <option value="">كل الحالات</option>
                {documentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelFrom(documentStatusLabels, status)}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.category ?? ""} label="التصنيف" name="category">
                <option value="">كل التصنيفات</option>
                {documentCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {labelFrom(documentCategoryLabels, category)}
                  </option>
                ))}
              </Select>
              <Select className="w-full" defaultValue={result.filters.visibility ?? ""} label="الظهور" name="visibility">
                <option value="">كل مستويات الظهور</option>
                {documentVisibilityOptions.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {labelFrom(documentVisibilityLabels, visibility)}
                  </option>
                ))}
              </Select>
              {options.clients.length ? (
                <Select
                  className="w-full"
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
              <Select className="w-full" defaultValue={result.filters.sortBy} label="الترتيب" name="sortBy">
                <option value="createdAt">تاريخ الرفع</option>
                <option value="updatedAt">آخر تحديث</option>
                <option value="fileName">اسم الملف</option>
                <option value="status">الحالة</option>
                <option value="category">التصنيف</option>
              </Select>
              <Select className="w-full" defaultValue={result.filters.sortDirection} label="الاتجاه" name="sortDirection">
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </Select>
              <Button className="w-full" type="submit" variant="secondary">
                تطبيق
              </Button>
            </form>
          </MobileFiltersSheet>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
            <p>{result.total} مستند داخل الفلاتر الحالية</p>
            <p>
              صفحة {result.page} من {totalPages}
            </p>
          </div>

          <DataTable
            caption={plan35AdminListAccessibilityCopy.documents.table}
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

          <div className="hidden space-y-3 md:block">
            {result.items.map((document) => (
              <DocumentCard key={document.id} document={document} options={options} />
            ))}
          </div>

          <AdminPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            hrefForPage={(page) => listHref(result.filters, page)}
            resetHref="/admin/documents"
            resetLabel="مسح الفلاتر"
          />
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
