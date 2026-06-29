import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { assertClientPortalAccess } from "@/server/portal/client-portal-service";
import { enforceRateLimit, rateLimiters } from "@/server/rate-limit/memory-rate-limit";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

export const conversationThreadStatusSchema = z.enum(["OPEN", "WAITING_STAFF", "WAITING_CLIENT", "CLOSED", "ARCHIVED"]);

export const conversationMessageCreateSchema = z
  .object({
    message: z.string().trim().min(1).max(2000)
  })
  .strict();

export const clientConversationCreateSchema = conversationMessageCreateSchema.extend({
  subject: z.string().trim().max(120).optional().or(z.literal(""))
});

export const adminConversationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: conversationThreadStatusSchema.optional().or(z.literal("")),
  assignedToId: uuidSchema.optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

export const adminConversationUpdateSchema = z
  .object({
    status: conversationThreadStatusSchema.optional(),
    assignedToId: uuidSchema.nullish().or(z.literal(""))
  })
  .strict()
  .refine((value) => value.status !== undefined || value.assignedToId !== undefined, {
    message: "At least one conversation update field is required."
  });

export type AdminConversationListQuery = z.infer<typeof adminConversationListQuerySchema>;

const ACTIVE_THREAD_STATUSES = ["OPEN", "WAITING_STAFF", "WAITING_CLIENT"] as const;
const ASSIGNABLE_ROLE_NAMES = ["Secretary", "Office Admin", "Super Admin"] as const;

const listThreadInclude = {
  client: { select: { id: true, fullName: true, phone: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  messages: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      senderType: true,
      body: true,
      createdAt: true,
      senderUser: { select: { id: true, name: true } }
    }
  }
} satisfies Prisma.ConversationThreadInclude;

const detailThreadInclude = {
  client: { select: { id: true, fullName: true, phone: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
  messages: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderType: true,
      body: true,
      createdAt: true,
      senderUser: { select: { id: true, name: true } }
    }
  }
} satisfies Prisma.ConversationThreadInclude;

type ListThread = Prisma.ConversationThreadGetPayload<{ include: typeof listThreadInclude }>;
type DetailThread = Prisma.ConversationThreadGetPayload<{ include: typeof detailThreadInclude }>;
type ThreadMessage = DetailThread["messages"][number] | ListThread["messages"][number];

export function canUseClientConversations(actor: Principal) {
  return Boolean(
    actor.clientId &&
      hasPermission(actor, "conversation.read.own") &&
      hasPermission(actor, "conversation.create.own") &&
      hasPermission(actor, "conversation.reply.own")
  );
}

export function canReadAdminConversations(actor: Principal) {
  return hasPermission(actor, "conversation.read.any") || hasPermission(actor, "conversation.manage.any");
}

export function canReplyAdminConversations(actor: Principal) {
  return hasPermission(actor, "conversation.reply.any") || hasPermission(actor, "conversation.manage.any");
}

export function canAssignAdminConversations(actor: Principal) {
  return hasPermission(actor, "conversation.assign.any") || hasPermission(actor, "conversation.manage.any");
}

export function canManageAdminConversations(actor: Principal) {
  return hasPermission(actor, "conversation.manage.any");
}

function assertClientConversationAccess(actor: Principal) {
  const clientId = assertClientPortalAccess(actor);
  if (!canUseClientConversations(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Client conversation permission is required.");
  }
  return clientId;
}

function assertAdminConversationRead(actor: Principal) {
  if (!canReadAdminConversations(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Conversation read permission is required.");
  }
}

function assertAdminConversationReply(actor: Principal) {
  if (!canReplyAdminConversations(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Conversation reply permission is required.");
  }
}

function assertAdminConversationAssign(actor: Principal) {
  if (!canAssignAdminConversations(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Conversation assignment permission is required.");
  }
}

function assertAdminConversationManage(actor: Principal) {
  if (!canManageAdminConversations(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Conversation management permission is required.");
  }
}

function normalizeThreadId(threadId: string) {
  return parseWithSchema(uuidSchema, threadId, "Conversation thread id is invalid.");
}

function normalizeMessageBody(body: unknown) {
  return parseWithSchema(conversationMessageCreateSchema, body, "Conversation message payload is invalid.");
}

function serializeMessage(message: ThreadMessage) {
  return {
    id: message.id,
    senderType: message.senderType,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    senderUser: message.senderUser ? { id: message.senderUser.id, name: message.senderUser.name } : null
  };
}

function serializeThread(thread: ListThread | DetailThread) {
  const messages = "messages" in thread ? thread.messages.map(serializeMessage) : [];
  return {
    id: thread.id,
    status: thread.status,
    subject: thread.subject,
    client: {
      id: thread.client.id,
      fullName: thread.client.fullName,
      phone: thread.client.phone,
      email: thread.client.email
    },
    assignedTo: thread.assignedTo ? { id: thread.assignedTo.id, name: thread.assignedTo.name, email: thread.assignedTo.email } : null,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    closedAt: thread.closedAt?.toISOString() ?? null,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    latestMessage: messages.length ? messages[messages.length - 1] : null,
    messages
  };
}

function adminConversationWhere(filters: AdminConversationListQuery): Prisma.ConversationThreadWhereInput {
  const search = filters.q?.trim();
  return {
    AND: [
      filters.status ? { status: filters.status } : {},
      filters.assignedToId ? { assignedToId: filters.assignedToId } : {},
      search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" } },
              { client: { fullName: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search, mode: "insensitive" } } },
              { client: { email: { contains: search, mode: "insensitive" } } },
              { messages: { some: { body: { contains: search, mode: "insensitive" } } } }
            ]
          }
        : {}
    ]
  };
}

async function findClientThreadOrThrow(actor: Principal, threadIdInput: string) {
  const clientId = assertClientConversationAccess(actor);
  const threadId = normalizeThreadId(threadIdInput);
  const thread = await prisma.conversationThread.findFirst({
    where: { id: threadId, clientId },
    include: detailThreadInclude
  });

  if (!thread) {
    throw new ApiError(404, "NOT_FOUND", "Conversation thread was not found.");
  }

  return thread;
}

async function findAdminThreadOrThrow(threadIdInput: string) {
  const threadId = normalizeThreadId(threadIdInput);
  const thread = await prisma.conversationThread.findUnique({
    where: { id: threadId },
    include: detailThreadInclude
  });

  if (!thread) {
    throw new ApiError(404, "NOT_FOUND", "Conversation thread was not found.");
  }

  return thread;
}

function assertThreadIsReplyable(status: string) {
  if (status === "CLOSED" || status === "ARCHIVED") {
    throw new ApiError(409, "CONFLICT", "Conversation thread is closed.");
  }
}

export async function listClientConversations(input: { actor: Principal }) {
  const clientId = assertClientConversationAccess(input.actor);
  const items = await prisma.conversationThread.findMany({
    where: { clientId },
    include: listThreadInclude,
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 20
  });

  return { items: items.map(serializeThread) };
}

export async function createOrContinueClientConversation(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  const clientId = assertClientConversationAccess(input.actor);
  enforceRateLimit(rateLimiters.conversation, `client:${input.actor.id}`);
  const body = parseWithSchema(clientConversationCreateSchema, input.body, "Conversation message payload is invalid.");

  const updatedThread = await prisma.$transaction(async (tx) => {
    const existing = await tx.conversationThread.findFirst({
      where: { clientId, status: { in: [...ACTIVE_THREAD_STATUSES] } },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }]
    });

    const thread =
      existing ??
      (await tx.conversationThread.create({
        data: {
          clientId,
          subject: body.subject?.trim() || "Client team conversation",
          status: "OPEN"
        }
      }));

    const message = await tx.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderType: "CLIENT",
        senderUserId: input.actor.id,
        body: body.message
      }
    });

    return tx.conversationThread.update({
      where: { id: thread.id },
      data: {
        status: "WAITING_STAFF",
        lastMessageAt: message.createdAt,
        closedAt: null
      },
      include: detailThreadInclude
    });
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "conversation.client_message",
    resourceType: "ConversationThread",
    resourceId: updatedThread.id,
    clientId,
    metadata: { status: updatedThread.status },
    request: input.request,
    requestId: input.requestId
  });

  return serializeThread(updatedThread);
}

export async function getClientConversationDetail(input: { actor: Principal; threadId: string }) {
  const thread = await findClientThreadOrThrow(input.actor, input.threadId);
  return serializeThread(thread);
}

export async function replyClientConversation(input: {
  actor: Principal;
  threadId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  const clientId = assertClientConversationAccess(input.actor);
  enforceRateLimit(rateLimiters.conversation, `client:${input.actor.id}`);
  const thread = await findClientThreadOrThrow(input.actor, input.threadId);
  assertThreadIsReplyable(thread.status);
  const body = normalizeMessageBody(input.body);

  const updatedThread = await prisma.$transaction(async (tx) => {
    const message = await tx.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderType: "CLIENT",
        senderUserId: input.actor.id,
        body: body.message
      }
    });

    return tx.conversationThread.update({
      where: { id: thread.id },
      data: {
        status: "WAITING_STAFF",
        lastMessageAt: message.createdAt,
        closedAt: null
      },
      include: detailThreadInclude
    });
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "conversation.client_reply",
    resourceType: "ConversationThread",
    resourceId: updatedThread.id,
    clientId,
    metadata: { status: updatedThread.status },
    request: input.request,
    requestId: input.requestId
  });

  return serializeThread(updatedThread);
}

export async function listAdminConversations(input: { actor: Principal; query: unknown }) {
  assertAdminConversationRead(input.actor);
  const filters = parseWithSchema(adminConversationListQuerySchema, input.query, "Conversation list query is invalid.");
  const pagination = toPagination(filters);
  const where = adminConversationWhere(filters);
  const [items, total] = await Promise.all([
    prisma.conversationThread.findMany({
      where,
      include: listThreadInclude,
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.conversationThread.count({ where })
  ]);

  return {
    items: items.map(serializeThread),
    total,
    filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

export async function getAdminConversationDetail(input: { actor: Principal; threadId: string }) {
  assertAdminConversationRead(input.actor);
  const thread = await findAdminThreadOrThrow(input.threadId);
  return serializeThread(thread);
}

export async function replyAdminConversation(input: {
  actor: Principal;
  threadId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  assertAdminConversationReply(input.actor);
  enforceRateLimit(rateLimiters.conversation, `staff:${input.actor.id}`);
  const thread = await findAdminThreadOrThrow(input.threadId);
  assertThreadIsReplyable(thread.status);
  const body = normalizeMessageBody(input.body);

  const updatedThread = await prisma.$transaction(async (tx) => {
    const message = await tx.conversationMessage.create({
      data: {
        threadId: thread.id,
        senderType: "STAFF",
        senderUserId: input.actor.id,
        body: body.message
      }
    });

    return tx.conversationThread.update({
      where: { id: thread.id },
      data: {
        status: "WAITING_CLIENT",
        lastMessageAt: message.createdAt,
        closedAt: null
      },
      include: detailThreadInclude
    });
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "conversation.staff_reply",
    resourceType: "ConversationThread",
    resourceId: updatedThread.id,
    clientId: updatedThread.clientId,
    metadata: { status: updatedThread.status },
    request: input.request,
    requestId: input.requestId
  });

  return serializeThread(updatedThread);
}

export async function updateAdminConversation(input: {
  actor: Principal;
  threadId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  const body = parseWithSchema(adminConversationUpdateSchema, input.body, "Conversation update payload is invalid.");
  const thread = await findAdminThreadOrThrow(input.threadId);

  if (body.assignedToId !== undefined) {
    assertAdminConversationAssign(input.actor);
  }
  if (body.status !== undefined) {
    assertAdminConversationManage(input.actor);
  }

  if (body.assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: body.assignedToId,
        status: "ACTIVE",
        role: { name: { in: [...ASSIGNABLE_ROLE_NAMES] } }
      },
      select: { id: true }
    });
    if (!assignee) {
      throw new ApiError(400, "BAD_REQUEST", "Selected assignee is not available for client messages.");
    }
  }

  const updateData: Prisma.ConversationThreadUpdateInput = {};
  if (body.assignedToId !== undefined) {
    updateData.assignedTo = body.assignedToId ? { connect: { id: body.assignedToId } } : { disconnect: true };
  }
  if (body.status !== undefined) {
    updateData.status = body.status;
    updateData.closedAt = body.status === "CLOSED" || body.status === "ARCHIVED" ? new Date() : null;
  }

  const updated = await prisma.conversationThread.update({
    where: { id: thread.id },
    data: updateData,
    include: detailThreadInclude
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "conversation.admin_update",
    resourceType: "ConversationThread",
    resourceId: updated.id,
    clientId: updated.clientId,
    metadata: {
      previousStatus: thread.status,
      status: updated.status,
      previousAssignedToId: thread.assignedToId,
      assignedToId: updated.assignedToId
    },
    request: input.request,
    requestId: input.requestId
  });

  return serializeThread(updated);
}

export async function listConversationAssignees(input: { actor: Principal }) {
  assertAdminConversationRead(input.actor);
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: { name: { in: [...ASSIGNABLE_ROLE_NAMES] } }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } }
    },
    orderBy: [{ role: { name: "asc" } }, { name: "asc" }]
  });
}
