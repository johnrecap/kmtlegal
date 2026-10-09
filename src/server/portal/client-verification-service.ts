import { bookingAllowed, readDialogue } from "@/server/ai/company-conversation-policy";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { emailSchema } from "@/server/validation/schemas";
import { hashPassword } from "@/server/auth/password";
import { ROLES, type Principal } from "@/server/auth/policy";
import { createSessionForUser } from "@/server/auth/session-store";
import { appendAuditLog } from "@/server/audit/audit-service";
import { sendTemplatedEmail } from "@/server/email/email-service";
import { getAccountEmailMode } from "@/server/email/config";
import { publicSiteOrigin } from "@/lib/public-site-origin";
import { capabilityHash, ownAssistantSession } from "@/server/consultations/conversation-session-service";
import { intakeDraftSchema } from "@/server/consultations/conversation-contract";
import { bindAssistantThreadIdentity } from "@/server/conversations/assistant-handoff-service";

export const startVerificationSchema = z.strictObject({ email: emailSchema, purpose: z.enum(["ACTIVATE", "RECOVER"]).default("ACTIVATE") });
export const completeVerificationSchema = z.strictObject({ token: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().min(10).max(256), confirmPassword: z.string().min(10).max(256) })
  .refine(value => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

export async function startClientVerification(input: { capability: string; email: string; purpose: "ACTIVATE" | "RECOVER"; actor?: Principal | null }) {
  const session = await ownAssistantSession(input.capability, input.actor);
  if (input.purpose === "ACTIVATE" ? !bookingAllowed(session.dialogue) : !bookingAllowed(session.dialogue) && !readDialogue(session.dialogue).accountAccess) throw new ApiError(403, "PERMISSION_DENIED", "Account action must be requested.");
  if (getAccountEmailMode() !== "smtp") throw new ApiError(503, "EMAIL_DELIVERY_FAILED", "Account email delivery is unavailable.");
  const latest = await prisma.clientVerificationToken.findFirst({ where: { sessionId: session.id }, orderBy: { createdAt: "desc" } });
  if (latest && latest.createdAt.getTime() > Date.now() - 60_000) throw new ApiError(429, "RATE_LIMITED", "Please wait before requesting another email.");
  const email = emailSchema.parse(input.email);
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, include: { role: true } });
  const eligible = !existing || (existing.role.name === ROLES.client && existing.status === "ACTIVE" && !existing.deletedAt);
  const purpose = existing && input.purpose === "ACTIVATE" ? "LOGIN" : input.purpose;
  const rawToken = randomBytes(32).toString("hex");
  const token = await prisma.$transaction(async tx => {
    // Serialize resends on the conversation; only the newest challenge can remain usable.
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${session.id}::uuid FOR UPDATE`;
    const current = await tx.assistantSession.findUniqueOrThrow({ where: { id: session.id } });
    if (input.purpose === "ACTIVATE" ? !bookingAllowed(current.dialogue) : !bookingAllowed(current.dialogue) && !readDialogue(current.dialogue).accountAccess) throw new ApiError(403, "PERMISSION_DENIED", "Account action must be requested.");
    const recent = await tx.clientVerificationToken.findFirst({ where: { sessionId: session.id, createdAt: { gt: new Date(Date.now() - 60_000) } } });
    if (recent) throw new ApiError(429, "RATE_LIMITED", "Please wait before requesting another email.");
    await tx.clientVerificationToken.updateMany({ where: { sessionId: session.id, consumedAt: null }, data: { consumedAt: new Date() } });
    return tx.clientVerificationToken.create({ data: {
      sessionId: session.id, tokenHash: capabilityHash(rawToken), email, purpose: input.purpose,
      expiresAt: new Date(Date.now() + 30 * 60_000),
      // Ineligible/redundant requests have indistinguishable public responses and cannot yield a usable token.
      consumedAt: !eligible || purpose === "LOGIN" || (!existing && input.purpose === "RECOVER") ? new Date() : null
    } });
  });
  if (!eligible || (!existing && input.purpose === "RECOVER")) return { accepted: true };
  const url = purpose === "LOGIN"
    ? `${publicSiteOrigin()}/login?next=${encodeURIComponent("/book-consultation")}`
    : `${publicSiteOrigin()}/account/verify#token=${rawToken}&locale=${session.locale}`;
  try {
    const delivery = await sendTemplatedEmail({ to: { email }, templateKey: "client_account_access", data: { url, locale: session.locale, purpose } });
    if (delivery.mode !== "smtp") throw new ApiError(503, "EMAIL_DELIVERY_FAILED", "Account email delivery is unavailable.");
  } catch {
    await prisma.clientVerificationToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });
    throw new ApiError(502, "EMAIL_DELIVERY_FAILED", "Email delivery failed.");
  }
  return { accepted: true };
}

export async function completeClientVerification(input: { token: string; password: string; request: Request }) {
  const tokenHash = capabilityHash(input.token);
  const passwordHash = await hashPassword(input.password);
  const assistantCapability = randomBytes(32).toString("hex");
  const userId = await prisma.$transaction(async tx => {
    const challenge = await tx.clientVerificationToken.findUnique({ where: { tokenHash }, include: { session: true } });
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date() || challenge.session.expiresAt <= new Date()) {
      throw new ApiError(410, "TOKEN_EXPIRED", "Account verification link is invalid or expired.");
    }
    const consumed = await tx.clientVerificationToken.updateMany({ where: { id: challenge.id, consumedAt: null, expiresAt: { gt: new Date() } }, data: { consumedAt: new Date() } });
    if (!consumed.count) throw new ApiError(410, "TOKEN_EXPIRED", "Account verification link is invalid or expired.");
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${challenge.email.toLowerCase()}))::text`;
    await tx.assistantSession.update({ where: { id: challenge.sessionId }, data: { capabilityHash: capabilityHash(assistantCapability), leaseId: null, leaseExpiresAt: null } });
    const existing = await tx.user.findFirst({ where: { email: { equals: challenge.email, mode: "insensitive" } }, include: { clientProfile: true, role: true } });
    if (existing) {
      if (challenge.purpose !== "RECOVER" || existing.role.name !== ROLES.client || existing.status !== "ACTIVE" || existing.deletedAt || existing.role.status !== "ACTIVE" || !existing.clientProfile || existing.clientProfile.deletedAt) {
        throw new ApiError(409, "CONFLICT", "Sign in to your existing account to continue.");
      }
      if (challenge.session.clientId && challenge.session.clientId !== existing.clientProfile.id) throw new ApiError(403, "FORBIDDEN", "Access denied.");
      await tx.user.update({ where: { id: existing.id }, data: { passwordHash, emailVerifiedAt: new Date() } });
      await tx.session.updateMany({ where: { userId: existing.id, revokedAt: null }, data: { status: "REVOKED", revokedAt: new Date() } });
      await tx.assistantSession.update({ where: { id: challenge.sessionId }, data: { clientId: existing.clientProfile.id } });
      await bindAssistantThreadIdentity(tx, challenge.sessionId, existing.clientProfile.id);
      await appendAuditLog({ action: "client.account.recovered", actorId: existing.id, resourceType: "User", resourceId: existing.id, client: tx });
      return existing.id;
    }
    if (challenge.purpose !== "ACTIVATE" || challenge.session.clientId) throw new ApiError(410, "TOKEN_EXPIRED", "Account verification link is invalid or expired.");
    if (!bookingAllowed(challenge.session.dialogue)) throw new ApiError(403, "PERMISSION_DENIED", "Booking preparation has stopped.");
    const draft = intakeDraftSchema.parse(challenge.session.draft);
    if (!draft.fullName || !draft.phone) throw new ApiError(400, "VALIDATION_ERROR", "Name and phone are required before account activation.");
    const role = await tx.role.findUnique({ where: { name: ROLES.client } });
    if (!role || role.status !== "ACTIVE") throw new ApiError(503, "SERVICE_UNAVAILABLE", "Client accounts are unavailable.");
    const user = await tx.user.create({ data: { name: draft.fullName, email: challenge.email, phone: draft.phone, passwordHash, emailVerifiedAt: new Date(), status: "ACTIVE", locale: challenge.session.locale, roleId: role.id } });
    // Never find or merge a historical client by email/phone. New verified identity gets a new client record.
    const client = await tx.client.create({ data: { userId: user.id, fullName: draft.fullName, phone: draft.phone, email: challenge.email, city: draft.city, status: "ACTIVE", source: "verified_assistant" } });
    await tx.assistantSession.update({ where: { id: challenge.sessionId }, data: { clientId: client.id, draft: { ...draft, email: challenge.email }, revision: { increment: 1 } } });
    await bindAssistantThreadIdentity(tx, challenge.sessionId, client.id);
    await appendAuditLog({ action: "client.account.verified", actorId: user.id, clientId: client.id, resourceType: "User", resourceId: user.id, client: tx });
    return user.id;
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { role: { include: { permissions: { include: { permission: true } } } }, clientProfile: true, twoFactorCredential: true } });
  return { ...await createSessionForUser(user, input.request), assistantCapability };
}
