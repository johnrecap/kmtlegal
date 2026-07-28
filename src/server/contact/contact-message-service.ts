import type { Prisma } from "@prisma/client";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { prisma } from "@/server/db/prisma";
import { emailSchema } from "@/server/validation/schemas";
import { z } from "zod";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { createContactMessageNotifications } from "@/server/admin/notification-service";
import { safeLog } from "@/server/observability/safe-log";

export const contactTopicSchema = z.enum(["consultation", "documents", "media", "other"]);

export const publicContactMessageSchema = z
  .object({
    locale: z.enum(["en", "ar"]).default("en"),
    fullName: z.string().trim().min(2).max(120),
    email: emailSchema,
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    topic: contactTopicSchema,
    message: z.string().trim().min(10).max(2000),
    consent: z.literal(true)
  })
  .strict();

export type PublicContactMessageInput = z.infer<typeof publicContactMessageSchema>;

type ContactMessageClient = Pick<Prisma.TransactionClient, "contactMessage">;
type AuditWriter = typeof appendAuditLogBestEffort;
type ContactNotificationWriter = typeof createContactMessageNotifications;
type SafeLogger = typeof safeLog;

export function contactMessageReference(id: string) {
  return `MSG-${id.slice(0, 8).toUpperCase()}`;
}

export async function createPublicContactMessage(input: {
  body: PublicContactMessageInput;
  request?: Request;
  requestId?: string;
  client?: ContactMessageClient;
  audit?: AuditWriter;
  notify?: ContactNotificationWriter;
  logger?: SafeLogger;
}) {
  const client = input.client ?? prisma;
  const audit = input.audit ?? appendAuditLogBestEffort;
  const notify = input.notify ?? createContactMessageNotifications;
  const logger = input.logger ?? safeLog;
  const phone = input.body.phone?.trim() || null;

  const message = await client.contactMessage.create({
    data: {
      fullName: input.body.fullName,
      email: input.body.email,
      phone,
      phoneCanonical: canonicalPhone(phone),
      topic: input.body.topic,
      message: input.body.message,
      status: "NEW"
    },
    select: {
      id: true,
      status: true,
      topic: true,
      createdAt: true
    }
  });

  await audit({
    actorId: null,
    action: "contact.message_create",
    resourceType: "ContactMessage",
    resourceId: message.id,
    metadata: {
      topic: message.topic,
      status: message.status,
      locale: input.body.locale,
      hasPhone: Boolean(phone)
    },
    request: input.request,
    requestId: input.requestId
  });

  try {
    await notify({ contactMessageId: message.id });
  } catch {
    logger("warn", "contact.notification_write_failed", {
      requestId: input.requestId,
      resourceType: "ContactMessage",
      resourceId: message.id
    });
  }

  return {
    id: message.id,
    reference: contactMessageReference(message.id),
    status: message.status,
    createdAt: message.createdAt
  };
}
