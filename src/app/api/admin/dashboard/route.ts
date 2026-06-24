import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/server/admin/dashboard-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { isStaffRole } from "@/server/auth/policy";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    if (!isStaffRole(context.principal.roleName)) {
      return jsonError(403, "PERMISSION_DENIED", "Staff access is required.", requestId);
    }

    const dashboard = await getAdminDashboard(context.principal);
    return NextResponse.json({ data: dashboard, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
