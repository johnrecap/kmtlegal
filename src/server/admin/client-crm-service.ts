import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hashPassword } from "@/server/auth/password";
import { canReadClient, hasPermission, ROLES, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { emailSchema, parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const clientStatusSchema = z.enum(["LEAD", "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"]);
const editableClientStatusSchema = z.enum(["LEAD", "ACTIVE", "INACTIVE", "ARCHIVED"]);
const clientSortBySchema = z.enum(["createdAt", "updatedAt", "fullName", "status"]);

export const adminClientListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: clientStatusSchema.optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  assignedLawyerId: uuidSchema.optional().or(z.literal("")),
  sortBy: clientSortBySchema.default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20)
});

export const adminClientWriteSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: emailSchema.optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional().or(z.literal("")),
  status: editableClientStatusSchema.default("LEAD"),
  assignedLawyerId: uuidSchema.optional().or(z.literal(""))
});

export const assignClientSchema = z.object({
  assignedLawyerId: uuidSchema.optional().or(z.literal(""))
});

export const archiveClientSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal(""))
});

export const clientAccountCreateSchema = z.object({
  email: emailSchema,
  password: z.string().min(10).max(256),
  locale: z.enum(["ar", "en"]).default("ar")
});

export const clientAccountPasswordSchema = z.object({
  password: z.string().min(10).max(256),
  revokeSessions: z.coerce.boolean().default(true)
});

export type AdminClientListQuery = z.infer<typeof adminClientListQuerySchema>;
export type AdminClientWriteInput = z.infer<typeof adminClientWriteSchema>;

type ClientProfileUserProbe = {
  role: { name: string };
  status: string;
  phone?: string | null;
  clientProfile?: { id: string } | null;
};

export function canListAdminClients(actor: Principal) {
  return hasPermission(actor, "client.read.any") || hasPermission(actor, "client.read.assigned");
}

export function canManageAdminClients(actor: Principal) {
  return hasPermission(actor, "client.update.any");
}

export function canManageClientAccounts(actor: Principal) {
  return hasPermission(actor, "client.account.manage");
}

export function clientScopeWhereForPrincipal(actor: Principal): Prisma.ClientWhereInput {
  if (hasPermission(actor, "client.read.any")) {
    return { deletedAt: null };
  }

  if (hasPermission(actor, "client.read.assigned")) {
    return { deletedAt: null, assignedLawyerId: actor.id };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Client CRM read permission is required.");
}

export function canReadAdminClient(actor: Principal, client: { userId?: string | null; assignedLawyerId?: string | null }) {
  return canReadClient(actor, client);
}

function normalizeListQuery(input: unknown) {
  return parseWithSchema(adminClientListQuerySchema, input, "Client list query is invalid.");
}

function orderByFor(filters: AdminClientListQuery): Prisma.ClientOrderByWithRelationInput[] {
  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function clientListWhere(actor: Principal, filters: AdminClientListQuery): Prisma.ClientWhereInput {
  const scope = clientScopeWhereForPrincipal(actor);
  const search = filters.q?.trim();
  const status = filters.status || undefined;
  const source = filters.source?.trim() || undefined;
  const assignedLawyerId =
    filters.assignedLawyerId && hasPermission(actor, "client.read.any") ? filters.assignedLawyerId : undefined;

  return {
    AND: [
      scope,
      status ? { status } : {},
      source ? { source } : {},
      assignedLawyerId ? { assignedLawyerId } : {},
      search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };
}

export async function listAdminClients(input: { actor: Principal; query: unknown }) {
  const filters = normalizeListQuery(input.query);
  const pagination = toPagination(filters);
  const where = clientListWhere(input.actor, filters);

  const [items, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        assignedLawyer: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            cases: true,
            appointments: true,
            documents: true,
            consultationRequests: true
          }
        }
      },
      orderBy: orderByFor(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.client.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function getAdminClientFilterOptions(actor: Principal) {
  const scope = clientScopeWhereForPrincipal(actor);
  const [sources, lawyers] = await Promise.all([
    prisma.client.findMany({
      where: {
        AND: [scope, { source: { not: null } }]
      },
      distinct: ["source"],
      select: { source: true },
      orderBy: { source: "asc" }
    }),
    hasPermission(actor, "client.read.any") || hasPermission(actor, "client.update.any") ? listAssignableClientLawyers() : []
  ]);

  return {
    sources: sources.map((item) => item.source).filter((source): source is string => Boolean(source)),
    lawyers,
    canManage: canManageAdminClients(actor)
  };
}

export async function getAdminClientDetail(input: { actor: Principal; clientId: string }) {
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const permissionProbe = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, userId: true, assignedLawyerId: true, deletedAt: true }
  });

  if (!permissionProbe || permissionProbe.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }
  if (!canReadAdminClient(input.actor, permissionProbe)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client record is not allowed.");
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { id: true, email: true, phone: true, status: true, locale: true } },
      assignedLawyer: { select: { id: true, name: true, email: true } },
      cases: {
        where: { deletedAt: null },
        orderBy: [{ nextSessionAt: "asc" }, { createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          internalFileNumber: true,
          title: true,
          caseType: true,
          status: true,
          priority: true,
          nextSessionAt: true,
          assignedLawyer: { select: { id: true, name: true } }
        }
      },
      consultationRequests: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          serviceCategory: true,
          urgency: true,
          status: true,
          createdAt: true,
          assignedLawyer: { select: { id: true, name: true } }
        }
      },
      appointments: {
        orderBy: { startsAt: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          type: true,
          mode: true,
          startsAt: true,
          status: true,
          lawyer: { select: { id: true, name: true } },
          case: { select: { id: true, internalFileNumber: true, title: true } }
        }
      },
      _count: {
        select: {
          cases: true,
          appointments: true,
          documents: true,
          consultationRequests: true
        }
      }
    }
  });

  if (!client) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }

  return client;
}

export async function listAssignableClientLawyers() {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { name: "Lawyer" }
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" }
  });
}

async function assertAssignableLawyer(userId?: string | null) {
  if (!userId) {
    return null;
  }

  const lawyer = await prisma.user.findFirst({
    where: {
      id: userId,
      status: "ACTIVE",
      role: { name: "Lawyer" }
    },
    select: { id: true }
  });

  if (!lawyer) {
    throw new ApiError(400, "VALIDATION_ERROR", "Assigned lawyer is invalid.");
  }

  return lawyer;
}

function assertClientManagePermission(actor: Principal) {
  if (!canManageAdminClients(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client write permission is required.");
  }
}

function assertClientAccountManagePermission(actor: Principal) {
  if (!canManageClientAccounts(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client account management permission is required.");
  }
}

export function assertClientProfileCanBeCreatedForUser(user: ClientProfileUserProbe) {
  if (user.role.name !== ROLES.client) {
    throw new ApiError(409, "CONFLICT", "Only Client role accounts can be linked to client CRM profiles.");
  }
  if (user.status === "DELETED") {
    throw new ApiError(409, "CONFLICT", "Deleted user accounts cannot be linked to client CRM profiles.");
  }
  if (user.clientProfile) {
    throw new ApiError(409, "CONFLICT", "User already has a linked client CRM profile.");
  }
  if (!user.phone?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client phone is required before creating a CRM profile.");
  }
}

function writeData(body: AdminClientWriteInput) {
  return {
    fullName: body.fullName,
    phone: body.phone,
    phoneCanonical: canonicalPhone(body.phone),
    email: body.email || null,
    city: body.city || null,
    source: body.source || null,
    status: body.status,
    assignedLawyerId: body.assignedLawyerId || null
  };
}

export async function createAdminClient(input: { actor: Principal; body: unknown; request?: Request }) {
  assertClientManagePermission(input.actor);
  const body = parseWithSchema(adminClientWriteSchema, input.body, "Client payload is invalid.");
  await assertAssignableLawyer(body.assignedLawyerId || null);

  const client = await prisma.client.create({
    data: writeData(body),
    include: {
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.create",
    resourceType: "Client",
    resourceId: client.id,
    clientId: client.id,
    lawyerId: client.assignedLawyerId,
    metadata: {
      status: client.status,
      source: client.source,
      assignedLawyerId: client.assignedLawyerId
    },
    request: input.request
  });

  return client;
}

export async function updateAdminClient(input: { actor: Principal; clientId: string; body: unknown; request?: Request }) {
  assertClientManagePermission(input.actor);
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const body = parseWithSchema(adminClientWriteSchema, input.body, "Client payload is invalid.");
  await assertAssignableLawyer(body.assignedLawyerId || null);

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true, assignedLawyerId: true, deletedAt: true }
  });

  if (!existing || existing.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: writeData(body),
    include: {
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.update",
    resourceType: "Client",
    resourceId: clientId,
    clientId,
    lawyerId: client.assignedLawyerId,
    metadata: {
      previousStatus: existing.status,
      status: client.status,
      previousAssignedLawyerId: existing.assignedLawyerId,
      assignedLawyerId: client.assignedLawyerId
    },
    request: input.request
  });

  return client;
}

export async function assignAdminClient(input: { actor: Principal; clientId: string; body: unknown; request?: Request }) {
  assertClientManagePermission(input.actor);
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const body = parseWithSchema(assignClientSchema, input.body, "Client assignment payload is invalid.");
  await assertAssignableLawyer(body.assignedLawyerId || null);

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, assignedLawyerId: true, deletedAt: true }
  });

  if (!existing || existing.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { assignedLawyerId: body.assignedLawyerId || null },
    include: {
      assignedLawyer: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.assign",
    resourceType: "Client",
    resourceId: clientId,
    clientId,
    lawyerId: client.assignedLawyerId,
    metadata: {
      previousAssignedLawyerId: existing.assignedLawyerId,
      assignedLawyerId: client.assignedLawyerId
    },
    request: input.request
  });

  return client;
}

export async function archiveAdminClient(input: { actor: Principal; clientId: string; body: unknown; request?: Request }) {
  assertClientManagePermission(input.actor);
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const body = parseWithSchema(archiveClientSchema, input.body, "Client archive payload is invalid.");

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true, deletedAt: true }
  });

  if (!existing || existing.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }
  if (existing.status === "ARCHIVED") {
    throw new ApiError(409, "CONFLICT", "Client is already archived.");
  }

  const client = await prisma.client.update({
    where: { id: clientId },
    data: { status: "ARCHIVED" }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.archive",
    resourceType: "Client",
    resourceId: clientId,
    clientId,
    metadata: {
      previousStatus: existing.status,
      status: client.status,
      reason: body.reason || null
    },
    request: input.request
  });

  return client;
}

export async function createOrLinkClientPortalAccount(input: { actor: Principal; clientId: string; body: unknown; request?: Request }) {
  assertClientAccountManagePermission(input.actor);
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const body = parseWithSchema(clientAccountCreateSchema, input.body, "Client account payload is invalid.");

  const existingClient = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { id: true, email: true, role: { select: { name: true } } } }
    }
  });

  if (!existingClient || existingClient.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }
  if (existingClient.userId) {
    throw new ApiError(409, "CONFLICT", "Client already has a portal account.");
  }

  const clientRole = await prisma.role.findUnique({
    where: { name: ROLES.client },
    select: { id: true }
  });

  if (!clientRole) {
    throw new ApiError(500, "INTERNAL_ERROR", "Client role is missing. Run production seed first.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
    include: {
      role: { select: { name: true } },
      clientProfile: { select: { id: true } }
    }
  });

  if (existingUser && existingUser.role.name !== ROLES.client) {
    throw new ApiError(409, "CONFLICT", "Email is already used by a staff account.");
  }
  if (existingUser?.clientProfile && existingUser.clientProfile.id !== clientId) {
    throw new ApiError(409, "CONFLICT", "Email is already linked to another client.");
  }

  const passwordHash = await hashPassword(body.password);
  const result = await prisma.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: existingClient.fullName,
            phone: existingClient.phone,
            passwordHash,
            status: "ACTIVE",
            locale: body.locale
          }
        })
      : await tx.user.create({
          data: {
            email: body.email,
            name: existingClient.fullName,
            phone: existingClient.phone,
            passwordHash,
            roleId: clientRole.id,
            status: "ACTIVE",
            locale: body.locale
          }
        });

    const client = await tx.client.update({
      where: { id: clientId },
      data: {
        userId: user.id,
        email: body.email,
        status: existingClient.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE"
      },
      include: {
        user: { select: { id: true, email: true, phone: true, status: true, locale: true } },
        assignedLawyer: { select: { id: true, name: true, email: true } }
      }
    });

    return { client, user, linkedExistingUser: Boolean(existingUser) };
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.account.create",
    resourceType: "Client",
    resourceId: clientId,
    clientId,
    metadata: {
      userId: result.user.id,
      email: result.user.email,
      linkedExistingUser: result.linkedExistingUser,
      targetRole: ROLES.client
    },
    request: input.request
  });

  return result.client;
}

export async function createClientProfileForPortalUser(input: { actor: Principal; userId: string; request?: Request }) {
  assertClientAccountManagePermission(input.actor);
  const userId = parseWithSchema(uuidSchema, input.userId, "User id is invalid.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { select: { name: true } },
      clientProfile: { select: { id: true } }
    }
  });

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "User was not found.");
  }

  assertClientProfileCanBeCreatedForUser(user);

  const phoneCanonical = canonicalPhone(user.phone!);
  const matchConditions: Prisma.ClientWhereInput[] = [{ email: user.email }];
  if (phoneCanonical) {
    matchConditions.push({ phoneCanonical });
  }

  const matches = await prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: matchConditions
    },
    select: { id: true, userId: true, email: true, phoneCanonical: true },
    take: 3
  });

  const linkedMatch = matches.find((client) => client.userId && client.userId !== user.id);
  if (linkedMatch) {
    throw new ApiError(409, "CONFLICT", "A matching client CRM profile is already linked to another account.");
  }

  const unlinkedMatches = matches.filter((client) => !client.userId);
  if (unlinkedMatches.length > 1) {
    throw new ApiError(409, "CONFLICT", "Multiple matching client CRM profiles were found. Open the correct client profile and link the account there.");
  }

  const client = unlinkedMatches[0]
    ? await prisma.client.update({
        where: { id: unlinkedMatches[0].id },
        data: {
          userId: user.id,
          fullName: user.name,
          phone: user.phone!,
          phoneCanonical,
          email: user.email,
          status: "ACTIVE"
        },
        include: {
          user: { select: { id: true, email: true, phone: true, status: true, locale: true } },
          assignedLawyer: { select: { id: true, name: true, email: true } }
        }
      })
    : await prisma.client.create({
        data: {
          userId: user.id,
          fullName: user.name,
          phone: user.phone!,
          phoneCanonical,
          email: user.email,
          source: "user-account",
          status: "ACTIVE"
        },
        include: {
          user: { select: { id: true, email: true, phone: true, status: true, locale: true } },
          assignedLawyer: { select: { id: true, name: true, email: true } }
        }
      });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.account.link_profile",
    resourceType: "Client",
    resourceId: client.id,
    clientId: client.id,
    metadata: {
      userId: user.id,
      email: user.email,
      linkedExistingClient: Boolean(unlinkedMatches[0]),
      source: "admin-user-detail"
    },
    request: input.request
  });

  return client;
}

export async function resetClientPortalAccountPassword(input: { actor: Principal; clientId: string; body: unknown; request?: Request }) {
  assertClientAccountManagePermission(input.actor);
  const clientId = parseWithSchema(uuidSchema, input.clientId, "Client id is invalid.");
  const body = parseWithSchema(clientAccountPasswordSchema, input.body, "Client account password payload is invalid.");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { include: { role: { select: { name: true } } } }
    }
  });

  if (!client || client.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Client was not found.");
  }
  if (!client.user) {
    throw new ApiError(404, "NOT_FOUND", "Client has no portal account.");
  }
  if (client.user.role.name !== ROLES.client) {
    throw new ApiError(409, "CONFLICT", "Linked account is not a client account.");
  }

  const passwordHash = await hashPassword(body.password);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: client.user!.id },
      data: { passwordHash, status: "ACTIVE" }
    });

    if (body.revokeSessions) {
      await tx.session.updateMany({
        where: { userId: client.user!.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "client.account.password_reset",
    resourceType: "Client",
    resourceId: clientId,
    clientId,
    metadata: {
      userId: client.user.id,
      email: client.user.email,
      sessionsRevoked: body.revokeSessions,
      targetRole: ROLES.client
    },
    request: input.request
  });

  return { id: clientId, passwordUpdated: true, sessionsRevoked: body.revokeSessions };
}
