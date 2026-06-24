import { NextResponse } from "next/server";
import { getInstallerStatus } from "@/server/install/installer-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const status = await getInstallerStatus();
    return NextResponse.json({ data: status, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
