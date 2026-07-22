import { AdminNotificationPopover } from "@/features/admin/notifications/admin-notification-popover";
import {
  listAdminNotifications,
  type NotificationCenterSnapshot
} from "@/server/admin/notification-service";
import { hasPermission, type Principal } from "@/server/auth/policy";

const emptySnapshot: NotificationCenterSnapshot = {
  genericUnreadCount: 0,
  consultationReviewCount: 0,
  attentionCount: 0,
  nextCursor: null,
  items: []
};

export async function AdminNotificationBell({ principal }: { principal: Principal }) {
  if (!hasPermission(principal, "notification.read.self")) return null;
  const summary = await listAdminNotifications({ actor: principal, query: { limit: 5 } }).catch(() => null);
  return (
    <AdminNotificationPopover
      initialLoadFailed={!summary}
      initialSnapshot={summary ?? emptySnapshot}
    />
  );
}
