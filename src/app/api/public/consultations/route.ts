import { NextResponse } from "next/server";
import { getIpAddress } from "@/server/auth/session-store";
import { createPublicConsultation, publicConsultationRequestSchema } from "@/server/consultations/consultation-service";
import { ApiError, errorToResponse, getRequestId } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, publicConsultationRequestSchema, "بيانات طلب الاستشارة غير مكتملة.");
    enforceRateLimit(rateLimiters.booking, `${body.phone}:${body.email || "no-email"}:${getIpAddress(request) ?? "unknown"}`);

    try {
      const consultation = await createPublicConsultation({ body, request, requestId });
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
      throw new ApiError(503, "SERVICE_UNAVAILABLE", "تعذر حفظ طلب الاستشارة الآن. تأكد من تشغيل قاعدة البيانات وحاول مرة أخرى.");
    }
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
