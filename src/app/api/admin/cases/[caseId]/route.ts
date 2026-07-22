import { NextResponse } from "next/server";
import { getAdminCaseDetail } from "@/server/admin/case-operations-service";
import { updateManualCaseCore } from "@/server/admin/manual-case-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type CaseRouteProps = {
  params: Promise<{
    caseId: string;
  }>;
};

export async function GET(request: Request, { params }: CaseRouteProps) {
  const requestId = getRequestId(request);
  const { caseId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const legalCase = await getAdminCaseDetail({
      actor: context.principal,
      caseId
    });

    return NextResponse.json({ data: legalCase, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.cases.detail", method: "GET" });
  }
}

export async function PATCH(request: Request, { params }: CaseRouteProps) {
  const requestId = getRequestId(request);
  const { caseId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }
    const body = await request.json().catch(() => null);
    const legalCase = await updateManualCaseCore({
      actor: context.principal,
      caseId,
      body,
      request,
      requestId
    });
    return NextResponse.json(
      { data: legalCase, requestId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "admin.cases.detail", method: "PATCH" });
  }
}
