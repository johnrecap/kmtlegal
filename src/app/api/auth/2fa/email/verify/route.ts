import { getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const response = jsonError(503, "FEATURE_DISABLED", "Email OTP fallback is disabled for this release.", requestId);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
