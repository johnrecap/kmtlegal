import { NextResponse } from "next/server";
import { getInstallerPreflight, installerTokenFromRequest } from "@/server/install/installer-service";
import { installerPreflightSchema } from "@/server/install/panel-preflight";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { parseWithSchema } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = parseWithSchema(installerPreflightSchema, rawBody ?? {}, "Installer preflight payload is invalid.");
    const result = await getInstallerPreflight(installerTokenFromRequest(request), body);
    return NextResponse.json({ data: result, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
