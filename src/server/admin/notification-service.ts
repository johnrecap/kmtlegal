import { Prisma } from "@prisma/client";
import { z } from "zod";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";

export const CONSULTATION_NOTIFICATION_RESOURCE_TYPE = "ConsultationRequest";

function consultationReference(id: string) {
  return `CONS-${id.slice(0, 8).toUpperCase()}`;
}

export const adminNotificationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5)
});

type NotificationClient = Pick<Prisma.TransactionClient, "consultationRequest" | "notification" | "user">;

function consultationReviewScope(actor: Principal): Prisma.ConsultationRequestWhereInput | null {
  if (hasPermission(actor, "consultation.review.any")) {
    return {};
  }
  if (hasPermission(actor, "consultation.review.assigned")) {
    return { assignedLawyerId: actor.id };
  }
  return null;
}

export function unreviewedConsultationWhere(actor: Principal): Prisma.ConsultationRequestWhereInput {
  const scope = consultationReviewScope(actor);
  if (!scope) {
    throw new ApiError(403, "PERMISSION_DENIED", "Consultation review permission is required.");
  }

  return {
    AND: [
      scope,
      {
        status: "SCHEDULED",
        secretaryReviewedAt: null
      }
    ]
  };
}

export async function listAdminNotifications(input: { actor: Principal; query?: unknown }) {
  if (!hasPermission(input.actor, "notification.read.self") && !hasPermission(input.actor, "consultation.review.any")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Notification access is not allowed.");
  }

  const query = parseWithSchema(adminNotificationQuerySchema, input.query ?? {}, "Notification query is invalid.");
  const reviewScope = consultationReviewScope(input.actor);
  const unreviewedWhere = reviewScope ? unreviewedConsultationWhere(input.actor) : null;

  const [notifications, unreadCount, unreviewedCount, latestConsultations] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: input.actor.id },
      orderBy: { createdAt: "desc" },
      take: query.limit
    }),
    prisma.notification.count({ where: { userId: input.actor.id, readAt: null } }),
    unreviewedWhere ? prisma.consultationRequest.count({ where: unreviewedWhere }) : Promise.resolve(0),
    unreviewedWhere
      ? prisma.consultationRequest.findMany({
          where: unreviewedWhere,
          select: {
            id: true,
            fullName: true,
            phone: true,
            createdAt: true,
            appointments: {
              select: { startsAt: true },
              where: { type: "CONSULTATION", status: "SCHEDULED" },
              orderBy: { startsAt: "asc" },
              take: 1
            }
          },
          orderBy: { createdAt: "asc" },
          take: query.limit
        })
      : Promise.resolve([])
  ]);

  const nextConsultation = latestConsultations[0] ?? null;

  return {
    unreadCount,
    unreviewedConsultationCount: unreviewedCount,
    nextReviewHref: nextConsultation ? `/admin/consultations/${nextConsultation.id}` : null,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      actionUrl: notification.actionUrl,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString()
    })),
    consultations: latestConsultations.map((consultation) => ({
      id: consultation.id,
      fullName: consultation.fullName,
      phone: consultation.phone,
      reference: consultationReference(consultation.id),
      href: `/admin/consultations/${consultation.id}`,
      createdAt: consultation.createdAt.toISOString(),
      startsAt: consultation.appointments[0]?.startsAt.toISOString() ?? null
    }))
  };
}

export async function markAdminNotificationRead(input: { actor: Principal; notificationId: string }) {
  if (!hasPermission(input.actor, "notification.read.self") && !hasPermission(input.actor, "consultation.review.any")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Notification access is not allowed.");
  }

  const notificationId = parseWithSchema(uuidSchema, input.notificationId, "Notification id is invalid.");
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: input.actor.id }
  });

  if (!notification) {
    throw new ApiError(404, "NOT_FOUND", "Notification was not found.");
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() }
  });
}

export async function createConsultationReviewNotifications(input: { consultationId: string; client?: NotificationClient }) {
  const client = input.client ?? prisma;
  const consultation = await client.consultationRequest.findUnique({
    where: { id: input.consultationId },
    select: { id: true, fullName: true, status: true, secretaryReviewedAt: true }
  });

  if (!consultation || consultation.status !== "SCHEDULED" || consultation.secretaryReviewedAt) {
    return { created: 0 };
  }

  const recipients = await client.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      role: {
        permissions: {
          some: {
            permission: { key: "consultation.review.any" }
          }
        }
      }
    },
    select: { id: true }
  });

  if (!recipients.length) {
    return { created: 0 };
  }

  const reference = consultationReference(consultation.id);
  const result = await client.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type: "CONSULTATION",
      title: "طلب استشارة جديد يحتاج مراجعة",
      body: `${consultation.fullName} - ${reference}`,
      resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
      resourceId: consultation.id,
      actionUrl: `/admin/consultations/${consultation.id}`
    })),
    skipDuplicates: true
  });

  return { created: result.count };
}

export async function resolveConsultationNotifications(input: { consultationId: string; client?: Pick<Prisma.TransactionClient, "notification"> }) {
  const client = input.client ?? prisma;
  return client.notification.updateMany({
    where: {
      type: "CONSULTATION",
      resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
      resourceId: input.consultationId,
      readAt: null
    },
    data: { readAt: new Date() }
  });
}
