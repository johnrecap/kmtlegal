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
        checkedAt: report.checkedAt,
        checks: report.checks
      },
      requestId
    },
    {
      status,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
