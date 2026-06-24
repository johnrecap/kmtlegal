import { NextResponse } from "next/server";
import { getAdminCaseDetail } from "@/server/admin/case-operations-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type CaseRouteProps = {
  params: {
    caseId: string;
  };
};

export async function GET(request: Request, { params }: CaseRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const legalCase = await getAdminCaseDetail({
      actor: context.principal,
      caseId: params.caseId
    });

    return NextResponse.json({ data: legalCase, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
