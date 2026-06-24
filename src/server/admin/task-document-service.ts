import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { documentCategorySchema, documentVisibilitySchema, canReadDocument } from "@/server/storage/document-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { caseScopeWhereForPrincipal, dateFromActionInput } from "./case-operations-service";

const taskStatusSchema = z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED", "OVERDUE", "ARCHIVED"]);
const taskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const taskViewSchema = z.enum(["all", "mine", "overdue"]);
const taskSortBySchema = z.enum(["dueDate", "updatedAt", "createdAt", "priority", "status"]);
const documentStatusSchema = z.enum(["NEW", "UNDER_REVIEW", "NEEDS_CLARIFICATION", "ACCEPTED", "REJECTED", "DELETED"]);
const documentSortBySchema = z.enum(["createdAt", "updatedAt", "fileName", "status", "category"]);
const optionalDateStringSchema = z.string().trim().max(40).optional().or(z.literal(""));

export const adminTaskListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  view: taskViewSchema.default("all"),
  status: taskStatusSchema.optional().or(z.literal("")),
  priority: taskPrioritySchema.optional().or(z.literal("")),
  assignedToId: uuidSchema.optional().or(z.literal("")),
  caseId: uuidSchema.optional().or(z.literal("")),
  sortBy: taskSortBySchema.default("dueDate"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(40)
});

export const adminTaskWriteSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(1200).optional().or(z.literal("")),
  status: taskStatusSchema.default("NEW"),
  priority: taskPrioritySchema.default("NORMAL"),
  assignedToId: uuidSchema.optional().or(z.literal("")),
  caseId: uuidSchema.optional().or(z.literal("")),
  dueDate: optionalDateStringSchema
});

export const adminDocumentListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: documentStatusSchema.optional().or(z.literal("")),
  category: documentCategorySchema.optional().or(z.literal("")),
  visibility: documentVisibilitySchema.optional().or(z.literal("")),
  caseId: uuidSchema.optional().or(z.literal("")),
  ownerClientId: uuidSchema.optional().or(z.literal("")),
  sortBy: documentSortBySchema.default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(40)
});

export const adminDocumentUpdateSchema = z.object({
  status: documentStatusSchema,
  category: documentCategorySchema,
  visibility: documentVisibilitySchema,
  note: z.string().trim().max(500).optional().or(z.literal(""))
});

export const adminDocumentDeleteSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  confirmDelete: z.literal(true, {
    message: "Document delete confirmation is required."
  })
});

export type AdminTaskListQuery = z.infer<typeof adminTaskListQuerySchema>;
export type AdminDocumentListQuery = z.infer<typeof adminDocumentListQuerySchema>;

type TaskPermissionProbe = {
  assignedToId?: string | null;
  case?: { assignedLawyerId?: string | null; deletedAt?: Date | null } | null;
};

type DocumentPermissionProbe = {
  visibility: string;
  ownerClient?: { userId?: string | null; assignedLawyerId?: string | null } | null;
  case?: {
    assignedLawyerId?: string | null;
    client?: { userId?: string | null } | null;
  } | null;
};

export function canListAdminTasks(actor: Principal) {
  return hasPermission(actor, "task.manage.any") || hasPermission(actor, "task.read.assigned") || hasPermission(actor, "task.manage.assigned");
}

export function canCreateAdminTask(actor: Principal) {
  return hasPermission(actor, "task.manage.any") || hasPermission(actor, "task.manage.assigned");
}

export function canReadAdminTask(actor: Principal, task: TaskPermissionProbe) {
  if (hasPermission(actor, "task.manage.any")) {
    return true;
  }

  return (
    (hasPermission(actor, "task.read.assigned") || hasPermission(actor, "task.manage.assigned")) &&
    (task.assignedToId === actor.id || task.case?.assignedLawyerId === actor.id)
  );
}

export function canManageAdminTask(actor: Principal, task: TaskPermissionProbe) {
  if (hasPermission(actor, "task.manage.any")) {
    return true;
  }

  return (
    hasPermission(actor, "task.manage.assigned") &&
    (task.assignedToId === actor.id || task.case?.assignedLawyerId === actor.id)
  );
}

export function taskScopeWhereForPrincipal(actor: Principal): Prisma.TaskWhereInput {
  if (hasPermission(actor, "task.manage.any")) {
    return {};
  }

  if (hasPermission(actor, "task.read.assigned") || hasPermission(actor, "task.manage.assigned")) {
    return {
      OR: [{ assignedToId: actor.id }, { case: { assignedLawyerId: actor.id, deletedAt: null } }]
    };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Task read permission is required.");
}

export function canListAdminDocuments(actor: Principal) {
  return hasPermission(actor, "document.manage.any") || hasPermission(actor, "document.read.assigned");
}

export function canManageAdminDocuments(actor: Principal) {
  return hasPermission(actor, "document.manage.any");
}

export function documentScopeWhereForPrincipal(actor: Principal): Prisma.DocumentWhereInput {
  if (hasPermission(actor, "document.manage.any")) {
    return { deletedAt: null };
  }

  if (hasPermission(actor, "document.read.assigned")) {
    return {
      deletedAt: null,
      OR: [{ ownerClient: { assignedLawyerId: actor.id } }, { case: { assignedLawyerId: actor.id } }]
    };
  }

  throw new ApiError(403, "PERMISSION_DENIED", "Document read permission is required.");
}

function normalizeTaskListQuery(input: unknown) {
  return parseWithSchema(adminTaskListQuerySchema, input, "Task list query is invalid.");
}

function normalizeDocumentListQuery(input: unknown) {
  return parseWithSchema(adminDocumentListQuerySchema, input, "Document list query is invalid.");
}

function taskOrderBy(filters: AdminTaskListQuery): Prisma.TaskOrderByWithRelationInput[] {
  if (filters.sortBy === "dueDate") {
    return [{ dueDate: filters.sortDirection }, { priority: "desc" }, { createdAt: "desc" }];
  }

  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function taskListWhere(actor: Principal, filters: AdminTaskListQuery): Prisma.TaskWhereInput {
  const scope = taskScopeWhereForPrincipal(actor);
  const search = filters.q?.trim();
  const now = new Date();
  const assignedToId =
    filters.assignedToId && hasPermission(actor, "task.manage.any") ? filters.assignedToId : undefined;

  return {
    AND: [
      scope,
      filters.status ? { status: filters.status } : {},
      filters.priority ? { priority: filters.priority } : {},
      assignedToId ? { assignedToId } : {},
      filters.caseId ? { caseId: filters.caseId } : {},
      filters.view === "mine" ? { assignedToId: actor.id } : {},
      filters.view === "overdue" ? { dueDate: { lt: now }, status: { notIn: ["COMPLETED", "ARCHIVED"] } } : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { assignedTo: { name: { contains: search, mode: "insensitive" } } },
              { case: { title: { contains: search, mode: "insensitive" } } },
              { case: { internalFileNumber: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

function documentOrderBy(filters: AdminDocumentListQuery): Prisma.DocumentOrderByWithRelationInput[] {
  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function documentListWhere(actor: Principal, filters: AdminDocumentListQuery): Prisma.DocumentWhereInput {
  const scope = documentScopeWhereForPrincipal(actor);
  const search = filters.q?.trim();
  const ownerClientId =
    filters.ownerClientId && hasPermission(actor, "document.manage.any") ? filters.ownerClientId : undefined;

  return {
    AND: [
      scope,
      filters.status ? { status: filters.status } : {},
      filters.category ? { category: filters.category } : {},
      filters.visibility ? { visibility: filters.visibility } : {},
      filters.caseId ? { caseId: filters.caseId } : {},
      ownerClientId ? { ownerClientId } : {},
      search
        ? {
            OR: [
              { fileName: { contains: search, mode: "insensitive" } },
              { fileType: { contains: search, mode: "insensitive" } },
              { ownerClient: { fullName: { contains: search, mode: "insensitive" } } },
              { case: { title: { contains: search, mode: "insensitive" } } },
              { case: { internalFileNumber: { contains: search, mode: "insensitive" } } },
              { uploadedBy: { name: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

function parseOptionalDate(value?: string | null) {
  return value ? dateFromActionInput(value, "dueDate") : null;
}

async function assertCaseVisible(actor: Principal, caseId: string) {
  const legalCase = await prisma.legalCase.findFirst({
    where: {
      AND: [caseScopeWhereForPrincipal(actor), { id: caseId }]
    },
    select: { id: true, clientId: true, assignedLawyerId: true, deletedAt: true }
  });

  if (!legalCase || legalCase.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Case was not found.");
  }

  return legalCase;
}

async function assertAssignableTaskUser(actor: Principal, assignedToId: string) {
  if (!hasPermission(actor, "task.manage.any") && assignedToId !== actor.id) {
    throw new ApiError(403, "PERMISSION_DENIED", "Assigned task managers can assign tasks only to themselves.");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: assignedToId,
      status: "ACTIVE",
      role: { name: { in: ["Lawyer", "Office Admin", "Super Admin"] } }
    },
    select: { id: true, name: true, email: true }
  });

  if (!user) {
    throw new ApiError(400, "VALIDATION_ERROR", "Task assignee is invalid.");
  }

  return user;
}

async function findTaskForAction(actor: Principal, taskIdInput: string) {
  const taskId = parseWithSchema(uuidSchema, taskIdInput, "Task id is invalid.");
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true, deletedAt: true } }
    }
  });

  if (!task) {
    throw new ApiError(404, "NOT_FOUND", "Task was not found.");
  }
  if (!canReadAdminTask(actor, task)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Task is outside your permission scope.");
  }

  return task;
}

async function findDocumentForAction(actor: Principal, documentIdInput: string) {
  const documentId = parseWithSchema(uuidSchema, documentIdInput, "Document id is invalid.");
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      ownerClient: { select: { id: true, fullName: true, userId: true, assignedLawyerId: true } },
      case: {
        select: {
          id: true,
          internalFileNumber: true,
          title: true,
          assignedLawyerId: true,
          client: { select: { userId: true } }
        }
      },
      uploadedBy: { select: { id: true, name: true, email: true } }
    }
  });

  if (!document || document.deletedAt) {
    throw new ApiError(404, "NOT_FOUND", "Document was not found.");
  }
  if (!canReadDocument(actor, document as DocumentPermissionProbe)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Document is outside your permission scope.");
  }

  return document;
}

export async function listAdminTasks(input: { actor: Principal; query: unknown }) {
  const filters = normalizeTaskListQuery(input.query);
  const pagination = toPagination(filters);
  const where = taskListWhere(input.actor, filters);

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
      },
      orderBy: taskOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.task.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function createAdminTask(input: { actor: Principal; body: unknown; request?: Request }) {
  if (!canCreateAdminTask(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Task create permission is required.");
  }

  const body = parseWithSchema(adminTaskWriteSchema, input.body, "Task payload is invalid.");
  const caseId = body.caseId || null;
  if (caseId) {
    await assertCaseVisible(input.actor, caseId);
  }

  const assignedToId = body.assignedToId || input.actor.id;
  await assertAssignableTaskUser(input.actor, assignedToId);

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description || null,
      status: body.status,
      priority: body.priority,
      assignedToId,
      caseId,
      dueDate: parseOptionalDate(body.dueDate),
      createdById: input.actor.id
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "task.create",
    resourceType: "Task",
    resourceId: task.id,
    metadata: {
      assignedToId: task.assignedToId,
      caseId: task.caseId,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null
    },
    request: input.request
  });

  return task;
}

export async function updateAdminTask(input: { actor: Principal; taskId: string; body: unknown; request?: Request }) {
  const existing = await findTaskForAction(input.actor, input.taskId);
  if (!canManageAdminTask(input.actor, existing)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Task update permission is required.");
  }

  const body = parseWithSchema(adminTaskWriteSchema, input.body, "Task payload is invalid.");
  const caseId = body.caseId || null;
  if (caseId) {
    await assertCaseVisible(input.actor, caseId);
  }

  const assignedToId = body.assignedToId || existing.assignedToId;
  await assertAssignableTaskUser(input.actor, assignedToId);

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      description: body.description || null,
      status: body.status,
      priority: body.priority,
      assignedToId,
      caseId,
      dueDate: parseOptionalDate(body.dueDate)
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "task.update",
    resourceType: "Task",
    resourceId: task.id,
    metadata: {
      previousStatus: existing.status,
      status: task.status,
      previousAssignedToId: existing.assignedToId,
      assignedToId: task.assignedToId,
      previousCaseId: existing.caseId,
      caseId: task.caseId,
      priority: task.priority
    },
    request: input.request
  });

  return task;
}

export async function getAdminTaskOptions(actor: Principal) {
  const [assignees, cases] = await Promise.all([
    hasPermission(actor, "task.manage.any")
      ? prisma.user.findMany({
          where: {
            status: "ACTIVE",
            role: { name: { in: ["Lawyer", "Office Admin", "Super Admin"] } }
          },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" }
        })
      : prisma.user.findMany({
          where: { id: actor.id, status: "ACTIVE" },
          select: { id: true, name: true, email: true }
        }),
    prisma.legalCase.findMany({
      where: caseScopeWhereForPrincipal(actor),
      select: {
        id: true,
        internalFileNumber: true,
        title: true,
        client: { select: { id: true, fullName: true } }
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    })
  ]);

  return { assignees, cases };
}

export async function listAdminDocuments(input: { actor: Principal; query: unknown }) {
  const filters = normalizeDocumentListQuery(input.query);
  const pagination = toPagination(filters);
  const where = documentListWhere(input.actor, filters);

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        ownerClient: { select: { id: true, fullName: true, phone: true, assignedLawyerId: true } },
        case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } },
        uploadedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: documentOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.document.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function getAdminDocumentOptions(actor: Principal) {
  const [cases, clients] = await Promise.all([
    prisma.legalCase.findMany({
      where: caseScopeWhereForPrincipal(actor),
      select: {
        id: true,
        internalFileNumber: true,
        title: true,
        client: { select: { id: true, fullName: true } }
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    }),
    hasPermission(actor, "document.manage.any")
      ? prisma.client.findMany({
          where: { deletedAt: null },
          select: { id: true, fullName: true, phone: true },
          orderBy: { fullName: "asc" },
          take: 100
        })
      : []
  ]);

  return {
    cases,
    clients,
    canManage: canManageAdminDocuments(actor)
  };
}

export async function updateAdminDocument(input: { actor: Principal; documentId: string; body: unknown; request?: Request }) {
  if (!canManageAdminDocuments(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Document management permission is required.");
  }

  const existing = await findDocumentForAction(input.actor, input.documentId);
  const body = parseWithSchema(adminDocumentUpdateSchema, input.body, "Document payload is invalid.");
  const deletedAt = body.status === "DELETED" ? new Date() : null;

  const document = await prisma.document.update({
    where: { id: existing.id },
    data: {
      status: body.status,
      category: body.category,
      visibility: body.visibility,
      deletedAt
    },
    include: {
      ownerClient: { select: { id: true, fullName: true, phone: true, assignedLawyerId: true } },
      case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } },
      uploadedBy: { select: { id: true, name: true, email: true } }
    }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: body.status === "DELETED" ? "document.delete" : "document.update",
    resourceType: "Document",
    resourceId: document.id,
    metadata: {
      previousStatus: existing.status,
      status: document.status,
      previousVisibility: existing.visibility,
      visibility: document.visibility,
      previousCategory: existing.category,
      category: document.category,
      note: body.note || null
    },
    request: input.request
  });

  return document;
}

export async function deleteAdminDocument(input: { actor: Principal; documentId: string; body: unknown; request?: Request }) {
  if (!canManageAdminDocuments(input.actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Document management permission is required.");
  }

  const existing = await findDocumentForAction(input.actor, input.documentId);
  const body = parseWithSchema(adminDocumentDeleteSchema, input.body, "Document delete payload is invalid.");

  const document = await prisma.document.update({
    where: { id: existing.id },
    data: { status: "DELETED", deletedAt: new Date() }
  });

  await appendAuditLog({
    actorId: input.actor.id,
    action: "document.delete",
    resourceType: "Document",
    resourceId: document.id,
    metadata: {
      reason: body.reason || null,
      previousStatus: existing.status,
      visibility: existing.visibility,
      category: existing.category,
      caseId: existing.caseId,
      ownerClientId: existing.ownerClientId
    },
    request: input.request
  });

  return document;
}

export async function getCaseTaskDocumentTabs(input: { actor: Principal; caseId: string }) {
  const caseId = parseWithSchema(uuidSchema, input.caseId, "Case id is invalid.");
  const legalCase = await assertCaseVisible(input.actor, caseId);

  const [tasks, documents, options] = await Promise.all([
    prisma.task.findMany({
      where: {
        AND: [taskScopeWhereForPrincipal(input.actor), { caseId }]
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } }
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    }),
    prisma.document.findMany({
      where: {
        AND: [documentScopeWhereForPrincipal(input.actor), { caseId }]
      },
      include: {
        ownerClient: { select: { id: true, fullName: true, phone: true, assignedLawyerId: true } },
        case: { select: { id: true, internalFileNumber: true, title: true, assignedLawyerId: true } },
        uploadedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    getAdminTaskOptions(input.actor)
  ]);

  return {
    caseId: legalCase.id,
    tasks,
    documents,
    options,
    access: {
      canCreateTask: canCreateAdminTask(input.actor),
      canManageDocuments: canManageAdminDocuments(input.actor)
    }
  };
}
