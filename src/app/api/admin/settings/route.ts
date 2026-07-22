import { NextResponse } from "next/server";
import { listAdminSettings } from "@/server/admin/governance-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const snapshot = await listAdminSettings(context.principal);
    return NextResponse.json({ data: snapshot, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
