import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";
import { getPublishedArticleBySlug } from "@/server/public/content-service";

type RouteProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteProps) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(locale, slug);
  if (!article) return jsonError(404, "NOT_FOUND", "Article was not found.", undefined, undefined, { locale });
  return NextResponse.json({ data: article }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
