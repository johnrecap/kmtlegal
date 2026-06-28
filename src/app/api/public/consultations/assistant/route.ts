import { NextResponse } from "next/server";
import { handlePublicConsultationAssistant, publicConsultationAssistantSchema } from "@/server/consultations/consultation-assistant-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, publicConsultationAssistantSchema, "Consultation assistant payload is invalid.");
    const result = await handlePublicConsultationAssistant({ body, request, requestId });
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
