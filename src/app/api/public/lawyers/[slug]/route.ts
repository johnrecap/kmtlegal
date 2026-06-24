import { NextResponse } from "next/server";
import { findBySlug, lawyers } from "@/content/public-content";
import { jsonError } from "@/server/http/errors";

type RouteProps = { params: { slug: string } };

export function GET(_request: Request, { params }: RouteProps) {
  const lawyer = findBySlug(lawyers, params.slug);
  if (!lawyer) return jsonError(404, "NOT_FOUND", "Lawyer profile was not found.");
  return NextResponse.json({ data: lawyer }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
