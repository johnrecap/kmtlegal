import { describe, expect, it } from "vitest";
import {
  assertClientPortalAccess,
  clientVisibleDocumentWhere,
  ownCaseWhere,
  ownClientWhere,
  portalProfileUpdateSchema
} from "@/server/portal/client-portal-service";
import { clientPortalGuardIssue } from "@/server/auth/client-portal-guard";
import type { AuthContext } from "@/server/auth/session-store";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const clientPrincipal: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.client,
  permissions: ["client.read.self", "case.read.own", "document.read.own", "payment.read.own"],
  clientId: "22222222-2222-4222-8222-222222222222"
};

const staffPrincipal: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.officeAdmin,
  permissions: ["client.read.any"]
};

function authContextForPrincipal(principal: Principal): AuthContext {
  return {
    sessionId: "44444444-4444-4444-8444-444444444444",
    sessionStatus: "ACTIVE",
    twoFactorAttemptCount: 0,
    twoFactorLockedUntil: null,
    principal,
    user: {
      id: principal.id,
      name: "Portal Test",
      email: "portal@example.com",
      phone: null,
      passwordHash: "hash",
      locale: "ar",
      status: "ACTIVE",
      roleId: "55555555-5555-4555-8555-555555555555",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      deletedAt: null,
      role: {
        id: "55555555-5555-4555-8555-555555555555",
        name: principal.roleName,
        description: null,
        status: "ACTIVE",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        permissions: []
      },
      clientProfile: principal.clientId
        ? {
            id: principal.clientId,
            userId: principal.id,
            fullName: "Portal Test",
            phone: "+201000000000",
            phoneCanonical: "201000000000",
            email: "portal@example.com",
            city: null,
            source: "MANUAL",
            status: "ACTIVE",
            assignedLawyerId: null,
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
            deletedAt: null
          }
        : null,
      twoFactorCredential: null
    }
  };
}

describe("client portal access contract", () => {
  it("requires client self permission and a linked client profile", () => {
    expect(assertClientPortalAccess(clientPrincipal)).toBe(clientPrincipal.clientId);

    try {
      assertClientPortalAccess(staffPrincipal);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("returns a recoverable portal guard issue for unlinked client accounts", () => {
    expect(clientPortalGuardIssue(authContextForPrincipal(clientPrincipal))).toBeNull();

    const unlinkedClient = authContextForPrincipal({
      ...clientPrincipal,
      clientId: null
    });
    expect(clientPortalGuardIssue(unlinkedClient)).toEqual({
      title: "حساب العميل غير مكتمل",
      description: "حساب الدخول غير مرتبط بملف عميل داخل المكتب. تواصل مع السكرتارية لتفعيل ربط الحساب بملفك قبل فتح البوابة."
    });

    const staffIssue = clientPortalGuardIssue(authContextForPrincipal(staffPrincipal));
    expect(staffIssue?.title).toBe("غير مسموح بالدخول إلى بوابة العميل");
  });

  it("builds ownership filters for client profile and cases", () => {
    expect(ownClientWhere(clientPrincipal)).toEqual({
      id: clientPrincipal.clientId,
      userId: clientPrincipal.id
    });

    expect(ownCaseWhere(clientPrincipal, "44444444-4444-4444-8444-444444444444")).toEqual({
      clientId: clientPrincipal.clientId,
      deletedAt: null,
      id: "44444444-4444-4444-8444-444444444444"
    });
  });

  it("restricts portal document listings to client-visible owned or case documents", () => {
    expect(clientVisibleDocumentWhere(clientPrincipal.clientId!)).toEqual({
      deletedAt: null,
      visibility: "CLIENT_VISIBLE",
      OR: [{ ownerClientId: clientPrincipal.clientId }, { case: { clientId: clientPrincipal.clientId } }]
    });
  });

  it("validates editable profile fields only", () => {
    const parsed = portalProfileUpdateSchema.parse({
      fullName: "أحمد منصور",
      phone: "+201000000000",
      email: "",
      city: "القاهرة"
    });

    expect(parsed.fullName).toBe("أحمد منصور");
    expect(parsed.email).toBe("");
    expect(() => portalProfileUpdateSchema.parse({ fullName: "أ", phone: "1" })).toThrow();
  });
});
