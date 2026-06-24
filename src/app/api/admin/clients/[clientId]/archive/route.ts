import { NextResponse } from "next/server";
import { archiveAdminClient, archiveClientSchema } from "@/server/admin/client-crm-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ClientActionRouteProps = {
  params: {
    clientId: string;
  };
};

export async function POST(request: Request, { params }: ClientActionRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, archiveClientSchema, "Client archive payload is invalid.");
    const client = await archiveAdminClient({
      actor: context.principal,
      clientId: params.clientId,
      body,
      request
    });

    return NextResponse.json({ data: client, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
