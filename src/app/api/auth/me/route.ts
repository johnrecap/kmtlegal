import { NextResponse } from "next/server";
import { getAuthContextFromRequest, safeUser } from "@/server/auth/session-store";
import { getRequestId, jsonError } from "@/server/http/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await getAuthContextFromRequest(request);
  if (!context) {
    return jsonError(401, "UNAUTHENTICATED", "Authentication required.", getRequestId(request));
  }

  return NextResponse.json(
    {
      user: safeUser(context.user),
      permissions: context.principal.permissions ?? []
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
