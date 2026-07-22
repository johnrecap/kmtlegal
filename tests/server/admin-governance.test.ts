import { describe, expect, it, vi } from "vitest";
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
  rolePermissionsWithinCeiling,
  settingDefinitions,
  toAdminUserDetail,
  toAdminUserListItem,
  updateAdminUser
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

const secretary: Principal = {
  id: "55555555-5555-4555-8555-555555555555",
  roleName: ROLES.secretary,
  permissions: ["client.read.any", "client.update.any", "client.account.manage", "appointment.manage.any"]
};

const actorRoleId = "91000000-0000-4000-8000-000000000001";
const lawyerRoleId = "91000000-0000-4000-8000-000000000002";
const secretaryRoleId = "91000000-0000-4000-8000-000000000003";
const elevatedRoleId = "91000000-0000-4000-8000-000000000004";
const superRoleId = "91000000-0000-4000-8000-000000000005";
const targetUserId = "92000000-0000-4000-8000-000000000001";
const observedUserAt = new Date("2026-07-22T12:00:00.000Z");
const savedUserAt = new Date("2026-07-22T12:05:00.000Z");

type HarnessRole = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  permissionKeys: string[];
};

function adminUserHarness(options: {
  actor?: Principal;
  targetRoleId?: string;
  activeOtherSupers?: number;
  auditFails?: boolean;
  serializationConflict?: boolean;
} = {}) {
  const actor = options.actor ?? governanceDelegate;
  const roles = new Map<string, HarnessRole>([
    [actorRoleId, { id: actorRoleId, name: actor.roleName, status: "ACTIVE", permissionKeys: actor.permissions ?? [] }],
    [lawyerRoleId, { id: lawyerRoleId, name: "Lawyer", status: "ACTIVE", permissionKeys: ["case.read.assigned"] }],
    [secretaryRoleId, { id: secretaryRoleId, name: "Secretary", status: "ACTIVE", permissionKeys: ["case.read.any"] }],
    [elevatedRoleId, { id: elevatedRoleId, name: "Office Admin", status: "ACTIVE", permissionKeys: ["settings.manage.any"] }],
    [superRoleId, { id: superRoleId, name: "Super Admin", status: "ACTIVE", permissionKeys: [] }]
  ]);
  const initialRoleId = options.targetRoleId ?? lawyerRoleId;
  const target = {
    id: targetUserId,
    name: "Target User",
    email: "target@example.invalid",
    phone: null as string | null,
    locale: "ar",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED" | "DELETED" | "INVITED",
    roleId: initialRoleId,
    createdAt: new Date("2026-07-20T10:00:00.000Z"),
    updatedAt: new Date(observedUserAt),
    deletedAt: null as Date | null
  };
  const audits: Array<Record<string, unknown>> = [];
  let revokedSessions = 0;

  function rolePayload(roleId: string) {
    const role = roles.get(roleId)!;
    return {
      id: role.id,
      name: role.name,
      status: role.status,
      permissions: role.permissionKeys.map((key) => ({ permission: { key } }))
    };
  }

  function targetPayload() {
    return {
      ...target,
      role: rolePayload(target.roleId),
      twoFactorCredential: null,
      sessions: [],
      auditLogs: [],
      clientProfile: null,
      lawyerProfile: null,
      _count: { sessions: revokedSessions, auditLogs: audits.length, assignedCases: 0, assignedTasks: 0 }
    };
  }

  function delegates() {
    return {
      user: {
        findFirst: vi.fn(async ({ where }: { where: { id?: string } }) =>
          where.id === actor.id
            ? {
                id: actor.id,
                status: "ACTIVE",
                deletedAt: null,
                role: rolePayload(actor.roleName === "Super Admin" ? superRoleId : actorRoleId)
              }
            : null
        ),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => where.id === target.id ? targetPayload() : null),
        updateMany: vi.fn(async ({ where, data }: {
          where: { id: string; updatedAt: Date };
          data: Record<string, unknown>;
        }) => {
          if (where.id !== target.id || target.updatedAt.getTime() !== where.updatedAt.getTime()) return { count: 0 };
          Object.assign(target, data);
          return { count: 1 };
        }),
        count: vi.fn(async () => options.activeOtherSupers ?? 1)
      },
      role: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => roles.has(where.id) ? rolePayload(where.id) : null),
        findMany: vi.fn(async () => [...roles.values()].map((role) => rolePayload(role.id)))
      },
      session: {
        updateMany: vi.fn(async () => {
          revokedSessions += 2;
          return { count: 2 };
        })
      },
      auditLog: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          if (options.auditFails) throw new Error("audit write failed");
          audits.push(data);
          return data;
        })
      }
    };
  }

  const host = {
    ...delegates(),
    $transaction: vi.fn(async (
      operation: (client: ReturnType<typeof delegates>) => Promise<unknown>,
      transactionOptions?: { isolationLevel?: string }
    ) => {
      const snapshot = { ...target, updatedAt: new Date(target.updatedAt), deletedAt: target.deletedAt ? new Date(target.deletedAt) : null };
      const auditCount = audits.length;
      const revokedBefore = revokedSessions;
      try {
        const response = await operation(delegates());
        if (options.serializationConflict) throw Object.assign(new Error("serialization failure"), { code: "P2034" });
        return response;
      } catch (error) {
        Object.assign(target, snapshot);
        audits.splice(auditCount);
        revokedSessions = revokedBefore;
        throw error;
      } finally {
        expect(transactionOptions?.isolationLevel).toBe("Serializable");
      }
    })
  };

  return { actor, host, target, audits, revokedSessions: () => revokedSessions };
}

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

    expect(canManageAdminUsers(secretary)).toBe(false);
    expect(canCreateAdminUsers(secretary)).toBe(false);
    expect(canChangeAdminUserPassword(secretary)).toBe(false);
    expect(canManageAdminSettings(secretary)).toBe(false);
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
      locale: "ar",
      updatedAt: observedUserAt.toISOString()
    });

    expect(payload.status).toBe("ACTIVE");
    expect(payload.updatedAt).toBe(observedUserAt.toISOString());
    expect(() => adminUserUpdateSchema.parse({ ...payload, updatedAt: undefined })).toThrow();
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

  it("maps list and detail rows to purpose-built DTOs with no credential or token material", () => {
    const baseRow = {
      id: targetUserId,
      name: "Safe User",
      email: "safe@example.invalid",
      phone: null,
      locale: "ar",
      status: "ACTIVE",
      createdAt: new Date("2026-07-20T10:00:00.000Z"),
      updatedAt: observedUserAt,
      role: { id: lawyerRoleId, name: "Lawyer" },
      twoFactorCredential: { recoveryState: "ENABLED", enabledAt: observedUserAt, lastVerifiedAt: observedUserAt },
      _count: { sessions: 2, auditLogs: 3, assignedCases: 4, assignedTasks: 5 },
      passwordHash: "credential-secret",
      tokenHash: "session-token"
    };
    const listItem = toAdminUserListItem(baseRow as never);
    const detail = toAdminUserDetail({
      ...baseRow,
      role: {
        ...baseRow.role,
        permissions: [{ permission: { key: "case.read.assigned" } }]
      },
      twoFactorCredential: {
        ...baseRow.twoFactorCredential,
        secretEncrypted: "totp-secret",
        recoveryCodesEncrypted: "recovery-secret"
      },
      sessions: [{
        id: "session-1",
        status: "ACTIVE",
        twoFactorVerifiedAt: null,
        expiresAt: savedUserAt,
        revokedAt: null,
        ipAddress: "127.0.0.1",
        createdAt: observedUserAt,
        tokenHash: "session-token"
      }],
      auditLogs: [],
      clientProfile: null,
      lawyerProfile: null
    } as never);

    expect(listItem).toMatchObject({
      counts: { sessions: 2, auditLogs: 3, assignedCases: 4, assignedTasks: 5 },
      twoFactor: { recoveryState: "ENABLED" }
    });
    expect(detail).toMatchObject({
      rolePermissionKeys: ["case.read.assigned"],
      safeSessions: [{ id: "session-1" }],
      safeAuditRows: []
    });
    const serialized = JSON.stringify({ listItem, detail });
    for (const secret of ["credential-secret", "totp-secret", "recovery-secret", "session-token"]) {
      expect(serialized).not.toContain(secret);
    }
    expect(listItem).not.toHaveProperty("_count");
    expect(detail).not.toHaveProperty("sessions");
    expect(detail).not.toHaveProperty("auditLogs");
  });

  it("enforces delegated permission ceilings for both current and next roles", () => {
    expect(rolePermissionsWithinCeiling(
      ["user.manage.any", "case.read.any", "case.read.assigned"],
      ["case.read.assigned"]
    )).toBe(true);
    expect(rolePermissionsWithinCeiling(["user.manage.any"], ["settings.manage.any"])).toBe(false);
  });

  it("updates a scoped delegated target with optimistic concurrency, revocation, and audit", async () => {
    const boundedDelegate: Principal = {
      ...governanceDelegate,
      permissions: ["user.manage.any", "case.read.any", "case.read.assigned"]
    };
    const harness = adminUserHarness({ actor: boundedDelegate });
    const updated = await updateAdminUser({
      actor: boundedDelegate,
      userId: targetUserId,
      body: {
        name: "Updated User",
        phone: "",
        roleId: secretaryRoleId,
        status: "SUSPENDED",
        locale: "ar",
        updatedAt: observedUserAt.toISOString()
      },
      now: savedUserAt,
      client: harness.host as never
    });

    expect(updated).toMatchObject({
      id: targetUserId,
      name: "Updated User",
      status: "SUSPENDED",
      role: { id: secretaryRoleId, name: "Secretary" },
      updatedAt: savedUserAt.toISOString()
    });
    expect(harness.revokedSessions()).toBe(2);
    expect(harness.audits).toHaveLength(1);
    expect(JSON.stringify(harness.audits[0])).not.toMatch(/password|secret|tokenHash/i);
  });

  it("denies protected targets and cross-ceiling assignments for delegated managers", async () => {
    const boundedDelegate: Principal = {
      ...governanceDelegate,
      permissions: ["user.manage.any", "case.read.any", "case.read.assigned"]
    };
    const protectedHarness = adminUserHarness({ actor: boundedDelegate, targetRoleId: superRoleId });
    await expect(updateAdminUser({
      actor: boundedDelegate,
      userId: targetUserId,
      body: {
        name: "Protected",
        phone: "",
        roleId: lawyerRoleId,
        status: "ACTIVE",
        locale: "ar",
        updatedAt: observedUserAt.toISOString()
      },
      now: savedUserAt,
      client: protectedHarness.host as never
    })).rejects.toMatchObject({ status: 404 });

    const amplifiedHarness = adminUserHarness({ actor: boundedDelegate });
    await expect(updateAdminUser({
      actor: boundedDelegate,
      userId: targetUserId,
      body: {
        name: "Amplified",
        phone: "",
        roleId: elevatedRoleId,
        status: "ACTIVE",
        locale: "ar",
        updatedAt: observedUserAt.toISOString()
      },
      now: savedUserAt,
      client: amplifiedHarness.host as never
    })).rejects.toMatchObject({ status: 403 });
    expect(amplifiedHarness.audits).toHaveLength(0);
  });

  it("rejects stale writes and concurrent policy changes without partial effects", async () => {
    const boundedDelegate: Principal = {
      ...governanceDelegate,
      permissions: ["user.manage.any", "case.read.any", "case.read.assigned"]
    };
    for (const options of [{}, { serializationConflict: true }]) {
      const harness = adminUserHarness({ actor: boundedDelegate, ...options });
      await expect(updateAdminUser({
        actor: boundedDelegate,
        userId: targetUserId,
        body: {
          name: "Concurrent",
          phone: "",
          roleId: secretaryRoleId,
          status: "ACTIVE",
          locale: "ar",
          updatedAt: options.serializationConflict ? observedUserAt.toISOString() : "2026-07-22T10:00:00.000Z"
        },
        now: savedUserAt,
        client: harness.host as never
      })).rejects.toMatchObject({ status: 409 });
      expect(harness.target).toMatchObject({ name: "Target User", roleId: lawyerRoleId, updatedAt: observedUserAt });
      expect(harness.revokedSessions()).toBe(0);
      expect(harness.audits).toHaveLength(0);
    }
  });

  it("protects the final active exact Super Admin and rolls back on audit failure", async () => {
    const finalSuper: Principal = { ...superAdmin, id: targetUserId };
    const finalHarness = adminUserHarness({ actor: finalSuper, targetRoleId: superRoleId, activeOtherSupers: 0 });
    await expect(updateAdminUser({
      actor: finalSuper,
      userId: targetUserId,
      body: {
        name: "Final Super",
        phone: "",
        roleId: lawyerRoleId,
        status: "ACTIVE",
        locale: "ar",
        updatedAt: observedUserAt.toISOString()
      },
      now: savedUserAt,
      client: finalHarness.host as never
    })).rejects.toMatchObject({ status: 409 });
    expect(finalHarness.target.roleId).toBe(superRoleId);

    const auditHarness = adminUserHarness({ actor: finalSuper, targetRoleId: lawyerRoleId, auditFails: true });
    await expect(updateAdminUser({
      actor: finalSuper,
      userId: targetUserId,
      body: {
        name: "Audit Rollback",
        phone: "",
        roleId: secretaryRoleId,
        status: "SUSPENDED",
        locale: "ar",
        updatedAt: observedUserAt.toISOString()
      },
      now: savedUserAt,
      client: auditHarness.host as never
    })).rejects.toThrow("audit write failed");
    expect(auditHarness.target).toMatchObject({ name: "Target User", roleId: lawyerRoleId, status: "ACTIVE" });
    expect(auditHarness.revokedSessions()).toBe(0);
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
      clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      caseId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      lawyerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      appointmentId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      documentId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      paymentId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-23",
      sortBy: "createdAt",
      sortDirection: "desc",
      pageSize: "80"
    });

    expect(query.action).toBe("auth.2fa_reset");
    expect(query.clientId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(query.paymentId).toBe("ffffffff-ffff-4fff-8fff-ffffffffffff");
    expect(query.pageSize).toBe(80);
    expect(() => adminAuditLogQuerySchema.parse({ clientId: "not-a-uuid" })).toThrow();
    expect(() => adminAuditLogQuerySchema.parse({ pageSize: "500" })).toThrow();
  });

  it("maps raw audit rows to client-friendly audit DTOs", () => {
    const dto = toAdminAuditLogDto({
      id: "audit-1",
      action: "finance.payment_create",
      resourceType: "Payment",
      resourceId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      clientId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      paymentId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
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
    expect(dto.actor).toEqual({ name: "ahmed", role: "مدير النظام" });
    expect(dto.summary).toContain("تم إنشاء فاتورة");
    expect(dto.details).toContainEqual({ label: "رقم الفاتورة", value: "INV-2026-0004" });
    expect(JSON.stringify(dto.details)).not.toContain("clientId");
    expect(JSON.stringify(dto.details)).not.toContain("bbbbbbbb");
    expect(JSON.stringify(dto.details)).not.toContain("password");
    expect(dto.technical.clientId).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(dto.technical.paymentId).toBe("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    expect(dto).not.toHaveProperty("metadata");
    expect(auditActionOptionLabel("finance.payment_create")).toBe("تم إنشاء فاتورة");
    expect(auditResourceLabel("Payment")).toBe("فاتورة");
    expect(auditActionOptionLabel("contact.message_create")).toBe("تم استقبال رسالة تواصل");
    expect(auditResourceLabel("ContactMessage")).toBe("رسالة تواصل");
  });
});
