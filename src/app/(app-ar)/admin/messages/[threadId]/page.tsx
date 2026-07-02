import type { Metadata } from "next";
import Link from "next/link";
import { DashboardShell } from "@/components/layout";
import { buttonClasses } from "@/components/ui/button";
import { AdminMessageThreadPanel } from "@/features/admin/messages/admin-message-thread-panel";
import { PermissionBlocked, requireAdminPage } from "@/server/auth/page-guards";
import {
  canAssignAdminConversations,
  canManageAdminConversations,
  canReadAdminConversations,
  canReplyAdminConversations,
  getAdminConversationDetail,
  listConversationAssignees
} from "@/server/conversations/conversation-service";
import { adminNavForPath } from "../../admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "محادثة عميل | KMT Legal",
  description: "تفاصيل محادثة العميل مع فريق المكتب."
};

type AdminMessageDetailPageProps = {
  params: Promise<{
    threadId: string;
  }>;
};

export default async function AdminMessageDetailPage({ params }: AdminMessageDetailPageProps) {
  const { threadId } = await params;
  const guard = await requireAdminPage(`/admin/messages/${threadId}`);
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  if (!canReadAdminConversations(guard.context.principal)) {
    return <PermissionBlocked title="غير مسموح بقراءة رسائل العملاء" description="هذا المسار يحتاج صلاحية قراءة محادثات العملاء." />;
  }

  const [thread, assignees] = await Promise.all([
    getAdminConversationDetail({ actor: guard.context.principal, threadId }),
    listConversationAssignees({ actor: guard.context.principal })
  ]);

  return (
    <DashboardShell
      eyebrow="تواصل العملاء"
      mode="admin"
      navItems={adminNavForPath("/admin/messages")}
      title={`محادثة ${thread.client.fullName}`}
      userLabel={guard.context.user.name}
      action={
        <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href="/admin/messages">
          رجوع للرسائل
        </Link>
      }
    >
      <AdminMessageThreadPanel
        initialThread={thread}
        assignees={assignees}
        canAssign={canAssignAdminConversations(guard.context.principal)}
        canManage={canManageAdminConversations(guard.context.principal)}
        canReply={canReplyAdminConversations(guard.context.principal)}
      />
    </DashboardShell>
  );
}
