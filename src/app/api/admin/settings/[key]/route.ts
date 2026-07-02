import { NextResponse } from "next/server";
import { adminSettingUpdateSchema, updateAdminSetting } from "@/server/admin/governance-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const requestId = getRequestId(request);
  const { key } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminSettingUpdateSchema, "Setting payload is invalid.");
    const setting = await updateAdminSetting({ actor: context.principal, key, body, request });

    return NextResponse.json({ data: setting, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
