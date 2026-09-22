import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { AdminPagination, MobileFiltersSheet, MoreFiltersPopover } from "@/components/admin";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FilterBar,
  SearchInput,
  Select,
  StateBlock
} from "@/components/ui";
import {
  AdminDocumentUploadForm
} from "@/features/admin/task-documents/task-document-forms";
import { DocumentList } from "@/features/admin/task-documents/document-list";
import {
  documentCategoryLabels,
  documentStatusLabels,
  documentVisibilityLabels,
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

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{result.total} مستند داخل الفلاتر الحالية</p>
            <p>
              صفحة {result.page} من {totalPages}
            </p>
          </div>

          <DocumentList
            caption={plan35AdminListAccessibilityCopy.documents.table}
            documents={result.items}
            options={{ canManage: options.canManage }}
          />

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
