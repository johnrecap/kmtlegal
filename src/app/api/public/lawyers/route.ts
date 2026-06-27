import { NextResponse } from "next/server";
import { getPublicContent } from "@/content/public-content";
import { localeFromSearchParams } from "@/lib/public-locale";

export function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  return NextResponse.json({ data: getPublicContent(locale).lawyers }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
