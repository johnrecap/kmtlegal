import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
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

export async function listAdminContactMessages(input: { actor: Principal; query: unknown }) {
  assertContactRead(input.actor);
  const filters = normalizeListQuery(input.query);
  const pagination = toPagination(filters);
  const where = contactMessageListWhere(filters);

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      select: {
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
      },
      orderBy: orderByFor(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.contactMessage.count({ where })
  ]);

  return { items, total, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function updateAdminContactMessageStatus(input: {
  actor: Principal;
  messageId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
}) {
  assertContactManage(input.actor);
  const messageId = parseWithSchema(uuidSchema, input.messageId, "Contact message id is invalid.");
  const body = parseWithSchema(adminContactMessageStatusUpdateSchema, input.body, "Contact message status payload is invalid.");

  const existing = await prisma.contactMessage.findUnique({
    where: { id: messageId },
    select: { id: true, status: true, topic: true }
  });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Contact message was not found.");
  }

  const updated = await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      status: body.status,
      reviewedAt: new Date(),
      reviewedById: input.actor.id
    },
    select: {
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
    }
  });

  await appendAuditLogBestEffort({
    actorId: input.actor.id,
    action: "contact.message_update",
    resourceType: "ContactMessage",
    resourceId: updated.id,
    metadata: {
      topic: existing.topic,
      previousStatus: existing.status,
      status: updated.status
    },
    request: input.request,
    requestId: input.requestId
  });

  return updated;
}
