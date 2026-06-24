import { NextResponse } from "next/server";
import { lawyers } from "@/content/public-content";

export function GET() {
  return NextResponse.json({ data: lawyers }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
