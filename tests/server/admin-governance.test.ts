import { describe, expect, it } from "vitest";
import {
  adminAuditLogQuerySchema,
  adminSettingUpdateSchema,
  adminUserCreateSchema,
  adminUserListQuerySchema,
  adminUserPasswordUpdateSchema,
  adminUserUpdateSchema,
  canChangeAdminUserPassword,
  canCreateAdminUsers,
  canManageAdminSettings,
  canManageAdminUsers,
  canReadAdminAuditLog,
  settingDefinitions
} from "@/server/admin/governance-service";
import { auditActionOptionLabel, auditResourceLabel, toAdminAuditLogDto } from "@/server/audit/audit-event-catalog";
import { ROLES, type Principal } from "@/server/auth/policy";

const superAdmin: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.superAdmin,
  permissions: ["*"]
};

const officeAdmin: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.officeAdmin,
  permissions: ["client.read.any", "case.read.any", "task.manage.any"]
};

const governanceDelegate: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.officeAdmin,
  permissions: ["user.manage.any", "settings.manage.any", "audit.read.any"]
};

describe("admin governance contract", () => {
  it("keeps users, settings, and audit governance behind explicit permissions", () => {
    expect(canManageAdminUsers(superAdmin)).toBe(true);
    expect(canCreateAdminUsers(superAdmin)).toBe(true);
    expect(canChangeAdminUserPassword(superAdmin)).toBe(true);
    expect(canManageAdminSettings(superAdmin)).toBe(true);
    expect(canReadAdminAuditLog(superAdmin)).toBe(true);

    expect(canManageAdminUsers(governanceDelegate)).toBe(true);
    expect(canCreateAdminUsers(governanceDelegate)).toBe(false);
    expect(canChangeAdminUserPassword(governanceDelegate)).toBe(false);
    expect(canManageAdminSettings(governanceDelegate)).toBe(true);
    expect(canReadAdminAuditLog(governanceDelegate)).toBe(true);

    expect(canManageAdminUsers(officeAdmin)).toBe(false);
    expect(canCreateAdminUsers(officeAdmin)).toBe(false);
    expect(canChangeAdminUserPassword(officeAdmin)).toBe(false);
    expect(canManageAdminSettings(officeAdmin)).toBe(false);
    expect(canReadAdminAuditLog(officeAdmin)).toBe(false);
  });

  it("validates user list filters and role assignment payloads", () => {
    const query = adminUserListQuerySchema.parse({
      q: "office",
      status: "ACTIVE",
      sortBy: "email",
      sortDirection: "asc",
      page: "2",
      pageSize: "25"
    });

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(25);

    const payload = adminUserUpdateSchema.parse({
      name: "Office Admin",
      phone: "+201000000002",
      roleId: "44444444-4444-4444-8444-444444444444",
      status: "ACTIVE",
      locale: "ar"
    });

    expect(payload.status).toBe("ACTIVE");
    expect(() => adminUserUpdateSchema.parse({ name: "A", roleId: "bad", status: "ROOT", locale: "fr" })).toThrow();

    const createPayload = adminUserCreateSchema.parse({
      name: "New Staff",
      email: "staff@example.com",
      phone: "",
      roleId: "44444444-4444-4444-8444-444444444444",
      password: "LongEnoughPassword1",
      status: "ACTIVE",
      locale: "ar"
    });
    expect(createPayload.email).toBe("staff@example.com");
    expect(() =>
      adminUserCreateSchema.parse({
        name: "New Staff",
        email: "staff@example.com",
        roleId: "44444444-4444-4444-8444-444444444444",
        password: "short"
      })
    ).toThrow();

    expect(adminUserPasswordUpdateSchema.parse({ password: "LongEnoughPassword1", revokeSessions: "true" }).revokeSessions).toBe(true);
    expect(() => adminUserPasswordUpdateSchema.parse({ password: "short" })).toThrow();
  });

  it("keeps settings updates inside the documented allowlist", () => {
    expect(settingDefinitions.map((definition) => definition.key)).toEqual([
      "office.profile",
      "security.staff2fa",
      "storage.policy",
      "email.policy"
    ]);

    const storageSetting = adminSettingUpdateSchema.parse({
      key: "storage.policy",
      driver: "vps-filesystem",
      uploadsDir: "/var/lib/kmt-legal/uploads",
      maxUploadMb: "5",
      allowedTypes: "application/pdf,image/png"
    });
    expect(storageSetting.key).toBe("storage.policy");
    if (storageSetting.key === "storage.policy") {
      expect(storageSetting.maxUploadMb).toBe(5);
    }

    const securitySetting = adminSettingUpdateSchema.parse({
      key: "security.staff2fa",
      requiredForStaff: true,
      totpPrimary: true,
      emailOtpFallback: true,
      superAdminResetOnly: true
    });
    expect(securitySetting.key).toBe("security.staff2fa");
    if (securitySetting.key === "security.staff2fa") {
      expect(securitySetting.requiredForStaff).toBe(false);
      expect(securitySetting.totpPrimary).toBe(false);
      expect(securitySetting.superAdminResetOnly).toBe(true);
      expect(securitySetting.emailOtpFallback).toBe(false);
    }

    expect(() => adminSettingUpdateSchema.parse({ key: "smtp.secret", apiKey: "do-not-store" })).toThrow();
    expect(() =>
      adminSettingUpdateSchema.parse({
        key: "storage.policy",
        driver: "s3",
        uploadsDir: "/var/lib/kmt-legal/uploads",
        maxUploadMb: 10,
        allowedTypes: "application/pdf"
      })
    ).toThrow();
  });

  it("validates audit log search and bounded pagination", () => {
    const query = adminAuditLogQuerySchema.parse({
      q: "auth",
      actorId: "",
      action: "auth.2fa_reset",
      resourceType: "User",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-23",
      sortBy: "createdAt",
      sortDirection: "desc",
      pageSize: "80"
    });

    expect(query.action).toBe("auth.2fa_reset");
    expect(query.pageSize).toBe(80);
    expect(() => adminAuditLogQuerySchema.parse({ pageSize: "500" })).toThrow();
  });

  it("maps raw audit rows to client-friendly audit DTOs", () => {
    const dto = toAdminAuditLogDto({
      id: "audit-1",
      action: "finance.payment_create",
      resourceType: "Payment",
      resourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      createdAt: new Date("2026-06-25T12:00:00.000Z"),
      actor: { name: "ahmed", role: { name: "Super Admin" } },
      metadata: {
        invoiceNumber: "INV-2026-0004",
        amount: "10000",
        currency: "EGP",
        clientId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        caseId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        password: "[REDACTED]"
      }
    });

    expect(dto.event.label).toBe("تم إنشاء فاتورة");
    expect(dto.event.category).toBe("المالية");
    expect(dto.actor).toEqual({ name: "ahmed", role: "Super Admin" });
    expect(dto.summary).toContain("تم إنشاء فاتورة");
    expect(dto.details).toContainEqual({ label: "رقم الفاتورة", value: "INV-2026-0004" });
    expect(JSON.stringify(dto.details)).not.toContain("clientId");
    expect(JSON.stringify(dto.details)).not.toContain("bbbbbbbb");
    expect(JSON.stringify(dto.details)).not.toContain("password");
    expect(dto).not.toHaveProperty("metadata");
    expect(auditActionOptionLabel("finance.payment_create")).toBe("تم إنشاء فاتورة");
    expect(auditResourceLabel("Payment")).toBe("فاتورة");
  });
});
