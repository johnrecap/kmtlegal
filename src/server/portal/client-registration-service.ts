import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { emailSchema } from "@/server/validation/schemas";
import { phoneSchema } from "@/server/phone/phone-schema";
import { canonicalPhone } from "@/server/phone/phone-normalization";
import { hashPassword } from "@/server/auth/password";
import { ROLES, type Principal } from "@/server/auth/policy";
import { authUserInclude, createSessionForUser, principalFromUser } from "@/server/auth/session-store";
import { appendAuditLog } from "@/server/audit/audit-service";
import { readDialogue, bookingAllowed } from "@/server/ai/company-conversation-policy";
import { ownAssistantSession } from "@/server/consultations/conversation-session-service";
import { intakeDraftSchema } from "@/server/consultations/conversation-contract";
import { bindAssistantThreadIdentity } from "@/server/conversations/assistant-handoff-service";

export const clientRegistrationSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  fullName: intakeDraftSchema.shape.fullName.unwrap(),
  phone: phoneSchema,
  email: emailSchema,
  password: z.string().min(10).max(256),
  confirmPassword: z.string().min(10).max(256)
}).refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export async function registerConversationClient(input: {
  capability: string; body: z.infer<typeof clientRegistrationSchema>; actor?: Principal | null; request: Request;
}) {
  // Never replace an authenticated identity with another account through signup.
  if (input.actor) throw new ApiError(409, "CONFLICT", "Sign in or link the current account.");
  const body = clientRegistrationSchema.parse(input.body);
  const owned = await ownAssistantSession(input.capability);
  const passwordHash = await hashPassword(body.password);
  try {
    return await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${owned.id}::uuid FOR UPDATE`;
      const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: owned.id } });
      if (session.expiresAt <= new Date() || session.clientId) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
      if (session.revision !== body.revision || session.leaseId) throw new ApiError(409, "CONFLICT", "Conversation changed.");
      if (!readDialogue(session.dialogue).accountAccess && !bookingAllowed(session.dialogue) && !session.consultationRequestId) {
        throw new ApiError(403, "PERMISSION_DENIED", "Account action must be requested.");
      }
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${body.email}))::text`;
      const existing = await tx.user.findFirst({ where: { email: { equals: body.email, mode: "insensitive" } }, select: { id: true } });
      if (existing) throw new ApiError(409, "ACCOUNT_EMAIL_UNAVAILABLE", "This email cannot be used for signup.");
      const role = await tx.role.findUnique({ where: { name: ROLES.client } });
      if (!role || role.status !== "ACTIVE") throw new ApiError(503, "SERVICE_UNAVAILABLE", "Client accounts are unavailable.");
      const phoneCanonical = canonicalPhone(body.phone)!;
      const user = await tx.user.create({ data: {
        name: body.fullName, phone: `+${phoneCanonical}`, email: body.email, passwordHash,
        emailVerifiedAt: null, roleId: role.id, status: "ACTIVE", locale: session.locale,
        clientProfile: { create: { fullName: body.fullName, phone: `+${phoneCanonical}`, phoneCanonical, email: body.email, status: "ACTIVE", source: "assistant_password_signup" } }
      }, include: authUserInclude });
      await tx.assistantSession.update({ where: { id: session.id }, data: { clientId: user.clientProfile!.id, revision: { increment: 1 } } });
      await bindAssistantThreadIdentity(tx, session.id, user.clientProfile!.id);
      const login = await createSessionForUser(user, input.request, tx);
      await appendAuditLog({ action: "client.account.registered", actorId: user.id, clientId: user.clientProfile!.id, resourceType: "User", resourceId: user.id, client: tx });
      return { token: login.token, principal: principalFromUser(user) };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError(409, "ACCOUNT_EMAIL_UNAVAILABLE", "This email cannot be used for signup.");
    }
    throw error;
  }
}
