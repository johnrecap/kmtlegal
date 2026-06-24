import { NextResponse } from "next/server";
import { z } from "zod";
import { getIpAddress } from "@/server/auth/session-store";
import { sendTemplatedEmail } from "@/server/email";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema, parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const contactRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  topic: z.enum(["consultation", "documents", "media", "other"]),
  message: z.string().trim().min(10).max(2000),
  consent: z.literal(true)
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, contactRequestSchema, "بيانات نموذج التواصل غير مكتملة.");
    enforceRateLimit(rateLimiters.contact, `${body.email}:${getIpAddress(request) ?? "unknown"}`);

    await sendTemplatedEmail({
      to: { email: process.env.SMTP_FROM || "contact@kmtlegal.com" },
      templateKey: "staff_notification",
      data: {
        title: `رسالة تواصل جديدة من ${body.fullName}`,
        summary: `الموضوع: ${body.topic}\nالبريد: ${body.email}\nالهاتف: ${body.phone || "غير مذكور"}\n\n${body.message}`
      }
    });

    return NextResponse.json(
      {
        status: "received",
        requestId
      },
      {
        status: 202,
        headers: { "Cache-Control": "no-store" }
      }
    );
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
