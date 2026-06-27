import { NextResponse } from "next/server";
import { getPublicContent } from "@/content/public-content";
import { localeFromSearchParams } from "@/lib/public-locale";

export function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  return publicJson(getPublicContent(locale).legalServices);
}

function publicJson(data: unknown) {
  return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
