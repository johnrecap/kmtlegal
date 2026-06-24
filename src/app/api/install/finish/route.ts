import { NextResponse } from "next/server";
import { finishInstaller, installerTokenFromRequest } from "@/server/install/installer-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const result = await finishInstaller({
      token: installerTokenFromRequest(request),
      request
    });

    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
