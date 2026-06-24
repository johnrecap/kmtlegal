import { describe, expect, it } from "vitest";
import {
  adminClientListQuerySchema,
  adminClientWriteSchema,
  archiveClientSchema,
  assignClientSchema,
  canListAdminClients,
  canManageAdminClients,
  canReadAdminClient,
  clientScopeWhereForPrincipal
} from "@/server/admin/client-crm-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const officeAdmin: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["client.read.any", "client.update.any"]
};

const lawyer: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.lawyer,
  permissions: ["client.read.assigned"]
};

const marketing: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.marketingStaff,
  permissions: ["content.create.any"]
};

describe("admin client CRM contract", () => {
  it("scopes CRM reads by any or assigned-client permission", () => {
    expect(clientScopeWhereForPrincipal(officeAdmin)).toEqual({ deletedAt: null });
    expect(clientScopeWhereForPrincipal(lawyer)).toEqual({ deletedAt: null, assignedLawyerId: lawyer.id });

    try {
      clientScopeWhereForPrincipal(marketing);
      throw new Error("expected permission failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("separates CRM read and write capabilities", () => {
    expect(canListAdminClients(officeAdmin)).toBe(true);
    expect(canManageAdminClients(officeAdmin)).toBe(true);
    expect(canListAdminClients(lawyer)).toBe(true);
    expect(canManageAdminClients(lawyer)).toBe(false);
    expect(canListAdminClients(marketing)).toBe(false);
  });

  it("checks single-client read ownership before rendering detail", () => {
    expect(canReadAdminClient(officeAdmin, { assignedLawyerId: null })).toBe(true);
    expect(canReadAdminClient(lawyer, { assignedLawyerId: lawyer.id })).toBe(true);
    expect(canReadAdminClient(lawyer, { assignedLawyerId: officeAdmin.id })).toBe(false);
  });

  it("validates CRM list filters and write payloads", () => {
    const query = adminClientListQuerySchema.parse({
      q: "ahmed",
      status: "ACTIVE",
      source: "consultation",
      sortBy: "updatedAt",
      sortDirection: "asc",
      page: "2"
    });

    expect(query.page).toBe(2);
    expect(query.status).toBe("ACTIVE");
    expect(query.sortBy).toBe("updatedAt");

    const payload = adminClientWriteSchema.parse({
      fullName: "أحمد منصور",
      phone: "+201000000000",
      email: "",
      city: "القاهرة",
      source: "manual",
      status: "LEAD",
      assignedLawyerId: ""
    });

    expect(payload.email).toBe("");
    expect(payload.status).toBe("LEAD");
    expect(() => adminClientWriteSchema.parse({ fullName: "أ", phone: "1", status: "DELETED" })).toThrow();
  });

  it("validates assignment and archive action payloads", () => {
    expect(assignClientSchema.parse({ assignedLawyerId: "" }).assignedLawyerId).toBe("");
    expect(
      assignClientSchema.parse({ assignedLawyerId: "44444444-4444-4444-8444-444444444444" }).assignedLawyerId
    ).toBe("44444444-4444-4444-8444-444444444444");
    expect(archiveClientSchema.parse({ reason: "duplicate record" }).reason).toBe("duplicate record");
  });
});
