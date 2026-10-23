import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import type { Principal } from "@/server/auth/policy";
import { assistantActionDraftSchema, type AssistantActionDraft } from "@/server/ai/assistant-action-contract";
import { assistantActionCopy } from "@/content/assistant-action-copy";
import { readDialogue } from "@/server/ai/company-conversation-policy";
import { actOnServiceRequest, createServiceRequest, assertActiveServiceClient } from "@/server/services/service-request-service";
import { updatePortalProfile, updateClientPreferences } from "@/server/portal/client-portal-service";
import { appendAuditLog } from "@/server/audit/audit-service";
import { replyClientConversationInTransaction } from "@/server/conversations/conversation-service";
import { requestAlternativeTime } from "@/server/portal/client-requests-service";
import { directBookingInputSchema, mutateDirectBooking } from "./direct-booking-service";
import { CONSULTATION_AVAILABILITY_SETTING_KEY } from "./consultation-availability-service";
import { runAppointmentConflictTransaction, APPOINTMENT_TRANSACTION_MODES } from "@/server/appointments/appointment-conflict-service";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export function assistantActionsEnabled(clientId?: string | null) {
  const allowed = (process.env.AI_ACTION_CLIENT_IDS ?? "").split(",").map(s => s.trim());
  return process.env.AI_ACTIONS_ENABLED === "true" && !existsSync(process.env.AI_ACTIONS_HOLD_FILE || path.resolve(".runtime/assistant-actions.hold")) && !!clientId && (allowed.includes(clientId) || allowed.includes("*"));
}
function conflict() { return new ApiError(409, "CONFLICT", "Action proposal changed or expired."); }
async function ownedClient(tx: Prisma.TransactionClient, actor: Principal) {
  // Lock identity for the entire write and re-read role/permission membership inside the transaction.
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${actor.id}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM clients WHERE id = ${actor.clientId}::uuid FOR UPDATE`;
  const client = await assertActiveServiceClient(actor, tx);
  const user = await tx.user.findFirst({ where: { id: actor.id, role: { permissions: { some: { permission: { key: "client.read.self" } } } } }, select: { locale: true } });
  if (!user) throw new ApiError(403, "PERMISSION_DENIED", "This action is not permitted.");
  return { ...client, locale: user.locale };
}
async function snapshot(tx: Prisma.TransactionClient, actor: Principal, draft: AssistantActionDraft, sessionId: string) {
  const client = await ownedClient(tx, actor);
  if (draft.kind === "OFFICE_MESSAGE") {
    if (!draft.targetId) return { subject: null, status: "NEW" };
    await tx.$queryRaw`SELECT id FROM conversation_threads WHERE id = ${draft.targetId}::uuid FOR UPDATE`;
    const row = await tx.conversationThread.findFirst({ where: { id: draft.targetId, clientId: client.id }, select: { id: true, subject: true, status: true, updatedAt: true } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
    return row;
  }
  if (draft.kind === "ALTERNATIVE_TIME") {
    if (!draft.targetId) throw new ApiError(400, "VALIDATION_ERROR", "Select a request first.");
    await tx.$queryRaw`SELECT id FROM consultation_requests WHERE id = ${draft.targetId}::uuid FOR UPDATE`;
    const row = await tx.consultationRequest.findFirst({ where: { id: draft.targetId, clientId: client.id }, select: { id: true, publicReference: true, status: true, outcomeVersion: true, updatedAt: true } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    return row;
  }
  if (draft.kind === "BOOKING") {
    const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: sessionId } });
    const request = session.consultationRequestId ? await tx.consultationRequest.findFirst({ where: { id: session.consultationRequestId, clientId: client.id }, select: { id: true, publicReference: true, updatedAt: true, outcomeVersion: true, appointments: { where: { type: "CONSULTATION", caseId: null }, orderBy: { createdAt: "desc" }, select: { id: true, startsAt: true, status: true, updatedAt: true } } } }) : null;
    if (session.consultationRequestId && !request) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    const settings = await tx.systemSetting.findUnique({ where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY }, select: { value: true, updatedAt: true } });
    return { request, settings };
  }
  if (draft.kind === "SERVICE") {
    if (!draft.targetId) throw new ApiError(400, "VALIDATION_ERROR", "Select a request first.");
    await tx.$queryRaw`SELECT id FROM service_requests WHERE id = ${draft.targetId}::uuid FOR UPDATE`;
    const row = await tx.serviceRequest.findFirst({ where: { id: draft.targetId, clientId: client.id }, include: { questionnaire: { select: { questions: true } } } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    return { revision: row.revision, reference: row.reference, status: row.status, quote: row.quote, quoteVersion: row.quoteVersion, intake: row.intake, questions: row.questionnaire?.questions };
  }
  return { fullName: client.fullName, phone: client.phone, email: client.email, city: client.city, locale: client.locale, updatedAt: client.updatedAt };
}

export async function proposeAssistantAction(input: { sessionId: string; actor: Principal; messageId: string; draft: unknown; locale: "ar" | "en" }) {
  if (!assistantActionsEnabled(input.actor.clientId)) throw new ApiError(409, "FEATURE_DISABLED", "Assistant actions are disabled.");
  const draft = assistantActionDraftSchema.parse(input.draft);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${input.sessionId}::uuid FOR UPDATE`;
    const session = await tx.assistantSession.findFirst({ where: { id: input.sessionId, clientId: input.actor.clientId, expiresAt: { gt: new Date() } } });
    if (!session) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    const existing = await tx.assistantActionProposal.findUnique({ where: { sessionId_messageId: { sessionId: session.id, messageId: input.messageId } } });
    if (existing) return existing; // Retry a turn without creating a second proposal.
    const current = await snapshot(tx, input.actor, draft, session.id);
    const c = assistantActionCopy[input.locale];
    const lines: string[] = [];
    if (draft.kind === "PROFILE") {
      if (!Object.keys(draft.changes).length) throw new ApiError(400, "VALIDATION_ERROR", "Profile payload is invalid.");
      for (const [key, value] of Object.entries(draft.changes)) lines.push(`${c.fields[key as keyof typeof draft.changes]}: ${String(current[key as keyof typeof current] ?? "")} → ${value}`);
    } else if (draft.kind === "PREFERENCE") lines.push(`${c.fields.locale}: ${draft.locale}`);
    else if (draft.kind === "SERVICE_CREATE") lines.push(c.services[draft.service]);
    else if (draft.kind === "OFFICE_MESSAGE") lines.push("subject" in current ? current.subject ?? "" : "", draft.message);
    else if (draft.kind === "ALTERNATIVE_TIME") lines.push("publicReference" in current ? current.publicReference ?? "" : "", new Intl.DateTimeFormat(input.locale, { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(draft.startsAt)), draft.mode);
    else if (draft.kind === "BOOKING") {
      const { kind: _kind, operation, ...fields } = draft;
      directBookingInputSchema.parse({ ...fields, action: operation, key: input.messageId, revision: session.revision, confirmed: true });
      lines.push(c.bookings[draft.operation], ...(draft.startsAt ? [new Intl.DateTimeFormat(input.locale, { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(draft.startsAt))] : []), draft.fullName ?? "", draft.phone ?? "", draft.contactChannel ?? "");
      if ("request" in current && current.request) lines.push(current.request.publicReference ?? "", ...current.request.appointments.map(a => a.startsAt.toISOString()));
    } else {
      lines.push(`${c.fields.reference}: ${"reference" in current ? current.reference : ""}`, c.operations[draft.operation]);
      if (draft.operation === "accept" && "quote" in current) {
        const quote = current.quote as { amount?: string; currency?: string; scope?: string; durationDays?: number } | null;
        if (!quote?.amount || !quote.currency || !quote.scope || !quote.durationDays) throw conflict();
        lines.push(`${c.fields.quote}: ${new Intl.NumberFormat(input.locale, { style: "currency", currency: quote.currency }).format(Number(quote.amount))}\n${quote.scope}\n${quote.durationDays} ${c.days}`);
      }
      if (draft.intake) {
        lines.push(`${c.fields.intake}: ${draft.intake.title}\n${draft.intake.purpose}\n${draft.intake.language}\n${draft.intake.requestedDate}`);
        const questions = "questions" in current && Array.isArray(current.questions) ? current.questions as Array<{ id: string; ar: string; en: string }> : [];
        for (const [id, answer] of Object.entries(draft.intake.answers)) {
          const question = questions.find(q => q.id === id);
          if (!question) throw new ApiError(400, "VALIDATION_ERROR", "Unknown question.");
          lines.push(`${question[input.locale]}: ${c.answers[answer]}`);
        }
      }
      if (draft.message) lines.push(`${c.fields.message}: ${draft.message}`);
    }
    return tx.assistantActionProposal.create({ data: { sessionId: session.id, clientId: input.actor.clientId!, messageId: input.messageId, kind: draft.kind,
      targetId: "targetId" in draft ? draft.targetId : null, payload: json(draft), snapshotHash: hash(current), preview: { title: c.kinds[draft.kind], lines }, expiresAt: new Date(Date.now() + 15 * 60_000) } });
  });
}

export async function resolveAssistantAction(input: { sessionId: string; actor: Principal; proposalId: string; decision: "confirm" | "cancel" }) {
  if (!assistantActionsEnabled(input.actor.clientId)) throw new ApiError(409, "FEATURE_DISABLED", "Assistant actions are disabled.");
  return runAppointmentConflictTransaction({ mode: APPOINTMENT_TRANSACTION_MODES.databaseCreateBoundedRetry, serializationConflictError: conflict, operation: async tx => {
    await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${input.sessionId}::uuid FOR UPDATE`;
    const session = await tx.assistantSession.findFirst({ where: { id: input.sessionId, clientId: input.actor.clientId, expiresAt: { gt: new Date() } } });
    if (!session) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    if (session.leaseId) throw conflict();
    await ownedClient(tx, input.actor);
    const proposal = await tx.assistantActionProposal.findFirst({ where: { id: input.proposalId, sessionId: session.id, clientId: input.actor.clientId! } });
    if (!proposal) throw new ApiError(404, "NOT_FOUND", "Action proposal not found.");
    if (proposal.status !== "PENDING") return { status: proposal.status, result: proposal.result };
    if (input.decision === "cancel") {
      await tx.assistantActionProposal.update({ where: { id: proposal.id }, data: { status: "CANCELLED", completedAt: new Date() } });
      return { status: "CANCELLED", result: null };
    }
    const draft = assistantActionDraftSchema.parse(proposal.payload);
    const current = await snapshot(tx, input.actor, draft, session.id);
    if (proposal.expiresAt <= new Date() || proposal.snapshotHash !== hash(current)) {
      await tx.assistantActionProposal.update({ where: { id: proposal.id }, data: { status: "STALE", completedAt: new Date() } });
      return { status: "STALE", result: null };
    }
    let result: unknown;
    if (draft.kind === "PROFILE") {
      await updatePortalProfile({ actor: input.actor, transaction: tx, body: { fullName: "fullName" in current ? current.fullName : "", phone: "phone" in current ? current.phone : "", email: "email" in current ? current.email ?? "" : "", city: "city" in current ? current.city ?? "" : "", ...draft.changes } });
      result = { updated: true };
    } else if (draft.kind === "PREFERENCE") {
      result = await updateClientPreferences({ actor: input.actor, body: { locale: draft.locale }, client: tx, audit: event => appendAuditLog({ ...event, client: tx }) });
    } else if (draft.kind === "SERVICE_CREATE") {
      const row = await createServiceRequest(input.actor, { kind: draft.service, locale: session.locale, idempotencyKey: proposal.id }, tx);
      result = { id: row.id, reference: row.reference };
    } else if (draft.kind === "OFFICE_MESSAGE") {
      const thread = await replyClientConversationInTransaction(tx, { actor: input.actor, threadId: draft.targetId, body: { message: draft.message }, locale: session.locale === "en" ? "en" : "ar" });
      await tx.assistantSession.update({ where: { id: session.id }, data: { dialogue: json({ ...readDialogue(session.dialogue), activeDomain: "ACCOUNT", followup: { category: "CONVERSATION", selected: { kind: "CONVERSATION", id: thread.id } } }), revision: { increment: 1 } } });
      result = { id: thread.id, queued: true };
    } else if (draft.kind === "ALTERNATIVE_TIME") {
      result = await requestAlternativeTime(input.actor, draft.targetId!, { startsAt: draft.startsAt, mode: draft.mode, version: "outcomeVersion" in current ? current.outcomeVersion : -1 }, tx);
    } else if (draft.kind === "BOOKING") {
      const { kind: _kind, operation, ...fields } = draft;
      const body = directBookingInputSchema.parse({ ...fields, action: operation, key: proposal.id, revision: session.revision, confirmed: true });
      await mutateDirectBooking("", body, input.actor, { client: tx, sessionId: session.id });
      result = { action: operation, completed: true };
    } else {
      const revision = "revision" in current ? current.revision : -1;
      const action = draft.operation === "changes" || draft.operation === "cancel" ? { action: "transition", status: draft.operation === "cancel" ? "CANCELLED" : "IN_PROGRESS", body: draft.message ?? "" } :
        draft.operation === "accept" ? { action: "accept", quoteVersion: "quoteVersion" in current ? current.quoteVersion : 0 } :
        draft.operation === "save" ? { action: "save", intake: draft.intake } : draft.operation === "message" ? { action: "message", body: draft.message, internal: false } : { action: "submit" };
      result = await actOnServiceRequest(input.actor, draft.targetId!, { ...action, revision }, tx);
    }
    await tx.assistantActionProposal.update({ where: { id: proposal.id }, data: { status: "COMPLETED", completedAt: new Date(), result: json(result) } });
    await appendAuditLog({ client: tx, actorId: input.actor.id, action: "assistant.action_confirmed", resourceType: "AssistantActionProposal", resourceId: proposal.id, metadata: { kind: draft.kind } });
    return { status: "COMPLETED", result };
  } });
}
