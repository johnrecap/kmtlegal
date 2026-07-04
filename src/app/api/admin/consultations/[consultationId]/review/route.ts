import { NextResponse } from "next/server";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";
import { reviewConsultation, reviewConsultationSchema } from "@/server/admin/consultation-review-service";

export const dynamic = "force-dynamic";

type ConsultationReviewRouteProps = {
  params: Promise<{
    consultationId: string;
  }>;
};

export async function POST(request: Request, { params }: ConsultationReviewRouteProps) {
  const requestId = getRequestId(request);
  const { consultationId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, reviewConsultationSchema, "Review payload is invalid.");
    const result = await reviewConsultation({
      actor: context.principal,
      consultationId,
      body,
      request,
      requestId
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
