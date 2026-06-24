import { NextResponse } from "next/server";
import { listPublishedCaseStudies } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const caseStudies = await listPublishedCaseStudies();
  return NextResponse.json({ data: caseStudies }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
