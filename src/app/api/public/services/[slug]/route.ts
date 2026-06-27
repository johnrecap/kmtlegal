import { NextResponse } from "next/server";
import { getPublicContent } from "@/content/public-content";
import { localeFromSearchParams } from "@/lib/public-locale";
import { jsonError } from "@/server/http/errors";

type RouteProps = { params: { slug: string } };

export function GET(request: Request, { params }: RouteProps) {
  const locale = localeFromSearchParams(new URL(request.url).searchParams);
  const service = getPublicContent(locale).legalServices.find((item) => item.slug === params.slug);
  if (!service) return jsonError(404, "NOT_FOUND", "Service was not found.", undefined, undefined, { locale });
  return NextResponse.json({ data: service }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
