import { jsonError, getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return jsonError(503, "FEATURE_DISABLED", "Staff 2FA reset is deferred and disabled in this release.", getRequestId(request));
}
