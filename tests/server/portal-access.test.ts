import { describe, expect, it } from "vitest";
import {
  assertClientPortalAccess,
  clientVisibleDocumentWhere,
  ownCaseWhere,
  ownClientWhere,
  portalProfileUpdateSchema
} from "@/server/portal/client-portal-service";
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
