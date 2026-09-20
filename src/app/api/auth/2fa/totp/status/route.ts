import { NextResponse } from "next/server";
import { totpEnrollmentStatus } from "@/server/auth/totp-enrollment-service";
import { isStaffTwoFactorEnabled } from "@/server/auth/two-factor";
import { getIpAddress } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  try {
    await enforceRateLimit(rateLimiters.twoFactor, `totp-status:${getIpAddress(request) ?? "unknown"}`);
    if (!isStaffTwoFactorEnabled()) {
      return jsonError(503, "FEATURE_DISABLED", "TOTP is deferred and disabled in this release.", requestId);
    }
    const result = await totpEnrollmentStatus(request);
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
