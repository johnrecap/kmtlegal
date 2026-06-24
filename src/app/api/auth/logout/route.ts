import { NextResponse } from "next/server";
import { logoutByRequest } from "@/server/auth/auth-service";
import { clearSessionCookie } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await logoutByRequest(request);
  const response = wantsHtmlRedirect(request)
    ? NextResponse.redirect(new URL("/login?reason=logged_out", redirectOriginForRequest(request)), { status: 303 })
    : NextResponse.json({ status: "logged_out" });
  clearSessionCookie(response);
  return response;
}

function wantsHtmlRedirect(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function redirectOriginForRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }

  return new URL(request.url).origin;
}
