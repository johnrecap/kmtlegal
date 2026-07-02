import { NextResponse } from "next/server";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";
import { getPublishedCaseStudyBySlug } from "@/server/public/content-service";

type RouteProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteProps) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const { slug } = await params;
  const study = await getPublishedCaseStudyBySlug(locale, slug);
  if (!study) return jsonError(404, "NOT_FOUND", "Case study was not found.", undefined, undefined, { locale });
  return NextResponse.json({ data: study }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
