import { NextResponse } from "next/server";
import { findBySlug, legalServices } from "@/content/public-content";
import { jsonError } from "@/server/http/errors";

type RouteProps = { params: { slug: string } };

export function GET(_request: Request, { params }: RouteProps) {
  const service = findBySlug(legalServices, params.slug);
  if (!service) return jsonError(404, "NOT_FOUND", "Service was not found.");
  return NextResponse.json({ data: service }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
