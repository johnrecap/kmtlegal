import { NextResponse, type NextRequest } from "next/server";
import { isProtectedAppPath, loginUrlForProtectedPath } from "@/lib/auth-routing";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";
import { evaluateMutationOrigin, shouldUseStrictMutationOrigin } from "@/server/security/origin-guard";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/stitch-clone/") && isProductionRuntime() && process.env.ENABLE_STITCH_CLONE !== "true") {
    return new NextResponse("Stitch clone routes are disabled in production.", {
      status: 404,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  if (pathname.startsWith("/api/")) {
    const originDecision = evaluateMutationOrigin({
      method: request.method,
      requestUrl: request.url,
      originHeader: request.headers.get("origin"),
      refererHeader: request.headers.get("referer"),
      appOrigin: process.env.APP_ORIGIN,
      strictMissingOrigin: shouldUseStrictMutationOrigin()
    });

    if (!originDecision.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Cross-origin mutation is not allowed.",
            details: []
          }
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return NextResponse.next();
  }

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE_NAME)) {
    const response = NextResponse.redirect(loginUrlForProtectedPath(request.nextUrl.origin, pathname, search));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return NextResponse.next();
}

function isProductionRuntime() {
  return process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
