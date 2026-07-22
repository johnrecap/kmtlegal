import { NextResponse } from "next/server";
import { markAdminNotificationRead } from "@/server/admin/notification-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type NotificationReadRouteProps = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function POST(request: Request, { params }: NotificationReadRouteProps) {
  const requestId = getRequestId(request);
  const { notificationId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const notification = await markAdminNotificationRead({
      actor: context.principal,
      notificationId
    });

    return NextResponse.json({ data: notification, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.notifications.read", method: "POST" });
  }
}
