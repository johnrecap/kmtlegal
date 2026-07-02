import { NextResponse } from "next/server";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { rejectConsultation, rejectConsultationSchema } from "@/server/admin/consultation-review-service";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ConsultationActionRouteProps = {
  params: Promise<{
    consultationId: string;
  }>;
};

export async function POST(request: Request, { params }: ConsultationActionRouteProps) {
  const requestId = getRequestId(request);
  const { consultationId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, rejectConsultationSchema, "Reject payload is invalid.");
    const consultation = await rejectConsultation({
      actor: context.principal,
      consultationId,
      body,
      request
    });

    return NextResponse.json({ data: consultation, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
