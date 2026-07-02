import { NextResponse } from "next/server";
import { clientAccountPasswordSchema, resetClientPortalAccountPassword } from "@/server/admin/client-crm-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ClientAccountPasswordRouteProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function POST(request: Request, { params }: ClientAccountPasswordRouteProps) {
  const requestId = getRequestId(request);
  const { clientId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, clientAccountPasswordSchema, "Client account password payload is invalid.");
    const result = await resetClientPortalAccountPassword({
      actor: context.principal,
      clientId,
      body,
      request
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
