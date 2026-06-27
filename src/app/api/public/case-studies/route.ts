import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { listPublishedCaseStudies } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const caseStudies = await listPublishedCaseStudies(locale);
  return NextResponse.json({ data: caseStudies }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
