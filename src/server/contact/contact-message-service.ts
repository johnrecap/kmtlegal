import type { Prisma } from "@prisma/client";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { prisma } from "@/server/db/prisma";
import { emailSchema } from "@/server/validation/schemas";
import { z } from "zod";
import { canonicalPhone } from "@/server/phone/phone-normalization";

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

export function contactMessageReference(id: string) {
  return `MSG-${id.slice(0, 8).toUpperCase()}`;
}

export async function createPublicContactMessage(input: {
  body: PublicContactMessageInput;
  request?: Request;
  requestId?: string;
  client?: ContactMessageClient;
  audit?: AuditWriter;
}) {
  const client = input.client ?? prisma;
  const audit = input.audit ?? appendAuditLogBestEffort;
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

  return {
    id: message.id,
    reference: contactMessageReference(message.id),
    status: message.status,
    createdAt: message.createdAt
  };
}
