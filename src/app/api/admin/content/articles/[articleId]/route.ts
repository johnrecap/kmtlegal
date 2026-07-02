import { NextResponse } from "next/server";
import { adminArticleWriteSchema, getAdminArticleDetail, updateAdminArticle } from "@/server/admin/content-social-service";
import { getAuthContextFromRequest } from "@/server/auth/session-store";
import { errorToResponse, getRequestId, jsonError } from "@/server/http/errors";
import { parseJsonRequest } from "@/server/validation/schemas";

export const dynamic = "force-dynamic";

type ArticleRouteProps = {
  params: Promise<{
    articleId: string;
  }>;
};

export async function GET(request: Request, { params }: ArticleRouteProps) {
  const requestId = getRequestId(request);
  const { articleId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const article = await getAdminArticleDetail({ actor: context.principal, articleId });

    return NextResponse.json({ data: article, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}

export async function PATCH(request: Request, { params }: ArticleRouteProps) {
  const requestId = getRequestId(request);
  const { articleId } = await params;

  try {
    const context = await getAuthContextFromRequest(request);
    if (!context) {
      return jsonError(401, "UNAUTHENTICATED", "Authentication required.", requestId);
    }

    const body = await parseJsonRequest(request, adminArticleWriteSchema, "Article payload is invalid.");
    const article = await updateAdminArticle({ actor: context.principal, articleId, body, request });

    return NextResponse.json({ data: article, requestId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorToResponse(error, requestId);
  }
}
