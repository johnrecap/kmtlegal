import { NextResponse, type NextRequest } from "next/server";
import { isProtectedAppPath, loginUrlForProtectedPath } from "@/lib/auth-routing";
import { SESSION_COOKIE_NAME } from "@/server/auth/constants";
import { evaluateMutationOrigin, shouldUseStrictMutationOrigin } from "@/server/security/origin-guard";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-kmt-login-locale",
      request.nextUrl.searchParams.get("locale") === "en" ? "en" : "ar"
    );
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  if (shouldApplyApiMutationOriginGuard(pathname, request.method)) {
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

export function shouldApplyApiMutationOriginGuard(pathname: string, method: string) {
  return pathname.startsWith("/api/") && !isTrustedPaymentWebhookMutation(pathname, method);
}

export function isTrustedPaymentWebhookMutation(pathname: string, method: string) {
  return method.toUpperCase() === "POST" && (pathname === "/api/webhooks/paytabs" || pathname === "/api/webhooks/paymob");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
