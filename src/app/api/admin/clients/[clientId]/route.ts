import { NextResponse } from "next/server";
import { adminClientWriteSchema, getAdminClientDetail, updateAdminClient } from "@/server/admin/client-crm-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ClientRouteProps = {
  params: {
    clientId: string;
  };
};

export async function GET(request: Request, { params }: ClientRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const client = await getAdminClientDetail({
      actor: context.principal,
      clientId: params.clientId
    });

    return NextResponse.json({ data: client, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: ClientRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminClientWriteSchema, "Client payload is invalid.");
    const client = await updateAdminClient({
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
