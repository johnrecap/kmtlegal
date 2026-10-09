import { bookingAllowed } from "@/server/ai/company-conversation-policy";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { appendAuditLog } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { bookingCategoryForPublicService } from "@/content/public-content";
import { ownAssistantSession } from "./conversation-session-service";
import { confirmedIntakeSchema } from "./conversation-contract";
import { assertPublicConsultationSlotAvailable } from "./consultation-availability-service";
import { bindAssistantThreadIdentity } from "@/server/conversations/assistant-handoff-service";

export async function attachAuthenticatedClient(token: string, actor: Principal) {
  if (!actor.clientId || !hasPermission(actor, "client.read.self")) throw new ApiError(403, "FORBIDDEN", "Access denied.");
  const session = await ownAssistantSession(token, actor);
  await prisma.$transaction(async tx => {
    const attached = await tx.assistantSession.updateMany({ where: { id: session.id, clientId: null, leaseId: null }, data: { clientId: actor.clientId, revision: { increment: 1 } } });
    if (!attached.count && session.clientId !== actor.clientId) throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
    await bindAssistantThreadIdentity(tx, session.id, actor.clientId!);
  });
  return { attached: true };
}

export async function submitConversationRequest(input: { token: string; actor: Principal; revision: number }) {
  if (!input.actor.clientId || !hasPermission(input.actor, "client.read.self")) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
  const session = await ownAssistantSession(input.token, input.actor);
  if (session.clientId !== input.actor.clientId) throw new ApiError(403, "FORBIDDEN", "Access denied.");
  if (session.consultationRequestId) return prisma.consultationRequest.findFirstOrThrow({
    where: { id: session.consultationRequestId, clientId: input.actor.clientId }, select: { publicReference: true, status: true }
  });
  if (!bookingAllowed(session.dialogue)) throw new ApiError(403, "PERMISSION_DENIED", "Booking consent is required.");
  const draft = confirmedIntakeSchema.parse(session.draft);
  const slot = draft.requestedStartsAt ? await assertPublicConsultationSlotAvailable({ startsAt: new Date(draft.requestedStartsAt), mode: draft.preferredMode }) : null;
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${session.id}::uuid FOR UPDATE`;
    const fresh = await tx.assistantSession.findUniqueOrThrow({ where: { id: session.id } });
    if (fresh.consultationRequestId) {
      const existing = await tx.consultationRequest.findUniqueOrThrow({ where: { id: fresh.consultationRequestId }, select: { publicReference: true, status: true } });
      return existing;
    }
    if (!bookingAllowed(fresh.dialogue)) throw new ApiError(403, "PERMISSION_DENIED", "Booking consent is required.");
    if (fresh.revision !== input.revision || fresh.leaseId || fresh.clientId !== input.actor.clientId) throw new ApiError(409, "CONFLICT", "The request changed. Review the latest summary before submitting.");
    const client = await tx.client.findFirst({ where: { id: input.actor.clientId!, userId: input.actor.id, deletedAt: null }, include: { user: true } });
    if (!client?.user || client.user.status !== "ACTIVE" || !client.user.emailVerifiedAt) throw new ApiError(401, "AUTH_REQUIRED", "A verified email account is required.");
    const id = randomUUID();
    const request = await tx.consultationRequest.create({ data: {
      id, publicReference: `CONS-${id.replaceAll("-", "").toUpperCase()}`,
      clientId: client.id, fullName: draft.fullName, phone: draft.phone,
      email: client.user.email, city: draft.city, summary: draft.summary,
      serviceCategory: bookingCategoryForPublicService(draft.service, session.locale === "en" ? "en" : "ar") ?? draft.service,
      preferredMode: draft.preferredMode, locale: session.locale, status: "NEW",
      requestedStartsAt: slot ? new Date(slot.startsAt) : null, requestedEndsAt: slot ? new Date(slot.endsAt) : null
    } });
    await tx.assistantSession.update({ where: { id: session.id }, data: { consultationRequestId: request.id } });
    await appendAuditLog({ action: "consultation.request.submitted", actorId: input.actor.id, resourceType: "ConsultationRequest", resourceId: id, clientId: client.id, client: tx });
    // Deliberately no appointment, payment or notification is created by submission.
    return { publicReference: request.publicReference, status: request.status };
  });
}
