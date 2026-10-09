import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";
import { getPublishedArticleBySlug } from "@/server/public/content-service";
import { publicExpansion } from "@/content/public-expansion";

export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const { slug } = await context.params;
  try {
    if (!process.env.DATABASE_URL) throw new Error("PUBLIC_CONTENT_UNAVAILABLE");
    const data = await getPublishedArticleBySlug(locale, slug);
    if (!data) return jsonError(404, "NOT_FOUND", "Article was not found.", undefined, undefined, { locale });
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(503, "SERVICE_UNAVAILABLE", publicExpansion[locale].unavailableDescription, undefined, undefined, { locale });
  }
}
