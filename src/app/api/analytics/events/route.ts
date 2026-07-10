import { NextResponse } from "next/server";
import { getAuthContextFromRequest, getIpAddress } from "@/server/auth/session-store";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { captureAnalyticsEventBestEffort, parseClientAnalyticsEvent } from "@/server/observability/analytics-service";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    await enforceRateLimit(rateLimiters.analytics, getIpAddress(request) ?? "unknown");
    const body = await request.json().catch(() => null);
    const event = parseClientAnalyticsEvent(body);
    const context = await getAuthContextFromRequest(request).catch(() => null);

    captureAnalyticsEventBestEffort({
      name: event.name,
      source: event.source,
      outcome: event.name.endsWith("_failed") ? "FAILURE" : "INFO",
      properties: event.properties,
      actor: context?.principal ?? null,
      requestId
    });

    return NextResponse.json({ data: { accepted: true }, requestId }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
