import { NextResponse } from "next/server";
import { getAdminUserDetail, updateAdminUser } from "@/server/admin/governance-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type UserRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(request: Request, { params }: UserRouteProps) {
  const requestId = getRequestId(request);
  const { userId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const user = await getAdminUserDetail({ actor: context.principal, userId });
    return NextResponse.json({ data: user, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: UserRouteProps) {
  const requestId = getRequestId(request);
  const { userId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await request.json().catch(() => null);
    const user = await updateAdminUser({ actor: context.principal, userId, body, request });

    return NextResponse.json({ data: user, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
