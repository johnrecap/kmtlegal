import { NextResponse } from "next/server";
import { jsonError } from "@/server/http/errors";
import { getPublishedArticleBySlug } from "@/server/public/content-service";

type RouteProps = { params: { slug: string } };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteProps) {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) return jsonError(404, "NOT_FOUND", "Article was not found.");
  return NextResponse.json({ data: article }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
