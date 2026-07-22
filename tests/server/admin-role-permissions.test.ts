import { describe, expect, it, vi } from "vitest";
import {
  canManageRolePermissions,
  getRolePermissionMatrix,
  replaceRolePermissions,
  rolePermissionUpdateSchema
} from "@/server/admin/role-permission-service";
import { ALL_PERMISSIONS, type Principal } from "@/server/auth/policy";

const superAdmin: Principal = {
  id: "81000000-0000-4000-8000-000000000001",
  roleName: "Super Admin",
  permissions: ["*"]
};
const delegatedActor: Principal = {
  id: "81000000-0000-4000-8000-000000000002",
  roleName: "Office Admin",
  permissions: ["role.manage.any", "permission.manage.any"]
};
const secretaryRoleId = "82000000-0000-4000-8000-000000000001";
const superRoleId = "82000000-0000-4000-8000-000000000002";
const inactiveRoleId = "82000000-0000-4000-8000-000000000003";
const unknownRoleId = "82000000-0000-4000-8000-000000000004";
const observedAt = new Date("2026-07-22T11:00:00.000Z");
const savedAt = new Date("2026-07-22T11:05:00.000Z");

type StoredRole = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: Date;
  permissionKeys: string[];
  userCount: number;
};

function governanceHarness(options: {
  auditFails?: boolean;
  activeSuperCount?: number;
} = {}) {
  const roles = new Map<string, StoredRole>([
    [secretaryRoleId, {
      id: secretaryRoleId,
      name: "Secretary",
      status: "ACTIVE",
      updatedAt: observedAt,
      permissionKeys: ["case.read.any", "case.create.any"],
      userCount: 2
    }],
    [superRoleId, {
      id: superRoleId,
      name: "Super Admin",
      status: "ACTIVE",
      updatedAt: observedAt,
      permissionKeys: [],
      userCount: 1
    }],
    [inactiveRoleId, {
      id: inactiveRoleId,
      name: "Marketing Staff",
      status: "INACTIVE",
      updatedAt: observedAt,
      permissionKeys: ["content.create.any"],
      userCount: 0
    }],
    [unknownRoleId, {
      id: unknownRoleId,
      name: "Legacy Reviewer",
      status: "ACTIVE",
      updatedAt: observedAt,
      permissionKeys: ["case.read.any"],
      userCount: 0
    }]
  ]);
  const audits: Array<Record<string, unknown>> = [];
  const permissionIds = new Map(ALL_PERMISSIONS.map((key, index) => [key, `permission-${index}`]));

  function roleRow(role: StoredRole) {
    return {
      id: role.id,
      name: role.name,
      status: role.status,
      updatedAt: new Date(role.updatedAt),
      permissions: role.permissionKeys.map((key) => ({ permission: { key } })),
      _count: { users: role.userCount }
    };
  }

  function delegates() {
    return {
      user: {
        findFirst: vi.fn(async ({ where }: { where: { id?: string } }) =>
          where.id === superAdmin.id
            ? { id: superAdmin.id, role: { name: "Super Admin", status: "ACTIVE" } }
            : null
        ),
        count: vi.fn(async () => options.activeSuperCount ?? 1)
      },
      role: {
        findMany: vi.fn(async () => [...roles.values()].map(roleRow)),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          const role = roles.get(where.id);
          return role ? roleRow(role) : null;
        }),
        updateMany: vi.fn(async ({ where, data }: {
          where: { id: string; updatedAt: Date; status?: string };
          data: { updatedAt: Date };
        }) => {
          const role = roles.get(where.id);
          if (!role || role.updatedAt.getTime() !== where.updatedAt.getTime() || (where.status && role.status !== where.status)) {
            return { count: 0 };
          }
          role.updatedAt = new Date(data.updatedAt);
          return { count: 1 };
        })
      },
      permission: {
        findMany: vi.fn(async ({ where }: { where: { key: { in: string[] } } }) =>
          where.key.in
            .filter((key) => permissionIds.has(key))
            .map((key) => ({ id: permissionIds.get(key)!, key }))
        )
      },
      rolePermission: {
        deleteMany: vi.fn(async ({ where }: { where: { roleId: string } }) => {
          const role = roles.get(where.roleId);
          if (role) role.permissionKeys = [];
          return { count: 1 };
        }),
        createMany: vi.fn(async ({ data }: { data: Array<{ roleId: string; permissionId: string }> }) => {
          for (const entry of data) {
            const role = roles.get(entry.roleId);
            const key = [...permissionIds].find(([, id]) => id === entry.permissionId)?.[0];
            if (role && key) role.permissionKeys.push(key);
          }
          return { count: data.length };
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
      const roleSnapshots = new Map(
        [...roles].map(([id, role]) => [id, { ...role, updatedAt: new Date(role.updatedAt), permissionKeys: [...role.permissionKeys] }])
      );
      const auditCount = audits.length;
      try {
        const response = await operation(delegates());
        return response;
      } catch (error) {
        roles.clear();
        for (const [id, role] of roleSnapshots) roles.set(id, role);
        audits.splice(auditCount);
        throw error;
      } finally {
        expect(transactionOptions?.isolationLevel).toBe("Serializable");
      }
    })
  };

  return { host, roles, audits };
}

describe("admin role-permission governance", () => {
  it("requires an exact Super Admin even when a delegate holds both governance keys", async () => {
    expect(canManageRolePermissions(superAdmin)).toBe(true);
    expect(canManageRolePermissions(delegatedActor)).toBe(false);
    const { host } = governanceHarness();

    await expect(getRolePermissionMatrix({ actor: delegatedActor, client: host as never })).rejects.toMatchObject({ status: 403 });
    await expect(replaceRolePermissions({
      actor: delegatedActor,
      roleId: secretaryRoleId,
      body: { permissionKeys: [], updatedAt: observedAt.toISOString() },
      client: host as never
    })).rejects.toMatchObject({ status: 403 });
  });

  it("accepts only strict, unique canonical permission keys and an observed version", () => {
    expect(rolePermissionUpdateSchema.parse({ permissionKeys: [], updatedAt: observedAt.toISOString() }).permissionKeys).toEqual([]);
    expect(() => rolePermissionUpdateSchema.parse({ permissionKeys: ["unknown.permission"], updatedAt: observedAt.toISOString() })).toThrow();
    expect(() => rolePermissionUpdateSchema.parse({ permissionKeys: ["case.read.any", "case.read.any"], updatedAt: observedAt.toISOString() })).toThrow();
    expect(() => rolePermissionUpdateSchema.parse({ permissionKeys: [], updatedAt: observedAt.toISOString(), status: "ACTIVE" })).toThrow();
  });

  it("returns the canonical grouped catalog and protected/inactive read-only role state", async () => {
    const { host } = governanceHarness();
    const matrix = await getRolePermissionMatrix({ actor: superAdmin, client: host as never });

    expect(matrix.permissions).toHaveLength(ALL_PERMISSIONS.length);
    expect(matrix.permissions.every((permission) => permission.groupKey && permission.labelKey)).toBe(true);
    expect(matrix.roles.find((role) => role.id === superRoleId)).toMatchObject({ protected: true, readOnly: true, effectiveWildcard: true });
    expect(matrix.roles.find((role) => role.id === inactiveRoleId)).toMatchObject({ protected: false, readOnly: true, status: "INACTIVE" });
    expect(matrix.roles.find((role) => role.id === unknownRoleId)).toMatchObject({ protected: false, readOnly: true, status: "ACTIVE" });
  });

  it("atomically replaces assignments, advances the version, and records a redacted audit", async () => {
    const { host, roles, audits } = governanceHarness();
    const response = await replaceRolePermissions({
      actor: superAdmin,
      roleId: secretaryRoleId,
      body: { permissionKeys: ["notification.read.self"], updatedAt: observedAt.toISOString() },
      now: savedAt,
      client: host as never
    });

    expect(response).toMatchObject({ id: secretaryRoleId, permissionKeys: ["notification.read.self"], updatedAt: savedAt.toISOString() });
    expect(roles.get(secretaryRoleId)?.permissionKeys).toEqual(["notification.read.self"]);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({ action: "role.permissions_replace", resourceId: secretaryRoleId });
    expect(JSON.stringify(audits[0])).not.toMatch(/permissionKeys|password|secret/i);
  });

  it("allows an intentionally empty editable role and keeps it empty", async () => {
    const { host, roles } = governanceHarness();
    const response = await replaceRolePermissions({
      actor: superAdmin,
      roleId: secretaryRoleId,
      body: { permissionKeys: [], updatedAt: observedAt.toISOString() },
      now: savedAt,
      client: host as never
    });

    expect(response.permissionKeys).toEqual([]);
    expect(roles.get(secretaryRoleId)?.permissionKeys).toEqual([]);
  });

  it("rejects protected, inactive, and stale role writes without mutation", async () => {
    for (const [roleId, updatedAt] of [
      [superRoleId, observedAt.toISOString()],
      [inactiveRoleId, observedAt.toISOString()],
      [unknownRoleId, observedAt.toISOString()],
      [secretaryRoleId, "2026-07-22T10:00:00.000Z"]
    ] as const) {
      const { host, roles, audits } = governanceHarness();
      const previous = [...roles.get(roleId)!.permissionKeys];
      await expect(replaceRolePermissions({
        actor: superAdmin,
        roleId,
        body: { permissionKeys: ["notification.read.self"], updatedAt },
        now: savedAt,
        client: host as never
      })).rejects.toMatchObject({ status: 409 });
      expect(roles.get(roleId)?.permissionKeys).toEqual(previous);
      expect(audits).toHaveLength(0);
    }
  });

  it("rolls back the version and assignments when the audit write fails", async () => {
    const { host, roles, audits } = governanceHarness({ auditFails: true });
    await expect(replaceRolePermissions({
      actor: superAdmin,
      roleId: secretaryRoleId,
      body: { permissionKeys: ["notification.read.self"], updatedAt: observedAt.toISOString() },
      now: savedAt,
      client: host as never
    })).rejects.toThrow("audit write failed");

    expect(roles.get(secretaryRoleId)).toMatchObject({
      updatedAt: observedAt,
      permissionKeys: ["case.read.any", "case.create.any"]
    });
    expect(audits).toHaveLength(0);
  });

  it("rejects a missing active exact-Super path inside the transaction", async () => {
    const { host, roles } = governanceHarness({ activeSuperCount: 0 });
    await expect(replaceRolePermissions({
      actor: superAdmin,
      roleId: secretaryRoleId,
      body: { permissionKeys: [], updatedAt: observedAt.toISOString() },
      now: savedAt,
      client: host as never
    })).rejects.toMatchObject({ status: 409 });
    expect(roles.get(secretaryRoleId)?.permissionKeys).toEqual(["case.read.any", "case.create.any"]);
  });
});
