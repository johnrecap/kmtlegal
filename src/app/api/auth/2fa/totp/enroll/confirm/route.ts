import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmTotpEnrollment } from "@/server/auth/totp-enrollment-service";
import { isStaffTwoFactorEnabled } from "@/server/auth/two-factor";
import { getIpAddress } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const confirmSchema = z.object({
  code: z.string().trim().min(6).max(16)
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    await enforceRateLimit(rateLimiters.twoFactor, `totp-enroll-confirm:${getIpAddress(request) ?? "unknown"}`);
    if (!isStaffTwoFactorEnabled()) {
      return jsonError(503, "FEATURE_DISABLED", "TOTP is deferred and disabled in this release.", requestId);
    }
    const body = await parseJsonRequest(request, confirmSchema, "A verification code is required.");
    const result = await confirmTotpEnrollment(request, body.code);
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
