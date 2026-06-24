import { NextResponse } from "next/server";
import { legalServices } from "@/content/public-content";

export function GET() {
  return publicJson(legalServices);
}

function publicJson(data: unknown) {
  return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
