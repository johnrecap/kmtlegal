import { NextResponse } from "next/server";
import { caseSessionCreateSchema, createAdminCaseSession } from "@/server/admin/case-operations-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type CaseActionRouteProps = {
  params: {
    caseId: string;
  };
};

export async function POST(request: Request, { params }: CaseActionRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, caseSessionCreateSchema, "Case session payload is invalid.");
    const session = await createAdminCaseSession({
      actor: context.principal,
      caseId: params.caseId,
      body,
      request
    });

    return NextResponse.json({ data: session, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
