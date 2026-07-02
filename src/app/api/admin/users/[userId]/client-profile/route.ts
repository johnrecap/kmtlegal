import { NextResponse } from "next/server";
import { createClientProfileForPortalUser } from "@/server/admin/client-crm-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type UserClientProfileRouteProps = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: Request, { params }: UserClientProfileRouteProps) {
  const requestId = getRequestId(request);
  const { userId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const client = await createClientProfileForPortalUser({
      actor: context.principal,
      userId,
      request
    });

    return NextResponse.json({ data: client, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
