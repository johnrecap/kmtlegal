import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithPassword } from "@/server/auth/auth-service";
import { setSessionCookie } from "@/server/auth/session";
import { getIpAddress } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { emailSchema, parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256)
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, loginSchema, "Email and password are required.");
    enforceRateLimit(rateLimiters.login, `${body.email}:${getIpAddress(request) ?? "unknown"}`);

    const result = await loginWithPassword({
      email: body.email,
      password: body.password,
      request
    });

    if (!result) {
      return jsonError(401, "UNAUTHENTICATED", "Invalid email or password.", requestId);
    }

    const response = NextResponse.json(
      {
        status: result.status,
        user: result.user,
        permissions: result.status === "authenticated" ? result.permissions : undefined
      },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
    setSessionCookie(response, result.token);
    return response;
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
