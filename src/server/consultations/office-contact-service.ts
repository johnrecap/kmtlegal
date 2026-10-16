import { z } from "zod";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { phoneSchema } from "@/server/phone/phone-schema";
import { ownAssistantSession, readAssistantSession } from "./conversation-session-service";

export const officeContactSchema = z.strictObject({
  action: z.literal("set_office_contact"), revision: z.number().int().nonnegative(),
  phone: phoneSchema.nullable(), contactChannel: z.enum(["PHONE", "WHATSAPP"]).nullable(), consent: z.boolean()
}).refine(value => value.phone === null
  ? value.contactChannel === null && !value.consent
  : value.contactChannel !== null && value.consent, { message: "Explicit contact consent is required." });

export async function setOfficeContact(token: string, body: z.infer<typeof officeContactSchema>, actor?: Principal | null) {
  const owned = await ownAssistantSession(token, actor);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${owned.id}::uuid FOR UPDATE`;
    const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: owned.id } });
    if (session.expiresAt <= new Date() || (session.clientId && session.clientId !== actor?.clientId)) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    if (!session.conversationThreadId) throw new ApiError(400, "BAD_REQUEST", "An office conversation is required.");
    if (session.revision !== body.revision || session.leaseId) throw new ApiError(409, "CONFLICT", "Conversation changed.");
    await tx.assistantSession.update({ where: { id: session.id }, data: {
      officePhone: body.phone ? `+${canonicalPhone(body.phone)}` : null,
      officeContactChannel: body.contactChannel, officeContactConsentedAt: body.consent ? new Date() : null,
      revision: { increment: 1 }
    } });
  });
  return readAssistantSession(token, actor);
}
