import { NextResponse } from "next/server";
import { caseStatusUpdateSchema, updateAdminCaseStatus } from "@/server/admin/case-operations-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type CaseActionRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function POST(request: Request, { params }: CaseActionRouteProps) {
  const requestId = getRequestId(request);
  const { caseId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, caseStatusUpdateSchema, "Case status payload is invalid.");
    const legalCase = await updateAdminCaseStatus({
      actor: context.principal,
      caseId,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: legalCase, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
