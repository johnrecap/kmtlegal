import { NextResponse } from "next/server";
import { scheduleConsultationInputSchema } from "@/server/admin/consultation-outcome-service";
import { scheduleConsultation } from "@/server/admin/consultation-review-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ConsultationScheduleRouteProps = {
  params: Promise<{ consultationId: string }>;
};

export async function POST(request: Request, { params }: ConsultationScheduleRouteProps) {
  const requestId = getRequestId(request);
  const { consultationId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(
      request,
      scheduleConsultationInputSchema,
      "Consultation schedule payload is invalid."
    );
    const result = await scheduleConsultation({
      actor: context.principal,
      consultationId,
      body,
      request,
      requestId
    });
    return NextResponse.json(
      { data: result, requestId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
