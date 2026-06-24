import { NextResponse } from "next/server";
import { adminSocialAiDraftSchema, createAiSocialDraft } from "@/server/admin/content-social-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminSocialAiDraftSchema, "AI social draft payload is invalid.");
    const result = await createAiSocialDraft({ actor: context.principal, body, request });

    return NextResponse.json({ data: result, requestId }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
