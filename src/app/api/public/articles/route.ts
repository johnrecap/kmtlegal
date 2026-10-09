import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";
import { listPublishedArticleCards } from "@/server/public/content-service";
import { publicExpansion } from "@/content/public-expansion";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  try {
    if (!process.env.DATABASE_URL) throw new Error("PUBLIC_CONTENT_UNAVAILABLE");
    const data = await listPublishedArticleCards(locale);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(503, "SERVICE_UNAVAILABLE", publicExpansion[locale].unavailableDescription, undefined, undefined, { locale });
  }
}
