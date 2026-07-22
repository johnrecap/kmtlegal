import { NextResponse } from "next/server";
import { plan35ApiErrorSourceMessages } from "@/lib/ui-copy";
import {
  adminSettingUpdateSchema,
  assertAdminSettingsManagePermission,
  updateAdminSetting
} from "@/server/admin/governance-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { ApiError, errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
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
    assertAdminSettingsManagePermission(context.principal);
    if (key === "storage.policy") {
      throw new ApiError(409, "SETTING_READ_ONLY", plan35ApiErrorSourceMessages.SETTING_READ_ONLY);
    }

    const body = await parseJsonRequest(request, adminSettingUpdateSchema, "Setting payload is invalid.");
    const setting = await updateAdminSetting({ actor: context.principal, key, body, request });

    return NextResponse.json({ data: setting, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
