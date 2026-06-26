import { NextResponse } from "next/server";
import { getApplicationReadiness } from "@/server/health/runtime-readiness";
import { getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const report = await getApplicationReadiness();
  const status = report.ready ? 200 : 503;

  return NextResponse.json(
    {
      data: {
        status: report.ready ? "ready" : "blocked",
        deployment: {
          environment: process.env.APP_ENV || process.env.NODE_ENV || "unknown",
          release: process.env.APP_RELEASE || null
        },
        checkedAt: report.checkedAt,
        checks: report.checks
      },
      requestId
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-App-Release": process.env.APP_RELEASE || "unknown"
      }
    }
  );
}
