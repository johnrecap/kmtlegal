import { NextResponse } from "next/server";
import { replaceRolePermissions } from "@/server/admin/role-permission-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type RolePermissionRouteProps = {
  params: Promise<{ roleId: string }>;
};

export async function PATCH(request: Request, { params }: RolePermissionRouteProps) {
  const requestId = getRequestId(request);
  const { roleId } = await params;
  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    const body = await request.json().catch(() => null);
    const data = await replaceRolePermissions({ actor: context.principal, roleId, body, request });
    return NextResponse.json({ data, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.roles.permissions", method: "PATCH" });
  }
}
