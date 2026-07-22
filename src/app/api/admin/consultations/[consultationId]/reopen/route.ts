import { NextResponse } from "next/server";
import {
  reopenConsultationInputSchema,
  reopenMissedConsultation
} from "@/server/admin/consultation-outcome-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ConsultationReopenRouteProps = {
  params: Promise<{ consultationId: string }>;
};

export async function POST(request: Request, { params }: ConsultationReopenRouteProps) {
  const requestId = getRequestId(request);
  const { consultationId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(
      request,
      reopenConsultationInputSchema,
      "Consultation reopen payload is invalid."
    );
    const result = await reopenMissedConsultation({
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
