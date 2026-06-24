import { NextResponse } from "next/server";
import { bootstrapFirstSuperAdmin, installerBootstrapSchema, installerTokenFromRequest } from "@/server/install/installer-service";
import { errorToResponse, getRequestId } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonRequest(request, installerBootstrapSchema, "Installer bootstrap payload is invalid.");
    const user = await bootstrapFirstSuperAdmin({
      token: installerTokenFromRequest(request),
      body,
      request
    });

    return NextResponse.json({ data: { user }, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
