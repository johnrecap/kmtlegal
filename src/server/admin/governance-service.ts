import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { auditActionOptionLabel, auditFilterOption, auditResourceLabel, toAdminAuditLogDto, type AuditFilterOption } from "@/server/audit/audit-event-catalog";
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
  locale: localeSchema
});

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

function userListWhere(filters: AdminUserListQuery): Prisma.UserWhereInput {
  const search = filters.q?.trim();

  return {
    AND: [
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

export async function listAdminUsers(input: { actor: Principal; query: unknown }) {
  assertUserManagePermission(input.actor);
  const filters = normalizeUserListQuery(input.query);
  const pagination = toPagination(filters);
  const where = userListWhere(filters);

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: { select: { id: true, name: true } },
        twoFactorCredential: { select: { recoveryState: true, enabledAt: true, lastVerifiedAt: true } },
        _count: { select: { sessions: true, auditLogs: true, assignedCases: true, assignedTasks: true } }
      },
      orderBy: userOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.user.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function getAdminUserOptions(actor: Principal) {
  assertUserManagePermission(actor);
  const roles = await prisma.role.findMany({
    where: { status: "ACTIVE", name: { not: "Guest" } },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" }
  });

  return {
    roles,
    statuses: ["INVITED", "ACTIVE", "SUSPENDED", "DELETED"] as const,
    twoFactorStates: ["PENDING_SETUP", "ENABLED", "RESET_REQUIRED", "DISABLED_BY_ADMIN"] as const
  };
}

export async function createAdminUser(input: { actor: Principal; body: unknown; request?: Request }) {
  assertUserCreatePermission(input.actor);
  const body = parseWithSchema(adminUserCreateSchema, input.body, "User create payload is invalid.");
  const nextRole = await assertAssignableRole(body.roleId);

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true }
  });

  if (existing) {
    throw new ApiError(409, "CONFLICT", "A user with this email already exists.");
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.$transaction(async (tx) => {
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
      include: {
        role: { select: { id: true, name: true } },
        twoFactorCredential: { select: { recoveryState: true, enabledAt: true, lastVerifiedAt: true } },
        _count: { select: { sessions: true, auditLogs: true, assignedCases: true, assignedTasks: true } }
      }
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

  return user;
}

export async function getAdminUserDetail(input: { actor: Principal; userId: string }) {
  assertUserManagePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            },
            orderBy: { permission: { key: "asc" } }
          }
        }
      },
      twoFactorCredential: true,
      sessions: {
        orderBy: { createdAt: "desc" },
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
        orderBy: { createdAt: "desc" },
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
      lawyerProfile: { select: { id: true, title: true, isPublic: true, bookingEnabled: true } },
      _count: { select: { sessions: true, auditLogs: true, assignedCases: true, assignedTasks: true } }
    }
  });

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }

  return {
    ...user,
    auditLogs: user.auditLogs.map(toAdminAuditLogDto)
  };
}

async function assertAssignableRole(roleId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, status: "ACTIVE", name: { not: "Guest" } },
    select: { id: true, name: true }
  });

  if (!role) {
    throw new ApiError(400, "VALIDATION_ERROR", "Role is invalid.");
  }

  return role;
}

function ensureSelfAdminNotLocked(input: {
  actor: Principal;
  targetUserId: string;
  existingRoleName: string;
  nextRoleName: string;
  nextStatus: string;
}) {
  if (input.actor.id !== input.targetUserId) {
    return;
  }

  if (input.nextStatus !== "ACTIVE" || input.existingRoleName !== input.nextRoleName) {
    throw new ApiError(409, "CONFLICT", "You cannot change your own active Super Admin access.");
  }
}

export async function updateAdminUser(input: { actor: Principal; userId: string; body: unknown; request?: Request }) {
  assertUserManagePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");
  const body = parseWithSchema(adminUserUpdateSchema, input.body, "User payload is invalid.");
  const nextRole = await assertAssignableRole(body.roleId);

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { id: true, name: true } }, twoFactorCredential: true }
  });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }

  ensureSelfAdminNotLocked({
    actor: input.actor,
    targetUserId: existing.id,
    existingRoleName: existing.role.name,
    nextRoleName: nextRole.name,
    nextStatus: body.status
  });

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        phone: body.phone || null,
        roleId: nextRole.id,
        status: body.status,
        locale: body.locale,
        deletedAt: body.status === "DELETED" ? new Date() : null
      },
      include: {
        role: { select: { id: true, name: true } },
        twoFactorCredential: { select: { recoveryState: true, enabledAt: true, lastVerifiedAt: true } },
        _count: { select: { sessions: true, auditLogs: true, assignedCases: true, assignedTasks: true } }
      }
    });

    await appendAuditLog({
      client: tx,
      actorId: input.actor.id,
      action: "user.update",
      resourceType: "User",
      resourceId: updated.id,
      metadata: {
        previousRole: existing.role.name,
        role: updated.role.name,
        previousStatus: existing.status,
        status: updated.status,
        locale: updated.locale
      },
      request: input.request
    });

    return updated;
  });

  return user;
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
