import { NextResponse } from "next/server";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { getAdminConsultationDetail } from "@/server/admin/consultation-review-service";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

type ConsultationRouteProps = {
  params: {
    consultationId: string;
  };
};

export async function GET(request: Request, { params }: ConsultationRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const consultation = await getAdminConsultationDetail({
      actor: context.principal,
      consultationId: params.consultationId
    });

    return NextResponse.json({ data: consultation, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
