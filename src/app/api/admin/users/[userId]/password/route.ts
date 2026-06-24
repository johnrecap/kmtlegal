import { NextResponse } from "next/server";
import { adminUserPasswordUpdateSchema, updateAdminUserPassword } from "@/server/admin/governance-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminUserPasswordUpdateSchema, "Password payload is invalid.");
    const result = await updateAdminUserPassword({
      actor: context.principal,
      actorSessionId: context.sessionId,
      userId: params.userId,
      body,
      request
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
