import { NextResponse } from "next/server";
import { adminSocialDraftWriteSchema, getAdminSocialDraftDetail, updateAdminSocialDraft } from "@/server/admin/content-social-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type SocialDraftRouteProps = {
  params: {
    draftId: string;
  };
};

export async function GET(request: Request, { params }: SocialDraftRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const draft = await getAdminSocialDraftDetail({ actor: context.principal, draftId: params.draftId });

    return NextResponse.json({ data: draft, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: SocialDraftRouteProps) {
  const requestId = getRequestId(request);

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminSocialDraftWriteSchema, "Social draft payload is invalid.");
    const draft = await updateAdminSocialDraft({ actor: context.principal, draftId: params.draftId, body, request });

    return NextResponse.json({ data: draft, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
