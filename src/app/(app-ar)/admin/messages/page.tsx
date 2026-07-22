import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { Badge, Button, DataRecordCard, DataTable, FilterBar, SearchInput, Select, type DataTableColumn } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { conversationStatusLabels, formatDateTime, labelFrom } from "@/lib/legal-format";
import { plan35AdminListAccessibilityCopy } from "@/lib/ui-copy";
import { AdminPermissionBlocked as PermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { listAdminConversations, listConversationAssignees } from "@/server/conversations/conversation-service";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "رسائل العملاء | KMT Legal",
  description: "Inbox محادثات العملاء مع السكرتيرة وفريق المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;
type ConversationRow = Awaited<ReturnType<typeof listAdminConversations>>["items"][number];

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

function statusTone(status: string) {
  if (status === "WAITING_STAFF") {
    return "pending" as const;
  }
  if (status === "WAITING_CLIENT" || status === "OPEN") {
    return "active" as const;
  }
  if (status === "CLOSED" || status === "ARCHIVED") {
    return "closed" as const;
  }
  return "neutral" as const;
}

function listHref(filters: { q?: string; status?: string; assignedToId?: string; pageSize?: number }, page: number) {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.assignedToId) {
    params.set("assignedToId", filters.assignedToId);
  }
  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }
  params.set("page", String(page));
  return `/admin/messages?${params.toString()}`;
}

const columns: Array<DataTableColumn<ConversationRow>> = [
  {
    key: "client",
    header: "العميل",
    render: (row) => (
      <div>
        <Link className="font-semibold text-kmt-navy hover:underline" href={`/admin/messages/${row.id}`}>
          {row.client.fullName}
        </Link>
        <p className="mt-1 text-xs text-kmt-muted" dir="ltr">{row.client.phone}</p>
      </div>
    )
  },
  {
    key: "latest",
    header: "آخر رسالة",
    render: (row) => (
      <div className="max-w-lg">
        <p className="line-clamp-2 break-words text-sm text-kmt-ink">{row.latestMessage?.body ?? "لا توجد رسائل"}</p>
        <p className="mt-1 text-xs text-kmt-muted">{formatDateTime(row.lastMessageAt)}</p>
      </div>
    )
  },
  {
    key: "status",
    header: "الحالة",
    render: (row) => <Badge tone={statusTone(row.status)}>{labelFrom(conversationStatusLabels, row.status)}</Badge>
  },
  {
    key: "assignee",
    header: "المسؤول",
    render: (row) => row.assignedTo?.name ?? "غير معين"
  },
  {
    key: "action",
    header: "",
    render: (row) => (
      <Link className="text-sm font-semibold text-kmt-navy hover:underline" href={`/admin/messages/${row.id}`}>
        فتح
      </Link>
    )
  }
];

function ConversationMobileCard({ row }: { row: ConversationRow }) {
  return (
    <DataRecordCard
      title={
        <Link className="text-kmt-navy hover:underline" href={`/admin/messages/${row.id}`}>
          {row.client.fullName}
        </Link>
      }
      description={<span dir="ltr">{row.client.phone}</span>}
      badges={<Badge tone={statusTone(row.status)}>{labelFrom(conversationStatusLabels, row.status)}</Badge>}
      fields={[
        { label: "آخر رسالة", value: row.latestMessage?.body ?? "لا توجد رسائل" },
        { label: "المسؤول", value: row.assignedTo?.name ?? "غير معين" },
        { label: "آخر تحديث", value: formatDateTime(row.lastMessageAt) }
      ]}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm", className: "min-h-11 w-full" })} href={`/admin/messages/${row.id}`}>
          فتح المحادثة
        </Link>
      }
    />
  );
}

export default async function AdminMessagesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const guard = await requireAdminRoutePage("/admin/messages");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const query = flattenSearchParams((await searchParams) ?? {});
  const [result, assignees] = await Promise.all([
    listAdminConversations({ actor: guard.context.principal, query }),
    listConversationAssignees({ actor: guard.context.principal })
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <DashboardShell
      eyebrow="تواصل العملاء"
      mode="admin"
      navItems={adminNavForPath("/admin/messages")}
      title="رسائل العملاء"
      userLabel={guard.context.user.name}
      principal={guard.context.principal}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
    >
      <div className="min-w-0 space-y-5">
        <form action="/admin/messages" method="get">
          <FilterBar ariaLabel={plan35AdminListAccessibilityCopy.messages.filters}>
            <SearchInput ariaLabel={plan35AdminListAccessibilityCopy.messages.search} className="min-w-0 flex-1 sm:min-w-80" defaultValue={result.filters.q ?? ""} name="q" placeholder="ابحث بالعميل أو الهاتف أو نص الرسالة" />
            <Select className="min-w-44" defaultValue={result.filters.status ?? ""} label="الحالة" name="status">
              <option value="">كل الحالات</option>
              {Object.entries(conversationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select className="min-w-44" defaultValue={result.filters.assignedToId ?? ""} label="المسؤول" name="assignedToId">
              <option value="">كل الفريق</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              تطبيق
            </Button>
          </FilterBar>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-kmt-muted">
          <p>{result.total} محادثة</p>
          <p>
            صفحة {result.page} من {totalPages}
          </p>
        </div>

        <DataTable
          caption={plan35AdminListAccessibilityCopy.messages.table}
          columns={columns}
          rows={result.items}
          empty="لا توجد محادثات عملاء مطابقة للفلاتر الحالية."
          mobileRender={(row) => <ConversationMobileCard row={row} />}
        />

        <div className="flex flex-wrap items-center justify-end gap-3">
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
    </DashboardShell>
  );
}
