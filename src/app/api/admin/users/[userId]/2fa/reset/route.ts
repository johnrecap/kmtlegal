import { NextResponse } from "next/server";
import { resetStaffTwoFactor } from "@/server/auth/auth-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { uuidSchema, parseWithSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ userId: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  const requestId = getRequestId(request);
  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    const { userId } = await params;
    const targetUserId = parseWithSchema(uuidSchema, userId, "User id is invalid.");
    const result = await resetStaffTwoFactor(request, targetUserId);
    if (!result) {
      return jsonError(403, "PERMISSION_DENIED", "Staff 2FA reset permission is required.", requestId);
    }
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
