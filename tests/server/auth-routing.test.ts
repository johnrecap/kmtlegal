import { describe, expect, it } from "vitest";
import {
  canRoleOpenPath,
  defaultSignedInPath,
  isProtectedAppPath,
  loginUrlForProtectedPath,
  sanitizeNextPath,
  signedInRedirectPath,
  staffRoleNames
} from "@/lib/auth-routing";
import { getSessionTokenFromCookieHeader } from "@/server/auth/session-store";
import { isStaffRole, ROLES } from "@/server/auth/policy";

describe("auth route protection contract", () => {
  it("keeps client and staff redirects inside their own surfaces", () => {
    expect(defaultSignedInPath(ROLES.client)).toBe("/client");
    expect(defaultSignedInPath(ROLES.lawyer)).toBe("/admin");
    expect(signedInRedirectPath(ROLES.client, null)).toBe("/client");
    expect(signedInRedirectPath(ROLES.officeAdmin, undefined)).toBe("/admin");
    expect(signedInRedirectPath(ROLES.client, "/")).toBe("/client");
    expect(signedInRedirectPath(ROLES.officeAdmin, "/")).toBe("/admin");
    expect(signedInRedirectPath(ROLES.officeAdmin, "/login")).toBe("/admin");
    expect(signedInRedirectPath(ROLES.client, "/admin")).toBe("/client");
    expect(signedInRedirectPath(ROLES.lawyer, "/portal")).toBe("/admin");
    expect(signedInRedirectPath(ROLES.superAdmin, "/admin/cases")).toBe("/admin/cases");
  });

  it("rejects unsafe next paths", () => {
    expect(sanitizeNextPath("https://example.com", "/portal")).toBe("/portal");
    expect(sanitizeNextPath("//example.com", "/portal")).toBe("/portal");
    expect(sanitizeNextPath("/api/auth/me", "/portal")).toBe("/portal");
    expect(sanitizeNextPath("/portal/cases", "/portal")).toBe("/portal/cases");
  });

  it("detects protected app prefixes for middleware", () => {
    expect(isProtectedAppPath("/admin")).toBe(true);
    expect(isProtectedAppPath("/admin/clients")).toBe(true);
    expect(isProtectedAppPath("/client")).toBe(true);
    expect(isProtectedAppPath("/client/files")).toBe(true);
    expect(isProtectedAppPath("/portal")).toBe(true);
    expect(isProtectedAppPath("/portal/documents")).toBe(true);
    expect(isProtectedAppPath("/services")).toBe(false);
  });

  it("builds an internal login redirect URL for protected paths", () => {
    const url = loginUrlForProtectedPath("http://localhost:3000", "/admin/clients", "?status=active");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/admin/clients?status=active");
  });

  it("matches role policy staff roles", () => {
    expect(staffRoleNames.every((role) => isStaffRole(role))).toBe(true);
    expect(canRoleOpenPath(ROLES.client, "/client/files")).toBe(true);
    expect(canRoleOpenPath(ROLES.client, "/portal/documents")).toBe(true);
    expect(canRoleOpenPath(ROLES.client, "/admin")).toBe(false);
    expect(canRoleOpenPath(ROLES.officeAdmin, "/admin/consultations")).toBe(true);
    expect(canRoleOpenPath(ROLES.officeAdmin, "/portal")).toBe(false);
  });

  it("extracts opaque session tokens from cookie headers", () => {
    expect(getSessionTokenFromCookieHeader("theme=light; kmt_session=abc%20123; locale=ar")).toBe("abc 123");
    expect(getSessionTokenFromCookieHeader("theme=light")).toBeNull();
  });
});
