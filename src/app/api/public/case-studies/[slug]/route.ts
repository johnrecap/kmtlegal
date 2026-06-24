import { NextResponse } from "next/server";
import { jsonError } from "@/server/http/errors";
import { getPublishedCaseStudyBySlug } from "@/server/public/content-service";

type RouteProps = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteProps) {
  const study = await getPublishedCaseStudyBySlug(params.slug);
  if (!study) return jsonError(404, "NOT_FOUND", "Case study was not found.");
  return NextResponse.json({ data: study }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
