import { Prisma } from "@prisma/client";
import { z } from "zod";
import { permissionGroupForKey } from "@/lib/ui-copy";
import { appendAuditLog } from "@/server/audit/audit-service";
import { PLAN35_AUDIT_ACTIONS } from "@/server/audit/audit-event-catalog";
import { ALL_PERMISSIONS, hasPermission, ROLES, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const canonicalPermissionKeys = new Set<string>(ALL_PERMISSIONS);
const protectedRoleNames = new Set<string>([ROLES.guest, ROLES.client, ROLES.superAdmin]);
const editableRoleNames = new Set<string>([
  ROLES.lawyer,
  ROLES.secretary,
  ROLES.officeAdmin,
  ROLES.marketingStaff
]);

const permissionKeySchema = z.string().refine(
  (key) => canonicalPermissionKeys.has(key),
  "Permission key is not canonical."
);

export const rolePermissionUpdateSchema = z
  .object({
    permissionKeys: z
      .array(permissionKeySchema)
      .max(ALL_PERMISSIONS.length)
      .superRefine((keys, context) => {
        if (new Set(keys).size !== keys.length) {
          context.addIssue({ code: "custom", message: "Permission keys must be unique." });
        }
      }),
    updatedAt: z.string().datetime({ offset: true })
  })
  .strict();

export type RolePermissionMatrix = Awaited<ReturnType<typeof getRolePermissionMatrix>>;

export function canManageRolePermissions(actor: Principal) {
  return (
    actor.roleName === ROLES.superAdmin &&
    hasPermission(actor, "role.manage.any") &&
    hasPermission(actor, "permission.manage.any")
  );
}

function assertRolePermissionManager(actor: Principal) {
  if (!canManageRolePermissions(actor)) {
    throw new ApiError(
      403,
      "PERMISSION_DENIED",
      "Exact Super Admin role and both role and permission management permissions are required."
    );
  }
}

async function assertLiveExactSuperAdmin(
  client: Pick<Prisma.TransactionClient, "user">,
  actor: Principal
) {
  const activeActor = await client.user.findFirst({
    where: {
      id: actor.id,
      status: "ACTIVE",
      deletedAt: null,
      role: { name: ROLES.superAdmin, status: "ACTIVE" }
    },
    select: { id: true, role: { select: { name: true, status: true } } }
  });

  if (!activeActor) {
    throw new ApiError(403, "PERMISSION_DENIED", "An active exact Super Admin account is required.");
  }
}

function roleMatrixRow(role: {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
  permissions: Array<{ permission: { key: string } }>;
  _count: { users: number };
}) {
  const protectedRole = protectedRoleNames.has(role.name);
  const effectiveWildcard = role.name === ROLES.superAdmin;

  return {
    id: role.id,
    name: role.name,
    status: role.status,
    protected: protectedRole,
    readOnly: !editableRoleNames.has(role.name) || role.status !== "ACTIVE",
    effectiveWildcard,
    userCount: role._count.users,
    permissionKeys: effectiveWildcard
      ? [...ALL_PERMISSIONS]
      : role.permissions.map(({ permission }) => permission.key).sort(),
    updatedAt: role.updatedAt.toISOString()
  };
}

export async function getRolePermissionMatrix(input: {
  actor: Principal;
  client?: typeof prisma;
}) {
  assertRolePermissionManager(input.actor);
  const client = input.client ?? prisma;
  await assertLiveExactSuperAdmin(client, input.actor);

  const roles = await client.role.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      permissions: {
        select: { permission: { select: { key: true } } },
        orderBy: { permission: { key: "asc" } }
      },
      _count: { select: { users: true } }
    },
    orderBy: { name: "asc" }
  });

  return {
    permissions: ALL_PERMISSIONS.map((key) => ({
      key,
      groupKey: permissionGroupForKey(key),
      labelKey: `permissions.${key}`
    })),
    roles: roles.map(roleMatrixRow)
  };
}

export async function replaceRolePermissions(input: {
  actor: Principal;
  roleId: string;
  body: unknown;
  request?: Request;
  now?: Date;
  client?: typeof prisma;
}) {
  assertRolePermissionManager(input.actor);
  const roleId = parseWithSchema(uuidSchema, input.roleId, "Role id is invalid.");
  const body = parseWithSchema(
    rolePermissionUpdateSchema,
    input.body,
    "Role permission payload is invalid."
  );
  const client = input.client ?? prisma;
  const now = input.now ?? new Date();

  try {
    return await client.$transaction(
      async (tx) => {
        await assertLiveExactSuperAdmin(tx, input.actor);

        const activeSuperCount = await tx.user.count({
          where: {
            status: "ACTIVE",
            deletedAt: null,
            role: { name: ROLES.superAdmin, status: "ACTIVE" }
          }
        });
        if (activeSuperCount < 1) {
          throw new ApiError(409, "CONFLICT", "No active Super Admin governance path remains.");
        }

        const role = await tx.role.findUnique({
          where: { id: roleId },
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
            permissions: { select: { permission: { select: { key: true } } } },
            _count: { select: { users: true } }
          }
        });
        if (!role) {
          throw new ApiError(404, "NOT_FOUND", "Role was not found.");
        }
        if (protectedRoleNames.has(role.name)) {
          throw new ApiError(409, "CONFLICT", "Protected roles cannot be changed.");
        }
        if (!editableRoleNames.has(role.name)) {
          throw new ApiError(409, "CONFLICT", "Only canonical operational roles can be changed.");
        }
        if (role.status !== "ACTIVE") {
          throw new ApiError(409, "CONFLICT", "Inactive roles are read-only.");
        }

        const permissions = body.permissionKeys.length
          ? await tx.permission.findMany({
              where: { key: { in: body.permissionKeys } },
              select: { id: true, key: true }
            })
          : [];
        if (permissions.length !== body.permissionKeys.length) {
          throw new ApiError(400, "VALIDATION_ERROR", "Permission keys must be canonical.");
        }

        const versionUpdate = await tx.role.updateMany({
          where: { id: role.id, status: "ACTIVE", updatedAt: new Date(body.updatedAt) },
          data: { updatedAt: now }
        });
        if (versionUpdate.count !== 1) {
          throw new ApiError(409, "CONFLICT", "Role permissions changed after this form was loaded.");
        }

        await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
        if (permissions.length) {
          const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));
          await tx.rolePermission.createMany({
            data: body.permissionKeys.map((key) => ({
              roleId: role.id,
              permissionId: permissionIdByKey.get(key)!
            }))
          });
        }

        await appendAuditLog({
          client: tx,
          actorId: input.actor.id,
          action: PLAN35_AUDIT_ACTIONS.rolePermissionsReplace,
          resourceType: "Role",
          resourceId: role.id,
          metadata: {
            previousPermissionCount: role.permissions.length,
            permissionCount: body.permissionKeys.length
          },
          request: input.request
        });

        return {
          id: role.id,
          permissionKeys: [...body.permissionKeys],
          updatedAt: now.toISOString()
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      throw new ApiError(409, "CONFLICT", "Role permissions changed concurrently. Reload and try again.");
    }
    throw error;
  }
}
