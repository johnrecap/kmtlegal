import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { listPublishedArticles } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const articles = await listPublishedArticles(locale);
  return NextResponse.json({ data: articles }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
