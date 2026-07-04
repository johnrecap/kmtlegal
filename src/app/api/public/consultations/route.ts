import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { getIpAddress } from "@/server/auth/session-store";
import { assertManualReviewBookingEnabled } from "@/server/consultations/consultation-booking-settings";
import { createPublicConsultation, publicConsultationRequestSchema } from "@/server/consultations/consultation-service";
import { ApiError, errorToResponse, getRequestId } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const locale = localeFromSearchParams(new URL(request.url).searchParams);

  try {
    const body = await parseJsonRequest(
      request,
      publicConsultationRequestSchema,
      locale === "ar" ? "بيانات طلب الاستشارة غير مكتملة." : "Consultation request data is incomplete."
    );
    await assertManualReviewBookingEnabled();
    enforceRateLimit(rateLimiters.booking, `${canonicalPhone(body.phone) ?? body.phone}:${body.email || "no-email"}:${getIpAddress(request) ?? "unknown"}`);

    try {
      const consultation = await createPublicConsultation({ body, request, requestId, organizerMode: "manual" });
      return NextResponse.json(
        {
          data: consultation,
          requestId
        },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" }
        }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        locale === "ar"
          ? "تعذر حفظ طلب الاستشارة الآن. تأكد من تشغيل قاعدة البيانات وحاول مرة أخرى."
          : "We could not save the consultation request right now. Please try again shortly."
      );
    }
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "public.consultations", method: "POST", locale });
  }
}
