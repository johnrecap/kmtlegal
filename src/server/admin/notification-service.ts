import { Prisma, type NotificationType } from "@prisma/client";
import { z } from "zod";
import { canAccessAdminPath } from "@/lib/admin-route-policy";
import { plan35NotificationUiCopy, plan36ConsultationOutcomeCopy } from "@/lib/ui-copy";
import { canReadCase, hasPermission, ROLES, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import {
  canManageConsultationOutcome,
  consultationOutcomeViewWhere,
  type ConsultationOutcomeValue
} from "./consultation-outcome-policy";

export const CONSULTATION_NOTIFICATION_RESOURCE_TYPE = "ConsultationRequest";

const notificationCenterKindSchema = z.enum(["generic", "consultation-review"]);
const notificationCursorSchema = z
  .object({
    createdAt: z.string().datetime(),
    kind: notificationCenterKindSchema,
    id: uuidSchema
  })
  .strict();

const optionalCursorSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .or(z.literal(""))
  .transform((value) => value || undefined);

export const adminNotificationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(10).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
    cursor: optionalCursorSchema
  })
  .strict()
  .superRefine((value, context) => {
    if (value.limit !== undefined && (value.pageSize !== undefined || value.cursor !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "Preview and notification-center pagination cannot be combined."
      });
    }
  })
  .transform((value) =>
    value.pageSize !== undefined || value.cursor !== undefined
      ? ({ mode: "center", pageSize: value.pageSize ?? 20, cursor: value.cursor } as const)
      : ({ mode: "preview", limit: value.limit ?? 5 } as const)
  );

const notificationCenterSelect = Prisma.validator<Prisma.NotificationSelect>()({
  id: true,
  title: true,
  body: true,
  type: true,
  resourceType: true,
  resourceId: true,
  actionUrl: true,
  readAt: true,
  createdAt: true
});

const consultationReviewSelect = Prisma.validator<Prisma.ConsultationRequestSelect>()({
  id: true,
  fullName: true,
  assignedLawyerId: true,
  createdAt: true,
  appointments: {
    select: { startsAt: true },
    where: { type: "CONSULTATION", caseId: null, status: "SCHEDULED" },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    take: 1
  }
});

type NotificationRow = Prisma.NotificationGetPayload<{ select: typeof notificationCenterSelect }>;
type ConsultationReviewRow = Prisma.ConsultationRequestGetPayload<{ select: typeof consultationReviewSelect }>;
export type NotificationCenterClient = Pick<Prisma.TransactionClient, "consultationRequest" | "legalCase" | "notification">;
type NotificationWriterClient = Pick<Prisma.TransactionClient, "consultationRequest" | "notification" | "user">;

export type GenericNotificationCenterItem = {
  kind: "generic";
  id: string;
  type: NotificationType;
  resourceType?: string | null;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ConsultationReviewCenterItem = {
  kind: "consultation-review";
  id: string;
  reference: string;
  applicantDisplayName: string;
  href: string;
  startsAt: string | null;
  createdAt: string;
};

export type NotificationCenterItem = GenericNotificationCenterItem | ConsultationReviewCenterItem;

export type NotificationCenterSnapshot = {
  genericUnreadCount: number;
  consultationReviewCount: number;
  attentionCount: number;
  nextCursor: string | null;
  items: NotificationCenterItem[];
};

function consultationReference(id: string) {
  return `CONS-${id.slice(0, 8).toUpperCase()}`;
}

function assertNotificationRead(actor: Principal) {
  if (!hasPermission(actor, "notification.read.self")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Notification read permission is required.");
  }
}

function consultationReviewScope(actor: Principal): Prisma.ConsultationRequestWhereInput | null {
  if (hasPermission(actor, "consultation.review.any")) {
    return {};
  }
  if (hasPermission(actor, "consultation.review.assigned")) {
    return { assignedLawyerId: actor.id };
  }
  return null;
}

function canReviewProjectedConsultation(actor: Principal, consultation: { assignedLawyerId?: string | null }) {
  if (hasPermission(actor, "consultation.review.any")) return true;
  return hasPermission(actor, "consultation.review.assigned") && consultation.assignedLawyerId === actor.id;
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
        secretaryReviewedAt: null,
        ...consultationOutcomeViewWhere("current")
      }
    ]
  };
}

function dedupeKey(resourceType: string | null, resourceId: string | null) {
  return resourceType && resourceId ? `${resourceType}:${resourceId}` : null;
}

function semanticListPath(type: NotificationType, resourceType: string | null) {
  if (type === "CASE" || resourceType === "LegalCase") return "/admin/cases";
  if (type === "CONSULTATION" || resourceType === CONSULTATION_NOTIFICATION_RESOURCE_TYPE) return "/admin/consultations";
  if (type === "APPOINTMENT" || resourceType === "Appointment") return "/admin/calendar";
  if (type === "DOCUMENT" || resourceType === "Document") return "/admin/documents";
  if (type === "PAYMENT" || resourceType === "Payment") return "/admin/finance";
  return "/admin/notifications";
}

function fallbackNotificationHref(actor: Principal, type: NotificationType, resourceType: string | null) {
  const semanticPath = semanticListPath(type, resourceType);
  if (canAccessAdminPath(actor, semanticPath)) return semanticPath;
  return canAccessAdminPath(actor, "/admin/notifications") ? "/admin/notifications" : null;
}

function parseInternalAdminHref(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(value)) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://kmt.local");
    if (parsed.origin !== "https://kmt.local" || (parsed.pathname !== "/admin" && !parsed.pathname.startsWith("/admin/"))) {
      return null;
    }
    const decodedPath = decodeURIComponent(parsed.pathname);
    if (/[\u0000-\u001f\u007f\\]/.test(decodedPath)) return null;
    return { pathname: parsed.pathname, href: `${parsed.pathname}${parsed.search}${parsed.hash}` };
  } catch {
    return null;
  }
}

const caseDetailPattern = /^\/admin\/cases\/([0-9a-f-]{36})$/i;
const consultationDetailPattern = /^\/admin\/consultations\/([0-9a-f-]{36})$/i;
const otherDynamicAdminPattern = /^\/admin\/(?:clients|messages|users|documents|tasks|calendar|finance)\/[0-9a-f-]{36}(?:\/|$)/i;

async function safeNotificationHref(input: {
  actor: Principal;
  notification: NotificationRow;
  client: NotificationCenterClient;
}) {
  const fallback = fallbackNotificationHref(input.actor, input.notification.type, input.notification.resourceType);
  const candidate = parseInternalAdminHref(input.notification.actionUrl);
  if (!candidate || !canAccessAdminPath(input.actor, candidate.pathname)) return fallback;

  const caseMatch = candidate.pathname.match(caseDetailPattern);
  if (caseMatch) {
    if (input.notification.resourceType !== "LegalCase" || input.notification.resourceId !== caseMatch[1]) return fallback;
    const legalCase = await input.client.legalCase.findUnique({
      where: { id: caseMatch[1] },
      select: {
        assignedLawyerId: true,
        deletedAt: true,
        client: { select: { userId: true } }
      }
    });
    if (
      !legalCase ||
      legalCase.deletedAt !== null ||
      !canReadCase(input.actor, {
        assignedLawyerId: legalCase.assignedLawyerId,
        clientUserId: legalCase.client?.userId ?? null
      })
    ) {
      return fallback;
    }
  }

  const consultationMatch = candidate.pathname.match(consultationDetailPattern);
  if (consultationMatch) {
    if (
      input.notification.resourceType !== CONSULTATION_NOTIFICATION_RESOURCE_TYPE ||
      input.notification.resourceId !== consultationMatch[1]
    ) {
      return fallback;
    }
    const consultation = await input.client.consultationRequest.findUnique({
      where: { id: consultationMatch[1] },
      select: { assignedLawyerId: true }
    });
    if (!consultation || !canReviewProjectedConsultation(input.actor, consultation)) return fallback;
  }

  if (otherDynamicAdminPattern.test(candidate.pathname)) return fallback;
  return candidate.href;
}

function itemOrder(left: Pick<NotificationCenterItem, "createdAt" | "kind" | "id">, right: Pick<NotificationCenterItem, "createdAt" | "kind" | "id">) {
  const timeDifference = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  if (timeDifference !== 0) return timeDifference;
  if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
  return left.id.localeCompare(right.id);
}

function encodeCursor(item: Pick<NotificationCenterItem, "createdAt" | "kind" | "id">) {
  return Buffer.from(
    JSON.stringify({ createdAt: item.createdAt, kind: item.kind, id: item.id }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(value: string) {
  try {
    return notificationCursorSchema.parse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Notification cursor is invalid.");
  }
}

function consultationItem(consultation: ConsultationReviewRow): ConsultationReviewCenterItem {
  return {
    kind: "consultation-review",
    id: consultation.id,
    reference: consultationReference(consultation.id),
    applicantDisplayName: consultation.fullName,
    href: `/admin/consultations/${consultation.id}`,
    startsAt: consultation.appointments[0]?.startsAt.toISOString() ?? null,
    createdAt: consultation.createdAt.toISOString()
  };
}

export async function listAdminNotifications(input: {
  actor: Principal;
  query?: unknown;
  client?: NotificationCenterClient;
}): Promise<NotificationCenterSnapshot> {
  assertNotificationRead(input.actor);
  const query = parseWithSchema(adminNotificationQuerySchema, input.query ?? {}, "Notification query is invalid.");
  const client = input.client ?? prisma;
  const unreviewedWhere = consultationReviewScope(input.actor) ? unreviewedConsultationWhere(input.actor) : null;

  const [notifications, consultations] = await Promise.all([
    client.notification.findMany({
      where: { userId: input.actor.id },
      select: notificationCenterSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }]
    }),
    unreviewedWhere
      ? client.consultationRequest.findMany({
          where: unreviewedWhere,
          select: consultationReviewSelect,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }]
        })
      : Promise.resolve([])
  ]);

  const consultationKeys = new Set(
    consultations.map((consultation) => dedupeKey(CONSULTATION_NOTIFICATION_RESOURCE_TYPE, consultation.id))
  );
  const visibleGeneric = notifications.filter((notification) => {
    const key = dedupeKey(notification.resourceType, notification.resourceId);
    return !key || !consultationKeys.has(key);
  });
  const genericUnreadCount = notifications.filter(({ readAt }) => readAt === null).length;
  const deduplicatedUnreadCount = visibleGeneric.filter(({ readAt }) => readAt === null).length;

  const genericItems = await Promise.all(
    visibleGeneric.map(async (notification): Promise<GenericNotificationCenterItem> => ({
      kind: "generic",
      id: notification.id,
      type: notification.type,
      resourceType: notification.resourceType,
      title: notification.title,
      body: notification.body,
      href: await safeNotificationHref({ actor: input.actor, notification, client }),
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString()
    }))
  );

  const allItems = [...genericItems, ...consultations.map(consultationItem)].sort(itemOrder);
  const cursor = query.mode === "center" && query.cursor ? decodeCursor(query.cursor) : null;
  const remainingItems = cursor ? allItems.filter((item) => itemOrder(item, cursor) > 0) : allItems;
  const pageSize = query.mode === "preview" ? query.limit : query.pageSize;
  const items = remainingItems.slice(0, pageSize);
  const nextCursor = remainingItems.length > items.length && items.length ? encodeCursor(items[items.length - 1]) : null;

  return {
    genericUnreadCount,
    consultationReviewCount: consultations.length,
    attentionCount: deduplicatedUnreadCount + consultations.length,
    nextCursor,
    items
  };
}

export async function markAdminNotificationRead(input: {
  actor: Principal;
  notificationId: string;
  client?: Pick<Prisma.TransactionClient, "notification">;
}) {
  assertNotificationRead(input.actor);
  const notificationId = parseWithSchema(uuidSchema, input.notificationId, "Notification id is invalid.");
  const client = input.client ?? prisma;
  const notification = await client.notification.findFirst({
    where: { id: notificationId, userId: input.actor.id },
    select: { id: true, readAt: true }
  });

  if (!notification) {
    throw new ApiError(404, "NOT_FOUND", "Notification was not found.");
  }

  if (notification.readAt) return notification;
  return client.notification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
    select: { id: true, readAt: true }
  });
}

export async function createConsultationReviewNotifications(input: {
  consultationId: string;
  client?: NotificationWriterClient;
}) {
  const client = input.client ?? prisma;
  const consultation = await client.consultationRequest.findUnique({
    where: { id: input.consultationId },
    select: { id: true, fullName: true, status: true, secretaryReviewedAt: true, outcomeStatus: true }
  });

  if (
    !consultation ||
    consultation.status !== "SCHEDULED" ||
    consultation.secretaryReviewedAt ||
    consultation.outcomeStatus !== "PENDING"
  ) {
    return { created: 0 };
  }

  const candidates = await client.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      role: { status: "ACTIVE" }
    },
    select: {
      id: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { key: true } } } }
        }
      }
    }
  });
  const recipients = candidates.filter((candidate) => {
    if (candidate.role.name === ROLES.superAdmin) return true;
    const permissions = new Set(candidate.role.permissions.map(({ permission }) => permission.key));
    return permissions.has("consultation.review.any") && permissions.has("notification.read.self");
  });

  if (!recipients.length) return { created: 0 };
  const reference = consultationReference(consultation.id);
  const result = await client.notification.createMany({
    data: recipients.map((recipient) => ({
      userId: recipient.id,
      type: "CONSULTATION",
      title: plan35NotificationUiCopy.reviewRequestTitle,
      body: `${consultation.fullName} - ${reference}`,
      resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
      resourceId: consultation.id,
      actionUrl: `/admin/consultations/${consultation.id}`
    })),
    skipDuplicates: true
  });

  return { created: result.count };
}

export async function resolveConsultationNotifications(input: {
  consultationId: string;
  client?: Pick<Prisma.TransactionClient, "notification">;
}) {
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

export async function syncConsultationOutcomeNotifications(input: {
  consultationId: string;
  outcomeStatus: ConsultationOutcomeValue;
  client?: NotificationWriterClient;
}) {
  const client = input.client ?? prisma;
  if (input.outcomeStatus !== "AWAITING_RESULT" && input.outcomeStatus !== "MISSED") {
    const resolved = await resolveConsultationNotifications({
      client,
      consultationId: input.consultationId
    });
    return { createdOrUpdated: 0, resolved: resolved.count };
  }

  const candidates = await client.user.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      role: { status: "ACTIVE" }
    },
    select: {
      id: true,
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { key: true } } } }
        }
      }
    }
  });
  const recipients = candidates.filter((candidate) => {
    const principal = {
      id: candidate.id,
      roleName: candidate.role.name,
      permissions: candidate.role.permissions.map(({ permission }) => permission.key)
    };
    return canManageConsultationOutcome(principal) && hasPermission(principal, "notification.read.self");
  });

  const copy = input.outcomeStatus === "MISSED"
    ? {
        title: plan36ConsultationOutcomeCopy.notifications.missedTitle,
        body: plan36ConsultationOutcomeCopy.notifications.missedBody
      }
    : {
        title: plan36ConsultationOutcomeCopy.notifications.awaitingTitle,
        body: plan36ConsultationOutcomeCopy.notifications.awaitingBody
      };
  const now = new Date();

  await Promise.all(
    recipients.map((recipient) =>
      client.notification.upsert({
        where: {
          userId_type_resourceType_resourceId: {
            userId: recipient.id,
            type: "CONSULTATION",
            resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
            resourceId: input.consultationId
          }
        },
        update: {
          title: copy.title,
          body: copy.body,
          actionUrl: `/admin/consultations/${input.consultationId}`,
          readAt: null,
          createdAt: now
        },
        create: {
          userId: recipient.id,
          type: "CONSULTATION",
          title: copy.title,
          body: copy.body,
          resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
          resourceId: input.consultationId,
          actionUrl: `/admin/consultations/${input.consultationId}`,
          readAt: null,
          createdAt: now
        }
      })
    )
  );

  return { createdOrUpdated: recipients.length, resolved: 0 };
}
