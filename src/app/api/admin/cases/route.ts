import { NextResponse } from "next/server";
import { listAdminCases } from "@/server/admin/case-operations-service";
import { createManualCase } from "@/server/admin/manual-case-service";
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

    const url = new URL(request.url);
    const result = await listAdminCases({
      actor: context.principal,
      query: Object.fromEntries(url.searchParams.entries())
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.cases", method: "GET" });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    const body = await request.json().catch(() => null);
    const result = await createManualCase({
      actor: context.principal,
      body,
      request,
      requestId
    });
    return NextResponse.json(
      { data: result, requestId },
      { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.cases", method: "POST" });
  }
}
