import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout";
import { ContactMessageInbox } from "@/features/admin/contact-messages/contact-message-inbox";
import { AdminNotificationBell } from "@/features/admin/notifications/admin-notification-bell";
import { plan35ContactInboxUiCopy as copy } from "@/lib/ui-copy";
import {
  canManageAdminContactMessages,
  listAdminContactMessages
} from "@/server/admin/contact-message-service";
import { AdminPermissionBlocked, requireAdminRoutePage } from "@/server/auth/page-guards";
import { adminNavForPath } from "../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${copy.title} | KMT Legal`,
  description: copy.description
};

type SearchParams = Record<string, string | string[] | undefined>;

function flattenSearchParams(searchParams: SearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

export default async function AdminContactMessagesPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const guard = await requireAdminRoutePage("/admin/contact-messages");
  if (guard.status === "forbidden") {
    return <AdminPermissionBlocked title={guard.title} description={guard.description} />;
  }

  const result = await listAdminContactMessages({
    actor: guard.context.principal,
    query: flattenSearchParams((await searchParams) ?? {})
  });

  return (
    <DashboardShell
      eyebrow={copy.eyebrow}
      mode="admin"
      navItems={adminNavForPath("/admin/contact-messages")}
      notificationBell={<AdminNotificationBell principal={guard.context.principal} />}
      principal={guard.context.principal}
      title={copy.title}
      userLabel={guard.context.user.name}
    >
      <p className="mb-5 max-w-3xl text-sm leading-7 text-kmt-muted">{copy.description}</p>
      <ContactMessageInbox
        canManage={canManageAdminContactMessages(guard.context.principal)}
        initialData={result}
      />
    </DashboardShell>
  );
}
