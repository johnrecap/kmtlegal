import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { contactTopicSchema } from "@/server/contact/contact-message-service";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

const contactMessageStatusSchema = z.enum(["NEW", "REVIEWED", "ARCHIVED"]);
const contactMessageSortBySchema = z.enum(["createdAt", "status", "topic"]);

export const adminContactMessageListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: contactMessageStatusSchema.optional().or(z.literal("")),
  topic: contactTopicSchema.optional().or(z.literal("")),
  sortBy: contactMessageSortBySchema.default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

export const adminContactMessageStatusUpdateSchema = z
  .object({
    status: z.enum(["REVIEWED", "ARCHIVED"])
  })
  .strict();

export type AdminContactMessageListQuery = z.infer<typeof adminContactMessageListQuerySchema>;

const adminContactMessageSelect = Prisma.validator<Prisma.ContactMessageSelect>()({
  id: true,
  fullName: true,
  email: true,
  phone: true,
  topic: true,
  message: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: { select: { id: true, name: true } }
});

type ContactMessageRow = Prisma.ContactMessageGetPayload<{ select: typeof adminContactMessageSelect }>;
type ContactMessageReadClient = Pick<Prisma.TransactionClient, "contactMessage">;
type ContactMessageMutationClient = Pick<Prisma.TransactionClient, "contactMessage" | "auditLog">;
type ContactMessageTransactionHost = {
  $transaction<T>(operation: (client: ContactMessageMutationClient) => Promise<T>): Promise<T>;
};

function toAdminContactMessageDto(message: ContactMessageRow) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    reviewedAt: message.reviewedAt?.toISOString() ?? null
  };
}

export function canReadAdminContactMessages(actor: Principal) {
  return hasPermission(actor, "contact.read.any") || hasPermission(actor, "contact.manage.any");
}

export function canManageAdminContactMessages(actor: Principal) {
  return hasPermission(actor, "contact.manage.any");
}

function assertContactRead(actor: Principal) {
  if (!canReadAdminContactMessages(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Contact message read permission is required.");
  }
}

function assertContactManage(actor: Principal) {
  if (!canManageAdminContactMessages(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Contact message management permission is required.");
  }
}

function normalizeListQuery(input: unknown) {
  return parseWithSchema(adminContactMessageListQuerySchema, input, "Contact message list query is invalid.");
}

function contactMessageListWhere(filters: AdminContactMessageListQuery): Prisma.ContactMessageWhereInput {
  const search = filters.q?.trim();
  return {
    AND: [
      filters.status ? { status: filters.status } : {},
      filters.topic ? { topic: filters.topic } : {},
      search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { topic: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}
    ]
  };
}

function orderByFor(filters: AdminContactMessageListQuery): Prisma.ContactMessageOrderByWithRelationInput[] {
  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

export async function listAdminContactMessages(input: {
  actor: Principal;
  query: unknown;
  client?: ContactMessageReadClient;
}) {
  assertContactRead(input.actor);
  const filters = normalizeListQuery(input.query);
  const pagination = toPagination(filters);
  const where = contactMessageListWhere(filters);
  const client = input.client ?? prisma;

  const [items, total] = await Promise.all([
    client.contactMessage.findMany({
      where,
      select: adminContactMessageSelect,
      orderBy: orderByFor(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    client.contactMessage.count({ where })
  ]);

  return {
    items: items.map(toAdminContactMessageDto),
    total,
    filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  };
}

function canTransitionContactMessage(from: string, to: "REVIEWED" | "ARCHIVED") {
  if (from === to) return true;
  if (from === "NEW") return to === "REVIEWED" || to === "ARCHIVED";
  return from === "REVIEWED" && to === "ARCHIVED";
}

export async function updateAdminContactMessageStatus(input: {
  actor: Principal;
  messageId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
  client?: ContactMessageTransactionHost;
}) {
  assertContactManage(input.actor);
  const messageId = parseWithSchema(uuidSchema, input.messageId, "Contact message id is invalid.");
  const body = parseWithSchema(adminContactMessageStatusUpdateSchema, input.body, "Contact message status payload is invalid.");
  const transactionHost: ContactMessageTransactionHost =
    input.client ?? (prisma as unknown as ContactMessageTransactionHost);

  return transactionHost.$transaction(async (client: ContactMessageMutationClient) => {
    const observed = await client.contactMessage.findUnique({
      where: { id: messageId },
      select: adminContactMessageSelect
    });

    if (!observed) {
      throw new ApiError(404, "NOT_FOUND", "Contact message was not found.");
    }

    if (observed.status === body.status) {
      return toAdminContactMessageDto(observed);
    }

    if (!canTransitionContactMessage(observed.status, body.status)) {
      throw new ApiError(409, "CONFLICT", "Contact message status transition is not allowed.");
    }

    const claim = await client.contactMessage.updateMany({
      where: { id: messageId, status: observed.status },
      data: {
        status: body.status,
        ...(observed.status === "NEW"
          ? { reviewedAt: new Date(), reviewedById: input.actor.id }
          : {})
      }
    });

    if (claim.count === 0) {
      const concurrent = await client.contactMessage.findUnique({
        where: { id: messageId },
        select: adminContactMessageSelect
      });
      if (!concurrent) {
        throw new ApiError(404, "NOT_FOUND", "Contact message was not found.");
      }
      if (concurrent.status === body.status) {
        return toAdminContactMessageDto(concurrent);
      }
      throw new ApiError(409, "CONFLICT", "Contact message was changed by another request.");
    }

    const updated = await client.contactMessage.findUnique({
      where: { id: messageId },
      select: adminContactMessageSelect
    });
    if (!updated) {
      throw new ApiError(404, "NOT_FOUND", "Contact message was not found.");
    }

    await appendAuditLog({
      client,
      actorId: input.actor.id,
      action: "contact.message_update",
      resourceType: "ContactMessage",
      resourceId: updated.id,
      metadata: {
        topic: observed.topic,
        previousStatus: observed.status,
        status: updated.status
      },
      request: input.request,
      requestId: input.requestId
    });

    return toAdminContactMessageDto(updated);
  });
}
