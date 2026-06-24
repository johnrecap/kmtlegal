import { NextResponse } from "next/server";
import { adminCaseStudyWriteSchema, getAdminCaseStudyDetail, updateAdminCaseStudy } from "@/server/admin/content-social-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type CaseStudyRouteProps = {
  params: {
    caseStudyId: string;
  };
};

export async function GET(request: Request, { params }: CaseStudyRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const study = await getAdminCaseStudyDetail({ actor: context.principal, caseStudyId: params.caseStudyId });

    return NextResponse.json({ data: study, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: CaseStudyRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminCaseStudyWriteSchema, "Case study payload is invalid.");
    const study = await updateAdminCaseStudy({ actor: context.principal, caseStudyId: params.caseStudyId, body, request });

    return NextResponse.json({ data: study, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
