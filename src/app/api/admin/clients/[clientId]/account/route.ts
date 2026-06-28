import { NextResponse } from "next/server";
import { clientAccountCreateSchema, createOrLinkClientPortalAccount } from "@/server/admin/client-crm-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ClientAccountRouteProps = {
  params: {
    clientId: string;
  };
};

export async function POST(request: Request, { params }: ClientAccountRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, clientAccountCreateSchema, "Client account payload is invalid.");
    const client = await createOrLinkClientPortalAccount({
      actor: context.principal,
      clientId: params.clientId,
      body,
      request
    });

    return NextResponse.json({ data: client, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
