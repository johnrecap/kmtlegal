import { NextResponse } from "next/server";
import {
  createPublicConsultationCheckout,
  publicConsultationCheckoutSchema
} from "@/server/consultations/consultation-assistant-service";
import { assertPaidChatBookingEnabled } from "@/server/consultations/consultation-booking-settings";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let locale: "ar" | "en" | undefined;

  try {
    const body = await parseJsonRequest(request, publicConsultationCheckoutSchema, "Consultation checkout payload is invalid.");
    locale = body.locale;
    await assertPaidChatBookingEnabled();
    const result = await createPublicConsultationCheckout({ body, request, requestId });
    return NextResponse.json({ data: result, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "public-consultation-checkout", method: "POST", locale });
  }
}
