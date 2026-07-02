import { NextResponse } from "next/server";
import { getPublicContent } from "@/content/public-content";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";

type RouteProps = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const { slug } = await params;
  const lawyer = getPublicContent(locale).lawyers.find((item) => item.slug === slug);
  if (!lawyer) return jsonError(404, "NOT_FOUND", "Lawyer profile was not found.", undefined, undefined, { locale });
  return NextResponse.json({ data: lawyer }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
