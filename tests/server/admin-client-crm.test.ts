import { describe, expect, it } from "vitest";
import {
  adminClientListQuerySchema,
  adminClientWriteSchema,
  archiveClientSchema,
  assignClientSchema,
  assertClientProfileCanBeCreatedForUser,
  canManageClientAccounts,
  canListAdminClients,
  canManageAdminClients,
  canReadAdminClient,
  clientAccountCreateSchema,
  clientAccountPasswordSchema,
  clientScopeWhereForPrincipal
} from "@/server/admin/client-crm-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { adminCaseListQuerySchema, adminCalendarQuerySchema, calendarWindow } from "@/server/admin/case-operations-service";
import { adminConsultationListQuerySchema } from "@/server/admin/consultation-review-service";

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

const secretary: Principal = {
  id: "55555555-5555-4555-8555-555555555555",
  roleName: ROLES.secretary,
  permissions: ["client.read.any", "client.update.any", "client.account.manage"]
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
    expect(canListAdminClients(secretary)).toBe(true);
    expect(canManageAdminClients(secretary)).toBe(true);
    expect(canManageClientAccounts(secretary)).toBe(true);
    expect(canManageClientAccounts(lawyer)).toBe(false);
  });

  it("checks single-client read ownership before rendering detail", () => {
    expect(canReadAdminClient(officeAdmin, { assignedLawyerId: null })).toBe(true);
    expect(canReadAdminClient(lawyer, { assignedLawyerId: lawyer.id })).toBe(true);
    expect(canReadAdminClient(lawyer, { assignedLawyerId: officeAdmin.id })).toBe(false);
    expect(canReadAdminClient({id:"client-user",roleName:ROLES.client,permissions:["client.read.self"]}, {userId:"client-user"})).toBe(false);
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
    expect(() => adminClientWriteSchema.parse({ ...payload, status: "ARCHIVED" })).toThrow();
  });

  it("accepts client-scoped related-list filters while retaining the calendar's exclusive Cairo end boundary", () => {
    const clientId = "77777777-7777-4777-8777-777777777777";
    const caseId = "88888888-8888-4888-8888-888888888888";
    expect(adminCaseListQuerySchema.parse({ clientId }).clientId).toBe(clientId);
    expect(adminConsultationListQuerySchema.parse({ clientId }).clientId).toBe(clientId);
    const calendarQuery = adminCalendarQuerySchema.parse({
      clientId,
      caseId,
      anchor: "2026-09-22",
      from: "2026-09-22",
      to: "2026-09-23"
    });
    expect(calendarQuery.clientId).toBe(clientId);
    expect(calendarQuery.caseId).toBe(caseId);
    expect(calendarWindow(calendarQuery).to.getTime()).toBeGreaterThan(calendarWindow(calendarQuery).from.getTime());
  });

  it("validates assignment and archive action payloads", () => {
    expect(assignClientSchema.parse({ assignedLawyerId: "" }).assignedLawyerId).toBe("");
    expect(
      assignClientSchema.parse({ assignedLawyerId: "44444444-4444-4444-8444-444444444444" }).assignedLawyerId
    ).toBe("44444444-4444-4444-8444-444444444444");
    expect(archiveClientSchema.parse({ reason: "duplicate record", confirmArchive: true }).reason).toBe("duplicate record");
    expect(() => archiveClientSchema.parse({ reason: "duplicate record" })).toThrow();
  });

  it("validates client portal account payloads separately from staff user creation", () => {
    const account = clientAccountCreateSchema.parse({
      email: "client.portal@example.com",
      password: "LongEnoughPassword1",
      locale: "ar"
    });
    expect(account.email).toBe("client.portal@example.com");
    expect(account.locale).toBe("ar");
    expect(() => clientAccountCreateSchema.parse({ email: "bad", password: "short" })).toThrow();

    expect(clientAccountPasswordSchema.parse({ password: "AnotherLongPassword1", revokeSessions: "true" }).revokeSessions).toBe(true);
  });

  it("allows CRM profile creation only for unlinked Client role accounts", () => {
    expect(() =>
      assertClientProfileCanBeCreatedForUser({
        role: { name: ROLES.client },
        status: "ACTIVE",
        phone: "+201000000000",
        clientProfile: null
      })
    ).not.toThrow();

    expect(() =>
      assertClientProfileCanBeCreatedForUser({
        role: { name: ROLES.officeAdmin },
        status: "ACTIVE",
        phone: "+201000000000",
        clientProfile: null
      })
    ).toThrow(ApiError);

    expect(() =>
      assertClientProfileCanBeCreatedForUser({
        role: { name: ROLES.client },
        status: "ACTIVE",
        phone: "+201000000000",
        clientProfile: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }
      })
    ).toThrow(ApiError);

    expect(() =>
      assertClientProfileCanBeCreatedForUser({
        role: { name: ROLES.client },
        status: "ACTIVE",
        phone: "",
        clientProfile: null
      })
    ).toThrow(ApiError);
  });
});
