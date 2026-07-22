import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { auditActionOptionLabel, auditFilterOption, auditResourceLabel, toAdminAuditLogDto, type AuditFilterOption } from "@/server/audit/audit-event-catalog";
import { redactMetadata } from "@/server/audit/redaction";
import { hashPassword } from "@/server/auth/password";
import { hasPermission, ROLES, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { emailSchema, localeSchema, parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const userStatusSchema = z.enum(["INVITED", "ACTIVE", "SUSPENDED", "DELETED"]);
const twoFactorStateSchema = z.enum(["PENDING_SETUP", "ENABLED", "RESET_REQUIRED", "DISABLED_BY_ADMIN"]);
const userSortBySchema = z.enum(["createdAt", "updatedAt", "name", "email", "status"]);
const auditSortBySchema = z.enum(["createdAt", "action", "resourceType"]);
const settingKeySchema = z.enum(["office.profile", "security.staff2fa", "storage.policy", "email.policy"]);
const optionalDateStringSchema = z.string().trim().max(40).optional().or(z.literal(""));

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  roleId: uuidSchema.optional().or(z.literal("")),
  status: userStatusSchema.optional().or(z.literal("")),
  twoFactorState: twoFactorStateSchema.optional().or(z.literal("")),
  sortBy: userSortBySchema.default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  roleId: uuidSchema,
  status: userStatusSchema,
  locale: localeSchema,
  updatedAt: z.string().datetime({ offset: true })
}).strict();

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  roleId: uuidSchema,
  status: userStatusSchema.default("ACTIVE"),
  locale: localeSchema.default("ar"),
  password: z.string().min(10).max(256)
});

export const adminUserPasswordUpdateSchema = z.object({
  password: z.string().min(10).max(256),
  revokeSessions: z.coerce.boolean().default(true)
});

export const adminAuditLogQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  actorId: uuidSchema.optional().or(z.literal("")),
  action: z.string().trim().max(120).optional().or(z.literal("")),
  resourceType: z.string().trim().max(80).optional().or(z.literal("")),
  clientId: uuidSchema.optional().or(z.literal("")),
  caseId: uuidSchema.optional().or(z.literal("")),
  lawyerId: uuidSchema.optional().or(z.literal("")),
  appointmentId: uuidSchema.optional().or(z.literal("")),
  documentId: uuidSchema.optional().or(z.literal("")),
  paymentId: uuidSchema.optional().or(z.literal("")),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  sortBy: auditSortBySchema.default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

const officeProfileSettingSchema = z.object({
  firmName: z.string().trim().min(2).max(120),
  publicPhone: z.string().trim().max(40).optional().or(z.literal("")),
  publicEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  primaryLocale: localeSchema
});

const securityStaff2faSettingSchema = z.object({
  requiredForStaff: z.coerce.boolean().default(false).transform(() => false),
  totpPrimary: z.coerce.boolean().default(false).transform(() => false),
  emailOtpFallback: z.coerce.boolean().default(false).transform(() => false),
  superAdminResetOnly: z.coerce.boolean().default(true)
});

const storagePolicySettingSchema = z.object({
  driver: z.literal("vps-filesystem"),
  uploadsDir: z.string().trim().min(2).max(240),
  maxUploadMb: z.coerce.number().int().min(1).max(5),
  allowedTypes: z.string().trim().min(3).max(500)
});

const emailPolicySettingSchema = z.object({
  mode: z.enum(["disabled", "dev", "smtp"]),
  fromLabel: z.string().trim().min(2).max(120),
  staffNotificationsEnabled: z.coerce.boolean().default(true),
  appointmentRemindersEnabled: z.coerce.boolean().default(false)
});

export const adminSettingUpdateSchema = z.discriminatedUnion("key", [
  officeProfileSettingSchema.extend({ key: z.literal("office.profile") }),
  securityStaff2faSettingSchema.extend({ key: z.literal("security.staff2fa") }),
  storagePolicySettingSchema.extend({ key: z.literal("storage.policy") }),
  emailPolicySettingSchema.extend({ key: z.literal("email.policy") })
]);

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
export type AdminAuditLogQuery = z.infer<typeof adminAuditLogQuerySchema>;
export type AdminSettingUpdateInput = z.infer<typeof adminSettingUpdateSchema>;

const editableOperationalRoleNames = new Set<string>([
  ROLES.lawyer,
  ROLES.secretary,
  ROLES.officeAdmin,
  ROLES.marketingStaff
]);
const protectedRoleNames = new Set<string>([ROLES.guest, ROLES.client, ROLES.superAdmin]);
const canonicalRoleNames = new Set<string>(Object.values(ROLES));

const adminUserListSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  locale: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  twoFactorCredential: {
    select: { recoveryState: true, enabledAt: true, lastVerifiedAt: true }
  },
  _count: {
    select: { sessions: true, auditLogs: true, assignedCases: true, assignedTasks: true }
  }
} satisfies Prisma.UserSelect;

const adminUserDetailSelect = {
  ...adminUserListSelect,
  deletedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      status: true,
      permissions: {
        select: { permission: { select: { key: true } } },
        orderBy: { permission: { key: "asc" as const } }
      }
    }
  },
  sessions: {
    orderBy: { createdAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      status: true,
      twoFactorVerifiedAt: true,
      expiresAt: true,
      revokedAt: true,
      ipAddress: true,
      createdAt: true
    }
  },
  auditLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 8,
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      metadata: true,
      actor: { select: { name: true, role: { select: { name: true } } } },
      createdAt: true
    }
  },
  clientProfile: { select: { id: true, fullName: true, status: true } },
  lawyerProfile: { select: { id: true, title: true, isPublic: true, bookingEnabled: true } }
} satisfies Prisma.UserSelect;

type AdminUserListRow = Prisma.UserGetPayload<{ select: typeof adminUserListSelect }>;
type AdminUserDetailRow = Prisma.UserGetPayload<{ select: typeof adminUserDetailSelect }>;

function isoDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export function toAdminUserListItem(row: AdminUserListRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    locale: row.locale,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    role: { id: row.role.id, name: row.role.name },
    twoFactor: row.twoFactorCredential
      ? {
          recoveryState: row.twoFactorCredential.recoveryState,
          enabledAt: isoDate(row.twoFactorCredential.enabledAt),
          lastVerifiedAt: isoDate(row.twoFactorCredential.lastVerifiedAt)
        }
      : null,
    counts: {
      sessions: row._count.sessions,
      auditLogs: row._count.auditLogs,
      assignedCases: row._count.assignedCases,
      assignedTasks: row._count.assignedTasks
    }
  };
}

export function toAdminUserDetail(row: AdminUserDetailRow) {
  const base = toAdminUserListItem(row);
  return {
    ...base,
    rolePermissionKeys: row.role.permissions.map(({ permission }) => permission.key),
    safeSessions: row.sessions.map((session) => ({
      id: session.id,
      status: session.status,
      twoFactorVerifiedAt: isoDate(session.twoFactorVerifiedAt),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: isoDate(session.revokedAt),
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString()
    })),
    safeAuditRows: row.auditLogs.map((audit) => ({
      id: audit.id,
      action: audit.action,
      resourceType: audit.resourceType,
      resourceId: audit.resourceId,
      redactedMetadata: redactMetadata(audit.metadata),
      actor: audit.actor
        ? { name: audit.actor.name, roleName: audit.actor.role.name }
        : null,
      createdAt: audit.createdAt.toISOString()
    })),
    clientProfile: row.clientProfile,
    lawyerProfile: row.lawyerProfile
  };
}

export function rolePermissionsWithinCeiling(
  actorPermissionKeys: readonly string[],
  candidatePermissionKeys: readonly string[]
) {
  const actorPermissions = new Set(actorPermissionKeys);
  return candidatePermissionKeys.every((permission) => actorPermissions.has(permission));
}

function permissionKeysForRole(role: { name: string; permissions: Array<{ permission: { key: string } }> }) {
  return role.name === ROLES.superAdmin
    ? ["*"]
    : role.permissions.map(({ permission }) => permission.key);
}

function exactSuperAdmin(actor: Principal) {
  return actor.roleName === ROLES.superAdmin;
}

export const settingDefinitions = [
  {
    key: "office.profile",
    label: "بيانات المكتب",
    description: "بيانات تشغيلية عامة تظهر للفريق ولا تخزن أسرار."
  },
  {
    key: "security.staff2fa",
    label: "حوكمة التحقق الثنائي",
    description: "قواعد تشغيل 2FA للموظفين وإعادة الضبط."
  },
  {
    key: "storage.policy",
    label: "سياسة التخزين",
    description: "تذكير تشغيلي بمسار التخزين الخاص على الـVPS وحدود الرفع."
  },
  {
    key: "email.policy",
    label: "سياسة البريد",
    description: "إعدادات غير سرية تخص نمط البريد والتنبيهات."
  }
] as const;

const defaultSettingValues: Record<(typeof settingDefinitions)[number]["key"], Record<string, unknown>> = {
  "office.profile": {
    firmName: "KMT Legal",
    publicPhone: "",
    publicEmail: "",
    primaryLocale: "ar"
  },
  "security.staff2fa": {
    requiredForStaff: false,
    totpPrimary: false,
    emailOtpFallback: false,
    superAdminResetOnly: true
  },
  "storage.policy": {
    driver: "vps-filesystem",
    uploadsDir: "/var/lib/kmt-legal/uploads",
    maxUploadMb: 5,
    allowedTypes: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
  },
  "email.policy": {
    mode: "disabled",
    fromLabel: "KMT Legal",
    staffNotificationsEnabled: false,
    appointmentRemindersEnabled: false
  }
};

type SettingKey = keyof typeof defaultSettingValues;

export function canManageAdminUsers(actor: Principal) {
  return hasPermission(actor, "user.manage.any");
}

export function canCreateAdminUsers(actor: Principal) {
  return actor.roleName === ROLES.superAdmin && hasPermission(actor, "user.manage.any");
}

export function canChangeAdminUserPassword(actor: Principal) {
  return actor.roleName === ROLES.superAdmin && hasPermission(actor, "user.manage.any");
}

export function canManageAdminSettings(actor: Principal) {
  return hasPermission(actor, "settings.manage.any");
}

export function canReadAdminAuditLog(actor: Principal) {
  return hasPermission(actor, "audit.read.any");
}

function assertUserManagePermission(actor: Principal) {
  if (!canManageAdminUsers(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "User management permission is required.");
  }
}

function assertUserCreatePermission(actor: Principal) {
  if (!canCreateAdminUsers(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Only Super Admin can create user email accounts.");
  }
}

function assertPasswordChangePermission(actor: Principal) {
  if (!canChangeAdminUserPassword(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Only Super Admin can change user passwords.");
  }
}

function assertSettingsManagePermission(actor: Principal) {
  if (!canManageAdminSettings(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Settings management permission is required.");
  }
}

function assertAuditReadPermission(actor: Principal) {
  if (!canReadAdminAuditLog(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Audit log read permission is required.");
  }
}

function normalizeUserListQuery(input: unknown) {
  return parseWithSchema(adminUserListQuerySchema, input, "User list query is invalid.");
}

function normalizeAuditLogQuery(input: unknown) {
  return parseWithSchema(adminAuditLogQuerySchema, input, "Audit log query is invalid.");
}

function userOrderBy(filters: AdminUserListQuery): Prisma.UserOrderByWithRelationInput[] {
  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function userListWhere(filters: AdminUserListQuery, allowedRoleIds?: readonly string[]): Prisma.UserWhereInput {
  const search = filters.q?.trim();

  return {
    AND: [
      allowedRoleIds ? { roleId: { in: [...allowedRoleIds] } } : {},
      filters.status ? { status: filters.status } : {},
      filters.roleId ? { roleId: filters.roleId } : {},
      filters.twoFactorState ? { twoFactorCredential: { recoveryState: filters.twoFactorState } } : {},
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { role: { name: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

async function delegatedRoleIds(client: typeof prisma, actor: Principal) {
  if (exactSuperAdmin(actor)) return undefined;
  const roles = await client.role.findMany({
    where: { status: "ACTIVE", name: { in: [...editableOperationalRoleNames] } },
    select: {
      id: true,
      name: true,
      permissions: { select: { permission: { select: { key: true } } } }
    }
  });
  return roles
    .filter((role) => rolePermissionsWithinCeiling(actor.permissions ?? [], permissionKeysForRole(role)))
    .map((role) => role.id);
}

export async function listAdminUsers(input: {
  actor: Principal;
  query: unknown;
  client?: typeof prisma;
}) {
  assertUserManagePermission(input.actor);
  const client = input.client ?? prisma;
  const filters = normalizeUserListQuery(input.query);
  const pagination = toPagination(filters);
  const roleIds = await delegatedRoleIds(client, input.actor);
  const where = userListWhere(filters, roleIds);

  const [items, total] = await Promise.all([
    client.user.findMany({
      where,
      select: adminUserListSelect,
      orderBy: userOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    client.user.count({ where })
  ]);

  return {
    items: items.map(toAdminUserListItem),
    total,
    filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

export async function getAdminUserOptions(actor: Principal, client: typeof prisma = prisma) {
  assertUserManagePermission(actor);
  const roles = await client.role.findMany({
    where: {
      status: "ACTIVE",
      name: exactSuperAdmin(actor)
        ? { in: [...canonicalRoleNames].filter((roleName) => roleName !== ROLES.guest) }
        : { in: [...editableOperationalRoleNames] }
    },
    select: {
      id: true,
      name: true,
      description: true,
      permissions: { select: { permission: { select: { key: true } } } }
    },
    orderBy: { name: "asc" }
  });

  return {
    roles: roles
      .filter(
        (role) =>
          exactSuperAdmin(actor) ||
          rolePermissionsWithinCeiling(actor.permissions ?? [], permissionKeysForRole(role))
      )
      .map(({ id, name, description }) => ({ id, name, description })),
    statuses: ["INVITED", "ACTIVE", "SUSPENDED", "DELETED"] as const,
    twoFactorStates: ["PENDING_SETUP", "ENABLED", "RESET_REQUIRED", "DISABLED_BY_ADMIN"] as const
  };
}

async function assignableRole(client: typeof prisma, roleId: string) {
  const role = await client.role.findUnique({
    where: { id: roleId },
    select: {
      id: true,
      name: true,
      status: true,
      permissions: { select: { permission: { select: { key: true } } } }
    }
  });
  if (!role || role.status !== "ACTIVE" || role.name === ROLES.guest || !canonicalRoleNames.has(role.name)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Role is invalid.");
  }
  return role;
}

export async function createAdminUser(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  client?: typeof prisma;
}) {
  assertUserCreatePermission(input.actor);
  const body = parseWithSchema(adminUserCreateSchema, input.body, "User create payload is invalid.");
  const client = input.client ?? prisma;
  const nextRole = await assignableRole(client, body.roleId);
  const existing = await client.user.findUnique({ where: { email: body.email }, select: { id: true } });
  if (existing) {
    throw new ApiError(409, "CONFLICT", "A user with this email already exists.");
  }

  const passwordHash = await hashPassword(body.password);
  const user = await client.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: body.email,
        name: body.name,
        phone: body.phone || null,
        passwordHash,
        roleId: nextRole.id,
        status: body.status,
        locale: body.locale,
        deletedAt: body.status === "DELETED" ? new Date() : null
      },
      select: adminUserListSelect
    });
    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "user.create",
      resourceType: "User",
      resourceId: created.id,
      metadata: {
        role: created.role.name,
        status: created.status,
        locale: created.locale,
        passwordSetBySuperAdmin: true,
        emailDelivery: "disabled"
      },
      request: input.request
    });
    return created;
  });

  return toAdminUserListItem(user);
}

function delegatedCanTarget(actor: Principal, role: {
  name: string;
  status: string;
  permissions: Array<{ permission: { key: string } }>;
}) {
  return (
    role.status === "ACTIVE" &&
    editableOperationalRoleNames.has(role.name) &&
    rolePermissionsWithinCeiling(actor.permissions ?? [], permissionKeysForRole(role))
  );
}

export async function getAdminUserDetail(input: {
  actor: Principal;
  userId: string;
  client?: typeof prisma;
}) {
  assertUserManagePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");
  const client = input.client ?? prisma;
  const user = await client.user.findUnique({ where: { id: userId }, select: adminUserDetailSelect });
  if (!user || (!exactSuperAdmin(input.actor) && !delegatedCanTarget(input.actor, user.role))) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }
  return toAdminUserDetail(user);
}

function isSerializationConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

export async function updateAdminUser(input: {
  actor: Principal;
  userId: string;
  body: unknown;
  request?: Request;
  now?: Date;
  client?: typeof prisma;
}) {
  assertUserManagePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");
  const body = parseWithSchema(adminUserUpdateSchema, input.body, "User payload is invalid.");
  const client = input.client ?? prisma;
  const now = input.now ?? new Date();

  try {
    return await client.$transaction(
      async (tx) => {
        const actorUser = await tx.user.findFirst({
          where: { id: input.actor.id, status: "ACTIVE", deletedAt: null, role: { status: "ACTIVE" } },
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true,
                status: true,
                permissions: { select: { permission: { select: { key: true } } } }
              }
            }
          }
        });
        if (!actorUser) {
          throw new ApiError(403, "PERMISSION_DENIED", "An active user manager account is required.");
        }

        const liveActor: Principal = {
          id: actorUser.id,
          roleName: actorUser.role.name,
          permissions: permissionKeysForRole(actorUser.role)
        };
        if (!hasPermission(liveActor, "user.manage.any")) {
          throw new ApiError(403, "PERMISSION_DENIED", "User management permission is required.");
        }
        const actorIsExactSuper =
          input.actor.roleName === ROLES.superAdmin && actorUser.role.name === ROLES.superAdmin;

        const existing = await tx.user.findUnique({ where: { id: userId }, select: adminUserDetailSelect });
        if (!existing || (!actorIsExactSuper && !delegatedCanTarget(liveActor, existing.role))) {
          throw new ApiError(404, "NOT_FOUND", "User was not found.");
        }

        const nextRole = await tx.role.findUnique({
          where: { id: body.roleId },
          select: {
            id: true,
            name: true,
            status: true,
            permissions: { select: { permission: { select: { key: true } } } }
          }
        });
        if (!nextRole || nextRole.status !== "ACTIVE" || nextRole.name === ROLES.guest || !canonicalRoleNames.has(nextRole.name)) {
          throw new ApiError(400, "VALIDATION_ERROR", "Role is invalid.");
        }
        if (!actorIsExactSuper) {
          if (protectedRoleNames.has(nextRole.name)) {
            throw new ApiError(403, "PERMISSION_DENIED", "Only Super Admin can assign a protected role.");
          }
          if (!delegatedCanTarget(liveActor, nextRole)) {
            throw new ApiError(403, "PERMISSION_DENIED", "The selected role exceeds your permission ceiling.");
          }
        }

        const removesActiveSuper =
          existing.status === "ACTIVE" &&
          existing.deletedAt === null &&
          existing.role.name === ROLES.superAdmin &&
          (body.status !== "ACTIVE" || nextRole.name !== ROLES.superAdmin);
        if (removesActiveSuper) {
          const otherActiveSupers = await tx.user.count({
            where: {
              id: { not: existing.id },
              status: "ACTIVE",
              deletedAt: null,
              role: { name: ROLES.superAdmin, status: "ACTIVE" }
            }
          });
          if (otherActiveSupers < 1) {
            throw new ApiError(409, "CONFLICT", "The final active Super Admin account cannot be changed.");
          }
        }

        const updateResult = await tx.user.updateMany({
          where: { id: existing.id, updatedAt: new Date(body.updatedAt) },
          data: {
            name: body.name,
            phone: body.phone || null,
            roleId: nextRole.id,
            status: body.status,
            locale: body.locale,
            deletedAt: body.status === "DELETED" ? now : null,
            updatedAt: now
          }
        });
        if (updateResult.count !== 1) {
          throw new ApiError(409, "CONFLICT", "User data changed after this form was loaded.");
        }

        const accessChanged =
          existing.role.id !== nextRole.id ||
          existing.status !== body.status ||
          Boolean(existing.deletedAt) !== Boolean(body.status === "DELETED");
        if (accessChanged) {
          await tx.session.updateMany({
            where: { userId: existing.id, revokedAt: null },
            data: { status: "REVOKED", revokedAt: now }
          });
        }

        await appendAuditLog({
          client: tx,
          actorId: input.actor.id,
          action: "user.update",
          resourceType: "User",
          resourceId: existing.id,
          metadata: {
            previousStatus: existing.status,
            status: body.status,
            locale: body.locale,
            roleChanged: existing.role.id !== nextRole.id,
            sessionsRevoked: accessChanged
          },
          request: input.request
        });

        const updated = await tx.user.findUnique({ where: { id: existing.id }, select: adminUserDetailSelect });
        if (!updated) {
          throw new ApiError(404, "NOT_FOUND", "User was not found.");
        }
        return toAdminUserDetail(updated);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (isSerializationConflict(error)) {
      throw new ApiError(409, "CONFLICT", "User access changed concurrently. Reload and try again.");
    }
    throw error;
  }
}

export async function updateAdminUserPassword(input: {
  actor: Principal;
  actorSessionId?: string;
  userId: string;
  body: unknown;
  request?: Request;
}) {
  assertPasswordChangePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");
  const body = parseWithSchema(adminUserPasswordUpdateSchema, input.body, "Password payload is invalid.");

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: { select: { name: true } } }
  });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }

  const now = new Date();
  const passwordHash = await hashPassword(body.password);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: existing.id },
      data: { passwordHash }
    });

    if (body.revokeSessions) {
      await tx.session.updateMany({
        where: {
          userId: existing.id,
          revokedAt: null,
          ...(input.actor.id === existing.id && input.actorSessionId ? { id: { not: input.actorSessionId } } : {})
        },
        data: {
          status: "REVOKED",
          revokedAt: now
        }
      });
    }

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "user.password.update",
      resourceType: "User",
      resourceId: existing.id,
      metadata: {
        role: existing.role.name,
        revokeSessions: body.revokeSessions
      },
      request: input.request
    });
  });

  return { id: existing.id, passwordUpdated: true, sessionsRevoked: body.revokeSessions };
}

function parseDateBoundary(value: string | undefined, field: string, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is invalid.`);
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setUTCHours(23, 59, 59, 999);
  }

  return parsed;
}

function auditLogWhere(filters: AdminAuditLogQuery): Prisma.AuditLogWhereInput {
  const search = filters.q?.trim();
  const dateFrom = parseDateBoundary(filters.dateFrom || undefined, "dateFrom");
  const dateTo = parseDateBoundary(filters.dateTo || undefined, "dateTo", true);

  return {
    AND: [
      filters.actorId ? { actorId: filters.actorId } : {},
      filters.action ? { action: { contains: filters.action, mode: "insensitive" } } : {},
      filters.resourceType ? { resourceType: { contains: filters.resourceType, mode: "insensitive" } } : {},
      filters.clientId ? { clientId: filters.clientId } : {},
      filters.caseId ? { caseId: filters.caseId } : {},
      filters.lawyerId ? { lawyerId: filters.lawyerId } : {},
      filters.appointmentId ? { appointmentId: filters.appointmentId } : {},
      filters.documentId ? { documentId: filters.documentId } : {},
      filters.paymentId ? { paymentId: filters.paymentId } : {},
      dateFrom || dateTo ? { createdAt: { gte: dateFrom, lte: dateTo } } : {},
      search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" } },
              { resourceType: { contains: search, mode: "insensitive" } },
              { resourceId: { contains: search, mode: "insensitive" } },
              { actor: { name: { contains: search, mode: "insensitive" } } },
              { actor: { email: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

export async function listAdminAuditLogs(input: { actor: Principal; query: unknown }) {
  assertAuditReadPermission(input.actor);
  const filters = normalizeAuditLogQuery(input.query);
  const pagination = toPagination(filters);
  const where = auditLogWhere(filters);

  const [items, total, filterOptions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, role: { select: { name: true } } } } },
      orderBy: [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.auditLog.count({ where }),
    getAuditFilterOptions()
  ]);

  return { items: items.map(toAdminAuditLogDto), total, filters, page: pagination.page, pageSize: pagination.pageSize, filterOptions };
}

type AuditFilterOptions = {
  actions: AuditFilterOption[];
  resourceTypes: AuditFilterOption[];
  actors: Array<{ id: string; name: string }>;
};

async function getAuditFilterOptions(): Promise<AuditFilterOptions> {
  const [actions, resourceTypes, actors] = await Promise.all([
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" }, take: 100 }),
    prisma.auditLog.findMany({
      distinct: ["resourceType"],
      select: { resourceType: true },
      orderBy: { resourceType: "asc" },
      take: 100
    }),
    prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100
    })
  ]);

  return {
    actions: actions.map((item) => auditFilterOption(item.action, auditActionOptionLabel(item.action))),
    resourceTypes: resourceTypes.map((item) => auditFilterOption(item.resourceType, auditResourceLabel(item.resourceType))),
    actors
  };
}

function normalizeSettingValue(key: SettingKey, value: unknown) {
  switch (key) {
    case "office.profile":
      return parseWithSchema(officeProfileSettingSchema, value, "Office profile setting is invalid.");
    case "security.staff2fa":
      return parseWithSchema(securityStaff2faSettingSchema, value, "Staff 2FA setting is invalid.");
    case "storage.policy":
      return parseWithSchema(storagePolicySettingSchema, value, "Storage policy setting is invalid.");
    case "email.policy":
      return parseWithSchema(emailPolicySettingSchema, value, "Email policy setting is invalid.");
    default:
      throw new ApiError(400, "VALIDATION_ERROR", "Setting key is invalid.");
  }
}

function valueForDefinition(key: SettingKey, value: unknown) {
  return normalizeSettingValue(key, { ...defaultSettingValues[key], ...(typeof value === "object" && value ? value : {}) });
}

export async function listAdminSettings(actor: Principal) {
  assertSettingsManagePermission(actor);
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: settingDefinitions.map((definition) => definition.key) } },
    include: { updatedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { key: "asc" }
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return settingDefinitions.map((definition) => {
    const row = byKey.get(definition.key);
    const value = valueForDefinition(definition.key, row?.value);
    return {
      ...definition,
      value,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null
    };
  });
}

export async function updateAdminSetting(input: { actor: Principal; key: string; body: unknown; request?: Request }) {
  assertSettingsManagePermission(input.actor);
  const key = parseWithSchema(settingKeySchema, input.key, "Setting key is invalid.") as SettingKey;
  if (key === "email.policy") {
    throw new ApiError(403, "FEATURE_DISABLED", "SMTP/email policy management is disabled for this release.");
  }

  const bodyObject = typeof input.body === "object" && input.body !== null ? input.body : {};
  const body = parseWithSchema(adminSettingUpdateSchema, { ...bodyObject, key }, "Setting payload is invalid.");
  const value = normalizeSettingValue(key, body);

  const setting = await prisma.$transaction(async (tx) => {
    const updated = await tx.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: value as Prisma.InputJsonValue,
        updatedById: input.actor.id
      },
      update: {
        value: value as Prisma.InputJsonValue,
        updatedById: input.actor.id
      },
      include: { updatedBy: { select: { id: true, name: true, email: true } } }
    });

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "settings.update",
      resourceType: "SystemSetting",
      resourceId: updated.id,
      metadata: { key: updated.key },
      request: input.request
    });

    return updated;
  });

  return setting;
}
