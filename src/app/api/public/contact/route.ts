import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { getIpAddress } from "@/server/auth/session-store";
import { createPublicContactMessage, publicContactMessageSchema } from "@/server/contact/contact-message-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";
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
      publicContactMessageSchema,
      locale === "ar" ? "بيانات نموذج التواصل غير مكتملة." : "Contact form data is incomplete."
    );
    enforceRateLimit(rateLimiters.contact, `${body.email}:${canonicalPhone(body.phone) ?? "no-phone"}:${getIpAddress(request) ?? "unknown"}`);

    const message = await createPublicContactMessage({
      body,
      request,
      requestId
    });

    return NextResponse.json(
      {
        data: message,
        requestId
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch (error) {
    return errorToResponse(error, requestId, { routeGroup: "public.contact", method: "POST", locale });
  }
}
