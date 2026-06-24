import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

export function getSessionExpiresAt(now = new Date()) {
  return new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
}

export function shouldUseSecureCookie() {
  if (process.env.SESSION_COOKIE_SECURE === "true") {
    return true;
  }
  if (process.env.SESSION_COOKIE_SECURE === "false") {
    return false;
  }
  return process.env.NODE_ENV === "production";
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0
  });
}
