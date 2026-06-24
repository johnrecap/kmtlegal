import { NextResponse } from "next/server";
import { listPublishedArticles } from "@/server/public/content-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await listPublishedArticles();
  return NextResponse.json({ data: articles }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
