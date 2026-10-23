import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { conversationCopy } from "@/content/conversation-copy";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { listDirectBookingSlots, readDirectBooking } from "./direct-booking-service";
import { safeLog } from "@/server/observability/safe-log";
import { assistantKnowledge } from "./assistant-knowledge";
import { getAIProviderConfig } from "@/server/ai/config";
import { getAIProvider } from "@/server/ai/provider-registry";
import { applyAssessment, bookingAllowed, boundedConversationProvider, conversationDiagnostics, explicitBookingRequest, INPUT_POLICY, messageAssessmentSchema, OUTPUT_POLICY, policyDecision, readDialogue, replyReviewSchema, shouldOfferConsultation, type DialogueState } from "@/server/ai/company-conversation-policy";
import { bindAssistantThreadIdentity, ensureAssistantHandoff } from "@/server/conversations/assistant-handoff-service";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { MAX_CONVERSATION_CONTEXT_CHARS, runConversationTurn } from "@/server/ai/conversation-gateway";
import type { AIChatMessage } from "@/server/ai/types";
import { appendAuditLog } from "@/server/audit/audit-service";
import type { Principal } from "@/server/auth/policy";
import { assistantSystemPrompt, intakeDraftSchema } from "./conversation-contract";
import { consultationSlotFilterSchema } from "./consultation-availability-service";
import { bookingAvailabilityToolResult } from "./booking-availability-tool";
import { assertActiveServiceClient } from "@/server/services/service-request-service";
import { assistantCategory, assistantCursor, assistantRecordRef, type Category, type RecordCursor } from "@/server/portal/client-assistant-contract";
import { clientAssistantDueBalances, getClientAssistantRecord, listClientAssistantRecords } from "@/server/portal/client-assistant-data";
import { followupCategory, normalizeFollowup, renderClientRecord, resolveClientFollowup } from "@/server/portal/client-assistant-followup";
import { clientAssistantCopy } from "@/content/client-assistant-copy";
import { formatDateTime } from "@/lib/legal-format";
import { getClientContent } from "@/content/client-content";
import { legalSourceMetadata, readLegalSources } from "@/lib/legal-assistant";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";
import { legalContextForMessage, legalSubjectQuestion, explicitAccountQuestion, legalFactCorrection } from "@/server/ai/legal-context";
import { legalTopics } from "@/server/ai/legal-assistance-contract";
import { composeLegalAssistance } from "@/server/ai/legal-assistance-service";
import { rememberLegalMessage, rememberLegalQuestion } from "@/server/ai/legal-memory";
import { actionRequest } from "@/server/ai/assistant-action-contract";
import { assistantActionsEnabled, proposeAssistantAction } from "./assistant-action-service";
import { assistantActionCopy } from "@/content/assistant-action-copy";
import { noOutsideReferral } from "@/server/ai/legal-safety";
import type { ClientRecord } from "@/server/portal/client-assistant-contract";

export const ASSISTANT_COOKIE = "kmt_assistant";
export const capabilityHash = (value: string) => createHash("sha256").update(value).digest("hex");
const ACCOUNT_FACTS_MARKER = "CLIENT_ACCOUNT_FACTS";
const LEGAL_ANSWER_MARKER = "LEGAL_ASSISTANCE_ANSWER";
function answeredExchange(turn: { protocol: Prisma.JsonValue }) {
  return !privateAnswer(turn) && Array.isArray(turn.protocol) && turn.protocol.some(value => value && typeof value === "object" && !Array.isArray(value) && (value.role === "assistant" || (value.role === "system" && value.content === LEGAL_ANSWER_MARKER)));
}
function privateAnswer(turn: { protocol: Prisma.JsonValue }) {
  return Array.isArray(turn.protocol) && turn.protocol.some(value => value && typeof value === "object" && !Array.isArray(value) && value.role === "system" && value.content === ACCOUNT_FACTS_MARKER);
}
function historyAnswer(turn: { protocol: Prisma.JsonValue; assistantText: string | null }) {
  return privateAnswer(turn) ? "Account facts omitted. Use current owned-record tools for the selected record." : turn.assistantText;
}
export function assistantCapability(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(`${ASSISTANT_COOKIE}=`))?.slice(ASSISTANT_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function createAssistantSession(locale: "ar" | "en", actor?: Principal | null, initialService?: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.assistantSession.create({ data: {
    capabilityHash: capabilityHash(token), locale, clientId: actor?.clientId ?? null,
    draft: initialService ? intakeDraftSchema.parse({ service: initialService }) : {},
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000)
  } });
  return token;
}

export async function ownAssistantSession(token: string, actor?: Principal | null) {
  const session = await prisma.assistantSession.findUnique({ where: { capabilityHash: capabilityHash(token) } });
  // Once linked, the guest capability alone can no longer read the conversation or the client data.
  if (!session || session.expiresAt <= new Date() || (session.clientId && session.clientId !== actor?.clientId)) {
    throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
  }
  if (session.clientId && actor) await assertActiveServiceClient(actor);
  if (session.leaseId && (!session.leaseExpiresAt || session.leaseExpiresAt <= new Date())) {
    // Lock the expired parent owner before releasing it and failing its orphan reply.
    // A replacement worker cannot acquire this row halfway through recovery.
    await prisma.$transaction(async tx => {
      const released = await tx.assistantSession.updateMany({ where: {
        id: session.id, leaseId: session.leaseId, clientId: session.clientId,
        OR: [{ leaseExpiresAt: { lte: new Date() } }, { leaseExpiresAt: null }]
      }, data: { leaseId: null, leaseExpiresAt: null, revision: { increment: 1 } } });
      if (released.count) await tx.assistantTurn.updateMany({ where: { sessionId: session.id, status: "PENDING" }, data: { status: "FAILED", errorCode: "AI_PROVIDER_TIMEOUT" } });
    });
    const recovered = await prisma.assistantSession.findUnique({ where: { id: session.id } });
    if (!recovered || recovered.expiresAt <= new Date() || (recovered.clientId && recovered.clientId !== actor?.clientId)) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
    return recovered;
  }
  return session;
}

export async function readAssistantSession(token: string, actor?: Principal | null) {
  const session = await ownAssistantSession(token, actor);
  const savedTurns = await prisma.assistantTurn.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: "asc" }, take: 100,
    select: { messageId: true, recipient: true, userText: true, assistantText: true, status: true, errorCode: true, createdAt: true, updatedAt: true, protocol: true } });
  const turns = savedTurns.map(({ protocol, ...turn }) => ({ ...turn, sources: readLegalSources(protocol) }));
  const staffMessages = session.conversationThreadId ? await prisma.conversationMessage.findMany({
    where: { threadId: session.conversationThreadId, senderType: "STAFF" }, orderBy: { createdAt: "asc" }, take: 100,
    select: { id: true, body: true, createdAt: true }
  }) : [];
  const thread = session.conversationThreadId ? await prisma.conversationThread.findUnique({ where: { id: session.conversationThreadId }, select: { status: true } }) : null;
  const accountReady = session.clientId && actor ? await prisma.client.count({ where: { id: session.clientId, userId: actor.id, deletedAt: null, user: { status: "ACTIVE", deletedAt: null, role: { status: "ACTIVE" } } } }) : 0;
  const proposals = accountReady && assistantActionsEnabled(session.clientId) ? await prisma.assistantActionProposal.findMany({ where: { sessionId: session.id, clientId: session.clientId! }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, messageId: true, preview: true, status: true, expiresAt: true } }) : [];
  return { locale: session.locale === "en" ? "en" : "ar", handoffState: session.humanOwned ? "CLAIMED" : session.handoffRequestedAt ? "QUEUED" : "NONE", booking: await readDirectBooking(session.consultationRequestId), dialogue: readDialogue(session.dialogue), draft: session.draft, revision: session.revision, accountReady: accountReady > 0, humanOwned: session.humanOwned, closed: !!thread && ["CLOSED", "ARCHIVED"].includes(thread.status), submitted: !!session.consultationRequestId, turns, staffMessages,
    proposals, messageLimitReached: savedTurns.length >= 60,
    officeThreadStatus: thread?.status ?? null, expiresAt: session.expiresAt.toISOString(),
    officeContact: session.officePhone && session.officeContactChannel && session.officeContactConsentedAt
      ? { phone: session.officePhone, contactChannel: session.officeContactChannel, consentedAt: session.officeContactConsentedAt.toISOString() } : null };
}

export async function sendAssistantMessage(input: {
  token: string; actor?: Principal | null; messageId: string; message: string; locale: "ar" | "en"; requestId: string; recipient?: "ASSISTANT" | "OFFICE"; assertIdentity?: () => Promise<void>;
}) {
  const session = await ownAssistantSession(input.token, input.actor);
  const recipient = input.recipient ?? "ASSISTANT";
  const identity = { sessionId_messageId: { sessionId: session.id, messageId: input.messageId } };
  const previous = await prisma.assistantTurn.findUnique({ where: identity });
  if (previous && (previous.userText !== input.message || previous.recipient !== recipient)) throw new ApiError(409, "CONFLICT", "Message identifier has already been used.");
  if (previous?.status === "COMPLETED" || previous?.status === "HUMAN") return readAssistantSession(input.token, input.actor);
  // Validate routing before taking a lease; invalid configuration must not strand a turn.
  const config = getAIProviderConfig();
  const leaseId = randomUUID();
  const acquired = await prisma.assistantSession.updateMany({ where: {
    id: session.id, revision: session.revision, OR: [{ leaseId: null }, { leaseExpiresAt: { lt: new Date() } }]
  }, data: { leaseId, leaseExpiresAt: new Date(Date.now() + 90_000), locale: input.locale } });
  if (!acquired.count) throw new ApiError(409, "CONFLICT", "A conversation response is already in progress.");
  const diagnostics = conversationDiagnostics(input.requestId, config.conversationTimeoutMs, config.timeoutMs);
  try {
    const replay = await prisma.assistantTurn.findUnique({ where: identity });
    if (replay && (replay.userText !== input.message || replay.recipient !== recipient)) throw new ApiError(409, "CONFLICT", "Message identifier has already been used.");
    if (replay?.status === "COMPLETED" || replay?.status === "HUMAN") return readAssistantSession(input.token, input.actor);
    const count = await prisma.assistantTurn.count({ where: { sessionId: session.id } });
    if (!previous && count >= 60) throw new ApiError(429, "CONVERSATION_LIMIT_REACHED", "Conversation message limit reached.");
    await prisma.assistantTurn.upsert({ where: identity,
      create: { sessionId: session.id, messageId: input.messageId, userText: input.message, recipient },
      update: { status: "PENDING", errorCode: null }
    });
    if (recipient === "OFFICE") {
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM assistant_sessions WHERE id = ${session.id}::uuid FOR UPDATE`;
        const fresh = await tx.assistantSession.findUniqueOrThrow({ where: { id: session.id } });
        if (fresh.expiresAt <= new Date() || (fresh.clientId && fresh.clientId !== input.actor?.clientId)) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
        if (fresh.leaseId !== leaseId || !fresh.leaseExpiresAt || fresh.leaseExpiresAt <= new Date()) throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
        if (fresh.conversationThreadId) {
          const thread = await tx.conversationThread.findUniqueOrThrow({ where: { id: fresh.conversationThreadId } });
          if (["CLOSED", "ARCHIVED"].includes(thread.status)) throw new ApiError(409, "CONFLICT", "This conversation is closed.");
        }
        await tx.assistantTurn.update({ where: identity, data: { status: "HUMAN" } });
        const threadId = await ensureAssistantHandoff(tx, session.id);
        await tx.conversationThread.update({ where: { id: threadId }, data: { status: "WAITING_STAFF", lastMessageAt: new Date() } });
        await tx.assistantSession.update({ where: { id: session.id }, data: { handoffRequestedAt: fresh.handoffRequestedAt ?? new Date(), revision: { increment: 1 } } });
      });
      return readAssistantSession(input.token, input.actor);
    }
    const assertActive = async () => {
      await input.assertIdentity?.();
      const current = await ownAssistantSession(input.token, input.actor);
      if (current.leaseId !== leaseId || !current.leaseExpiresAt || current.leaseExpiresAt <= new Date()) {
        throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
      }
    };
    const prior = await prisma.assistantTurn.findMany({ where: { sessionId: session.id, recipient: "ASSISTANT", status: { in: ["COMPLETED", "FAILED"] }, messageId: { not: input.messageId } }, orderBy: { createdAt: "desc" }, take: 20 });
    const signal = AbortSignal.timeout(config.conversationTimeoutMs);
    const provider = boundedConversationProvider(getAIProvider(config), signal, assertActive, diagnostics);
    const history: Array<{ user: string; assistant: string | null }> = [];
    let historyChars = 0;
    for (const turn of prior) {
      const pair = { user: turn.userText, assistant: turn.status === "FAILED" ? null : historyAnswer(turn) };
      const size = JSON.stringify(pair).length;
      if (historyChars + size > 24_000) break;
      history.unshift(pair); historyChars += size;
    }
    const initialDialogue = readDialogue(session.consultationRequestId ? { ...readDialogue(session.dialogue), mode: "INQUIRY", consentAt: null } : session.dialogue);
    const formText = normalizeFollowup(input.message);
    const directBooking = !session.consultationRequestId && explicitBookingRequest(input.message);
    const formFollowup = bookingAllowed(initialDialogue) && !session.consultationRequestId &&
      !/^\s*[\[{]/.test(input.message) &&
      !explicitAccountQuestion(input.message) && !legalSubjectQuestion(input.message) &&
      !/(?:مش|لا اريد|لا ارغب|الغ|الغاء|cancel|decline|withdraw|don't|do not)/i.test(formText) &&
      (/^(?:امتي|متي|ايه|ما هي|اعرض|وريني|مواعيد|الاوقات|what|when|show|which|are there).*(?:مواعيد|اوقات|وقت|متاح|appointment|available|slots?)/i.test(formText) ||
        (formText.split(/\s+/).length <= 15 && /\b(?:\+?20)?0?1[0125]\d{8}\b/.test(formText)));
    const knowledge = assistantKnowledge(input.locale);
    const legalContinuation = initialDialogue.activeDomain === "LEGAL" && !explicitAccountQuestion(input.message) && !(/^\s*[1-5][؟?.\s]*$/.test(input.message) && initialDialogue.followup?.choices && !initialDialogue.legal?.useSelectedRecord);
    const category = (initialDialogue.mode === "BOOKING" && !initialDialogue.followup) || legalContinuation || actionRequest(input.message) ? null : followupCategory(input.message, initialDialogue.followup);
    let assessment = directBooking ? messageAssessmentSchema.parse({ scope: "OFFICE", intent: "BOOK", evidence: input.message, locale: input.locale, offerAppropriate: false, inScopeQuestion: input.message }) : formFollowup ? messageAssessmentSchema.parse({ scope: "OFFICE", intent: "NONE", evidence: "", locale: input.locale, offerAppropriate: false, inScopeQuestion: input.message }) : category ? messageAssessmentSchema.parse({ scope: "OFFICE", intent: "FOLLOW_UP", evidence: input.message, locale: input.locale, offerAppropriate: false, inScopeQuestion: input.message }) : await policyDecision(provider, messageAssessmentSchema, "classify_company_message", INPUT_POLICY,
      { message: input.message, history, dialogue: initialDialogue, legalTopics: Object.keys(legalTopics), memoryInstruction: "For legal dialogue return factQuotes: up to three exact verbatim spans from the CURRENT customer message containing relevant facts or corrections. Never quote assistant claims. Retain the existing topic for short factual answers; use new topics only for an actual subject change.", actionInstruction: "For an explicit request to change the customer's contact profile, language, service request or consultation booking, request an alternative consultation time, or prepare a message to the office, use OFFICE/ACTION and actionDraft with exact current evidence. This only prepares a proposal for a separate confirmation button; never interpret yes/okay as execution. Use only a targetId from the server dialogue selection; omit when unknown. Never invent missing fields. Login credentials, payments and uploads use existing secure account pages. General legal advice about cancellation is LEGAL, not ACTION.", serviceIds: knowledge.services.map(s => ({ id: s.id, title: s.title })) }, input.requestId);
    if (assessment.intent === "FOLLOW_UP" && (legalSubjectQuestion(input.message) || legalContinuation)) assessment = { ...assessment, scope: "LEGAL", intent: "NONE", evidence: "" };
    if (legalContinuation && legalFactCorrection(input.message) && ["ACTION", "ACCOUNT", "FOLLOW_UP"].includes(assessment.intent)) {
      assessment = { ...assessment, scope: "LEGAL", intent: "NONE", evidence: "", actionDraft: undefined, accountEvidence: undefined, offerAppropriate: false };
    }
    await assertActive();
    const copy = assistantPolicyCopy[assessment.locale];
    const dialogue = applyAssessment(initialDialogue, assessment, input.message);
    if (assessment.intent === "FOLLOW_UP") dialogue.activeDomain = "ACCOUNT";
    else if (assessment.scope === "OFFICE" || ["BOOK", "ACCOUNT", "HANDOFF"].includes(assessment.intent)) dialogue.activeDomain = "OFFICE";
    const policyFallback = dialogue.mode === "INQUIRY" ? copy.safeReply : directBookingCopy[assessment.locale].fallback;
    let groundedReply: string | undefined;
    let containsPrivateFacts = false;
    const assertPrivate = async () => {
      await assertActive();
      if (!input.actor?.clientId) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
      await assertActiveServiceClient(input.actor);
      // A guest capability must lose anonymous access BEFORE any personal answer is persisted.
      await prisma.$transaction(async tx => {
        const fresh = await tx.assistantSession.findUniqueOrThrow({ where: { id: session.id } });
        if (fresh.clientId === input.actor!.clientId) return;
        const linked = await tx.assistantSession.updateMany({ where: { id: session.id, clientId: null, leaseId, leaseExpiresAt: { gt: new Date() } }, data: { clientId: input.actor!.clientId } });
        if (!linked.count) throw new ApiError(401, "AUTH_REQUIRED", "Authentication required.");
        await bindAssistantThreadIdentity(tx, session.id, input.actor!.clientId!);
      });
    };
    const privateRead = async <T>(read: () => Promise<T>) => {
      await assertPrivate();
      try { return await read(); }
      catch (error) {
        if (error instanceof ApiError && ["AUTH_REQUIRED", "PERMISSION_DENIED", "CONFLICT"].includes(error.code)) throw error;
        const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
        safeLog("warn", "assistant.followup", { requestId: input.requestId, reason: notFound ? "NOT_FOUND" : "DATA_UNAVAILABLE" });
        groundedReply = clientAssistantCopy[assessment.locale][notFound ? "notFound" : "unavailable"];
        return { unavailable: !notFound, found: false };
      }
    };
    let preparedDraft: ReturnType<typeof intakeDraftSchema.parse> | undefined;
    const finalize = async (text: string, state: DialogueState, protocol: AIChatMessage[] = [], draft?: ReturnType<typeof intakeDraftSchema.parse>) => {
      await assertActive();
      await prisma.$transaction(async tx => {
        const claimed = await tx.assistantSession.updateMany({ where: { id: session.id, leaseId, leaseExpiresAt: { gt: new Date() } }, data: {
          revision: { increment: 1 }, dialogue: state as Prisma.InputJsonValue, locale: assessment.locale,
          ...(draft ? { draft: draft as Prisma.InputJsonValue } : {})
        } });
        if (!claimed.count) throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
        const savedProtocol = input.actor?.clientId && (containsPrivateFacts || groundedReply || assessment.intent === "FOLLOW_UP") ? [...protocol, { role: "system", content: ACCOUNT_FACTS_MARKER }] : protocol;
        await tx.assistantTurn.update({ where: identity, data: { assistantText: text, protocol: savedProtocol as unknown as Prisma.InputJsonValue, status: "COMPLETED" } });
        const linked = await tx.assistantSession.findUniqueOrThrow({ where: { id: session.id }, select: { conversationThreadId: true } });
        if (linked.conversationThreadId) await ensureAssistantHandoff(tx, session.id);
      });
      return readAssistantSession(input.token, input.actor);
    };
    if (!session.consultationRequestId && bookingAllowed(dialogue) && (formFollowup || ["BOOK", "ACCEPT"].includes(assessment.intent))) {
      return await finalize(directBookingCopy[assessment.locale].intro, { ...dialogue, bookingFormRequestId: input.messageId });
    }
    if (assessment.intent === "HANDOFF") {
      const c = assistantActionCopy[assessment.locale];
      if (!assessment.evidence.trim() || !input.message.includes(assessment.evidence)) return await finalize(copy.clarify, dialogue);
      if (!input.actor?.clientId || !assistantActionsEnabled(input.actor.clientId)) return await finalize(c.officeReview, dialogue);
      await assertPrivate(); containsPrivateFacts = true;
      const targetId = dialogue.followup?.selected?.kind === "CONVERSATION" ? dialogue.followup.selected.id : session.conversationThreadId ?? undefined;
      await proposeAssistantAction({ sessionId: session.id, actor: input.actor, messageId: input.messageId, locale: assessment.locale, draft: { kind: "OFFICE_MESSAGE", targetId, message: input.message } });
      return await finalize(c.pending, dialogue);
    }
    if (assessment.intent === "ACTION") {
      if (!input.actor?.clientId) return await finalize(clientAssistantCopy[assessment.locale].login, dialogue);
      const c = assistantActionCopy[assessment.locale];
      if (!assistantActionsEnabled(input.actor.clientId)) return await finalize(c.disabled, dialogue);
      if (!assessment.actionDraft || !assessment.evidence.trim() || !input.message.includes(assessment.evidence) || !actionRequest(input.message)) return await finalize(copy.clarify, dialogue);
      await assertPrivate(); containsPrivateFacts = true;
      const draft = assessment.actionDraft;
      if (draft.kind === "OFFICE_MESSAGE" && !draft.targetId) {
        if (dialogue.followup?.selected?.kind === "CONVERSATION") draft.targetId = dialogue.followup.selected.id;
        else if (session.conversationThreadId) draft.targetId = session.conversationThreadId;
      }
      if (draft.kind === "ALTERNATIVE_TIME" && !draft.targetId) {
        if (dialogue.followup?.selected?.kind === "CONSULTATION") draft.targetId = dialogue.followup.selected.id;
        else if (session.consultationRequestId) draft.targetId = session.consultationRequestId;
        else return await finalize(c.choose, dialogue);
      }
      if (draft.kind === "SERVICE" && !draft.targetId) {
        if (dialogue.followup?.selected?.kind === "SERVICE_REQUEST") draft.targetId = dialogue.followup.selected.id;
        else {
          const followup = await resolveClientFollowup({ actor: input.actor, message: input.message, locale: assessment.locale, category: "SERVICE_REQUEST", focus: dialogue.followup });
          dialogue.followup = followup.focus;
          if (followup.focus.selected?.kind === "SERVICE_REQUEST") draft.targetId = followup.focus.selected.id;
          else return await finalize(`${followup.text}\n\n${c.choose}`, dialogue);
        }
      }
      await proposeAssistantAction({ sessionId: session.id, actor: input.actor, messageId: input.messageId, draft, locale: assessment.locale });
      return await finalize(c.pending, dialogue);
    }
    if (assessment.intent === "FOLLOW_UP" && input.actor?.clientId) {
      await assertPrivate();
      try {
        const followup = await resolveClientFollowup({ actor: input.actor, message: input.message, locale: assessment.locale, category: category ?? assessment.followupCategory ?? initialDialogue.followup?.category ?? "REQUESTS", focus: initialDialogue.followup });
        dialogue.followup = followup.focus;
        safeLog("info", "assistant.followup", { requestId: input.requestId, reason: "SERVER_FACTS", category: followup.focus.category });
        return await finalize(followup.text, dialogue);
      } catch (error) {
        if (error instanceof ApiError && ["AUTH_REQUIRED", "PERMISSION_DENIED", "CONFLICT"].includes(error.code)) throw error;
        safeLog("warn", "assistant.followup", { requestId: input.requestId, reason: "DATA_UNAVAILABLE" });
        return await finalize(clientAssistantCopy[assessment.locale].unavailable, dialogue);
      }
    }
    if (category && !input.actor?.clientId && !["REQUESTS", "CONSULTATION", "APPOINTMENT"].includes(category)) return await finalize(clientAssistantCopy[assessment.locale].login, dialogue);
    if (category && !session.consultationRequestId) {
      const c = clientAssistantCopy[assessment.locale];
      if (session.conversationThreadId && /رد|reply|response/.test(input.message)) {
        const reply = await prisma.conversationMessage.findFirst({ where: { threadId: session.conversationThreadId, senderType: "STAFF" }, orderBy: { createdAt: "desc" }, select: { body: true } });
        return await finalize(reply ? `${c.officeReply}: ${reply.body.slice(0, 1000)}` : c.noReply, dialogue);
      }
      return await finalize(c.login, dialogue);
    }
    if (category && !input.actor?.clientId) {
      const c = clientAssistantCopy[assessment.locale];
      try {
        const booking = await readDirectBooking(session.consultationRequestId);
        if (!booking) return await finalize(c.login, dialogue);
        const appointment = booking.appointments[0];
        const cancelled = appointment?.status === "CANCELLED";
        const confirmed = appointment && ["SCHEDULED", "RESCHEDULED"].includes(appointment.status);
        const staff = session.conversationThreadId ? await prisma.conversationMessage.findFirst({ where: { threadId: session.conversationThreadId, senderType: "STAFF" }, orderBy: { createdAt: "desc" }, select: { body: true } }) : null;
        return await finalize([`${c.kinds.CONSULTATION} — ${booking.publicReference ?? ""}`, `${c.status}: ${c.consultation[cancelled ? "CANCELLED" : booking.status]}`,
          ...(confirmed ? [`${c.appointment}: ${formatDateTime(appointment.startsAt, assessment.locale)} (${getClientContent(assessment.locale).statuses.appointment[appointment.status as "SCHEDULED" | "RESCHEDULED"]})`] : []),
          ...(staff ? [`${c.officeReply}: ${staff.body.slice(0, 1000)}`] : /رد|reply|response/.test(input.message) ? [c.noReply] : [])].join("\n"), dialogue);
      } catch (error) {
        if (error instanceof ApiError && ["AUTH_REQUIRED", "PERMISSION_DENIED", "CONFLICT"].includes(error.code)) throw error;
        safeLog("warn", "assistant.followup", { requestId: input.requestId, reason: "GUEST_DATA_UNAVAILABLE" });
        return await finalize(c.unavailable, dialogue);
      }
    }
    if (assessment.scope === "OFF_TOPIC") { safeLog("info", "assistant.policy_rejected", { requestId: input.requestId, reason: "OUT_OF_SCOPE" }); return await finalize(copy.outside, initialDialogue); }
    if (assessment.scope === "UNCLEAR") return await finalize(copy.clarify, initialDialogue);
    if (assessment.intent === "UNCLEAR") return await finalize(copy.consentClarify, initialDialogue);
    if (["DECLINE", "WITHDRAW"].includes(assessment.intent) && dialogue.mode === "INQUIRY" && dialogue.offerShown) return await finalize(copy.withdrawn, dialogue);
    const approvedKnowledge = assistantKnowledge(assessment.locale);
    if ((["LEGAL", "RELATED_LEGAL"].includes(assessment.scope) || (assessment.scope === "MIXED" && assessment.legal)) && assessment.intent === "NONE") {
      const legal = legalContextForMessage(initialDialogue.legal, assessment.legal, input.message);
      if (legal.conflict) return await finalize(legalAssistantCopy[assessment.locale].conflict, dialogue);
      dialogue.legal = legal.context;
      dialogue.activeDomain = "LEGAL";
      let ownedRecord: ClientRecord | undefined;
      const evidence = assessment.accountEvidence;
      const explicitOwnAnalysis = !!evidence && input.message.includes(evidence) && explicitAccountQuestion(input.message);
      const continuingOwnAnalysis = legalContinuation && initialDialogue.legal?.useSelectedRecord && JSON.stringify(legal.context.topics) === JSON.stringify(initialDialogue.legal.topics);
      legal.context.useSelectedRecord = explicitOwnAnalysis || !!continuingOwnAnalysis;
      if (legal.context.useSelectedRecord) {
        if (!input.actor?.clientId) return await finalize(clientAssistantCopy[assessment.locale].login, dialogue);
        await assertPrivate(); containsPrivateFacts = true;
        try {
          const legalCategory = assessment.followupCategory ?? (/قضيتي|my case/i.test(input.message) ? "CASE" : dialogue.followup?.category ?? "CASE");
          const followup = await resolveClientFollowup({ actor: input.actor, message: input.message, locale: assessment.locale, category: legalCategory, focus: dialogue.followup });
          dialogue.followup = followup.focus;
          if (!followup.record) return await finalize(followup.text, dialogue);
          ownedRecord = followup.record;
        } catch (error) {
          if (error instanceof ApiError && ["AUTH_REQUIRED", "PERMISSION_DENIED", "CONFLICT"].includes(error.code)) throw error;
          safeLog("warn", "assistant.legal_data", { requestId: input.requestId, reason: error instanceof ApiError && error.code === "NOT_FOUND" ? "NOT_FOUND" : "DATA_UNAVAILABLE" });
          return await finalize(clientAssistantCopy[assessment.locale][error instanceof ApiError && error.code === "NOT_FOUND" ? "notFound" : "unavailable"], dialogue);
        }
      }
      const memory = rememberLegalMessage(dialogue.legalMemory, { messageId: input.messageId, message: input.message, context: legal.context, quotes: assessment.factQuotes });
      // Customer claims survive a rejected/provider-failed answer. No unreviewed assistant prose is saved.
      dialogue.legalMemory = memory;
      await assertActive();
      const remembered = await prisma.assistantSession.updateMany({ where: { id: session.id, leaseId, leaseExpiresAt: { gt: new Date() } }, data: { dialogue: dialogue as Prisma.InputJsonValue } });
      if (!remembered.count) throw new ApiError(409, "CONFLICT", "Conversation ownership changed.");
      const legalReply = await composeLegalAssistance({ provider, context: legal.context, locale: assessment.locale, message: input.message, requestId: input.requestId, history, memory, knowledge: approvedKnowledge, showJurisdiction: legal.changed, showResearchNotice: legal.changed || !dialogue.legalResearchNoticeShown, ownedRecord });
      dialogue.legalResearchNoticeShown ||= legalReply.researchNoticeShown;
      dialogue.legalMemory = rememberLegalQuestion(memory, input.messageId, legalReply.text);
      if (legalReply.accepted && legalReply.allowConsultationOffer && shouldOfferConsultation({ dialogue, assessment, completedExchanges: prior.filter(answeredExchange).length, submitted: !!session.consultationRequestId })) {
        dialogue.offerShown = true; legalReply.text += "\n\n" + copy.offer;
      }
      return await finalize(legalReply.text, dialogue, [legalSourceMetadata(legalReply.sources), ...(legalReply.accepted ? [{ role: "system" as const, content: LEGAL_ANSWER_MARKER }] : [])]);
    }
    const canBook = () => bookingAllowed(dialogue) && !session.consultationRequestId;
    const requireBooking = () => { if (!canBook()) throw new ApiError(403, "PERMISSION_DENIED", "Booking consent is required."); };
    const messages: AIChatMessage[] = [
      { role: "system", content: assistantSystemPrompt(assessment.locale, bookingAllowed(dialogue) ? session.draft : { service: intakeDraftSchema.parse(session.draft).service }, { dialogue, assessment, knowledge: approvedKnowledge }) },
      { role: "system", content: `Current Cairo date and time: ${new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", dateStyle: "full", timeStyle: "short" }).format(new Date())}. Resolve tomorrow and weekdays from this date, never from training knowledge. Consultation hours and closed days require available_slots; office opening hours are a separate topic.` },
      ...history.flatMap(turn => [
        { role: "user" as const, content: turn.user },
        { role: "assistant" as const, content: turn.assistant }
      ]), { role: "user", content: input.message }
    ];
    const historyStart = 2;
    // Never discard the current request or authoritative system/office data to fit history.
    while (messages.length > historyStart + 1 && JSON.stringify(messages).length > MAX_CONVERSATION_CONTEXT_CHARS) messages.splice(historyStart, 2);
    let result: Awaited<ReturnType<typeof runConversationTurn>>;
    try { result = await runConversationTurn({ messages, requestId: input.requestId, assertActive, provider, signal,
      tools: {
        list_client_records: { description: "Read five owned client-visible records, newest first. Only this authenticated active client's account. Cursor loads the next page. Never infer ownership from contact details.", schema: z.strictObject({ category: assistantCategory, cursor: assistantCursor.optional() }), execute: async value => privateRead(async () => {
          const query = value as { category: Category; cursor?: RecordCursor };
          const result = await listClientAssistantRecords(input.actor!, query.category, assessment.locale, query.cursor);
          dialogue.followup = { category: query.category, choices: result.records.map(({ kind, id }) => ({ kind, id })), cursor: result.cursor };
          const c = clientAssistantCopy[assessment.locale];
          if (result.records.length === 1 && !result.hasMore) {
            const record = await getClientAssistantRecord(input.actor!, result.records[0], assessment.locale);
            dialogue.followup = { category: query.category, selected: { kind: record.kind, id: record.id } };
            groundedReply = renderClientRecord(record, assessment.locale, input.message);
          } else groundedReply = result.records.length ? result.records.map((r, i) => `${i + 1}. ${r.title} — ${r.reference} — ${formatDateTime(r.updatedAt, assessment.locale)} — ${r.status}`).join("\n") + `\n${c.choose}` + (result.hasMore ? `\n${c.more}` : "") : c.empty;
          if (query.category === "PAYMENT") groundedReply += `\n${await clientAssistantDueBalances(input.actor!, assessment.locale)}`;
          return result;
        }) },
        get_client_record: { description: "Read current details of one owned client-visible record. Rechecks ownership on every call. Only document names/status, never file contents or internal notes.", schema: assistantRecordRef, execute: async value => privateRead(async () => {
          const ref = assistantRecordRef.parse(value);
          const record = await getClientAssistantRecord(input.actor!, ref, assessment.locale);
          dialogue.followup = { category: ref.kind, selected: ref };
          groundedReply = renderClientRecord(record, assessment.locale, input.message);
          return record;
        }) },
        office_information: { description: "Read approved office and service information with source references. No other knowledge is authorized.", schema: z.strictObject({}), execute: async () => approvedKnowledge },
        available_slots: { description: "Read consultation working hours, closed-day reasons and live Cairo appointments. Return the nearest appointment only; request alternatives only if the customer asks. Availability is not a reservation.",
          schema: z.strictObject({ ...consultationSlotFilterSchema.shape, mode: z.literal("PHONE").optional(), alternatives: z.boolean().optional() }),
          execute: async value => {
            const query = value as { date?: string; fromTime?: string; toTime?: string; alternatives?: boolean };
            const currentBooking = await readDirectBooking(session.consultationRequestId);
            const availability = await listDirectBookingSlots(query.date, currentBooking?.appointments[0]?.id, { fromTime: query.fromTime, toTime: query.toTime });
            return bookingAvailabilityToolResult(availability, assessment.locale, query.alternatives ?? false);
          } },
        prepare_request: { description: "Save customer-provided facts only after explicit booking consent. Does not submit or confirm a booking.", schema: intakeDraftSchema,
          execute: async value => {
            requireBooking();
            preparedDraft = intakeDraftSchema.parse({ ...intakeDraftSchema.parse(preparedDraft ?? session.draft), ...intakeDraftSchema.parse(value) });
            return { draft: preparedDraft, submitted: false, nextAction: "CUSTOMER_REVIEW_REQUIRED" };
          } },
        submit_request: { description: "Present secure review; never submits by itself.", schema: z.strictObject({}),
          execute: async () => { requireBooking(); return { submitted: false, nextAction: "CUSTOMER_REVIEW_REQUIRED" }; } },
        activate_account: { description: "Show secure account interface only for requested booking or account help.", schema: z.strictObject({}),
          execute: async () => {
            if (!bookingAllowed(dialogue) && !dialogue.accountAccess) throw new ApiError(403, "PERMISSION_DENIED", "Account access must be requested.");
            return { nextAction: "SECURE_ACCOUNT_FORM", sent: false };
          } },
        own_request_status: { description: "Read current owned account requests and preserve the selected request. Guests can only read the booking bound to this protected conversation.", schema: z.strictObject({}),
          execute: async () => {
            if (input.actor?.clientId) {
              return privateRead(async () => {
                const followup = await resolveClientFollowup({ actor: input.actor!, message: input.message, locale: assessment.locale, category: "REQUESTS", focus: dialogue.followup });
                dialogue.followup = followup.focus; groundedReply = followup.text;
                return followup.record ?? { summary: followup.text };
              });
            }
            const fresh = await ownAssistantSession(input.token, input.actor);
            if (!fresh.consultationRequestId) return { submitted: false };
            return await readDirectBooking(fresh.consultationRequestId) ?? { nextAction: "LOGIN_REQUIRED" };
          } },
        handoff_to_office: { description: "Explain how to review and send a message to the office. This tool never sends or forwards any message.", schema: z.strictObject({}),
          execute: async () => ({ queued: false, nextAction: "CUSTOMER_REVIEW_REQUIRED", instruction: assistantActionCopy[assessment.locale].officeReview }) }
      }
    });
    } catch (error) {
      if (error instanceof ApiError && ["AI_OUTPUT_INVALID", "PERMISSION_DENIED", "AI_PROVIDER_UNAVAILABLE", "AI_PROVIDER_TIMEOUT"].includes(error.code) && groundedReply) return await finalize(groundedReply, dialogue);
      if (error instanceof ApiError && ["AI_OUTPUT_INVALID", "PERMISSION_DENIED"].includes(error.code)) { safeLog("warn", "assistant.policy_rejected", { requestId: input.requestId, reason: error.code }); return await finalize(policyFallback, dialogue); }
      throw error;
    }
    // Personal status/amount/date facts are rendered from current server projections, even if a model invents a different answer.
    if (groundedReply) return await finalize(groundedReply, dialogue);
    const review = await policyDecision(provider, replyReviewSchema, "review_company_reply", OUTPUT_POLICY,
      { message: input.message, history: history.slice(-2).map(turn => ({ user: turn.user.slice(-1000), assistant: turn.assistant?.slice(-1000) ?? null })), assessment, dialogue, knowledge: approvedKnowledge, actualToolResults: result.additions.filter(m => m.role === "tool"), reply: result.text }, input.requestId).catch(error => {
        if (error instanceof ApiError && error.code === "AI_OUTPUT_INVALID") return { inScope: false };
        throw error;
      });
    if (!Object.values(review).every(Boolean) || !noOutsideReferral(result.text, [approvedKnowledge.office.whatsapp])) { safeLog("warn", "assistant.policy_rejected", { requestId: input.requestId, reason: "REPLY_REVIEW", checks: review }); return await finalize(policyFallback, dialogue); }
    let reply = assessment.scope === "MIXED" ? copy.mixed + "\n\n" + result.text : result.text;
    // Rejected answers and boilerplate replies must not advance invitation timing.
    const answeredExchanges = prior.filter(answeredExchange).length;
    if (shouldOfferConsultation({ dialogue, assessment, completedExchanges: answeredExchanges, submitted: !!session.consultationRequestId })) {
      dialogue.offerShown = true;
      reply += "\n\n" + copy.offer;
    }
    return await finalize(reply, dialogue, result.additions, preparedDraft);

  } catch (error) {
    safeLog("warn", "assistant.turn_failed", { ...diagnostics.metadata(), code: error instanceof ApiError ? error.code : "AI_PROVIDER_UNAVAILABLE" });
    const current = await prisma.assistantTurn.findUnique({ where: identity });
    if (current?.status === "HUMAN") return readAssistantSession(input.token, input.actor);
    await prisma.$transaction(async tx => {
      // This conditional update locks the parent row even when retaining its value.
      const owned = await tx.assistantSession.updateMany({ where: { id: session.id, leaseId }, data: { leaseId } });
      if (owned.count) await tx.assistantTurn.updateMany({ where: { sessionId: session.id, messageId: input.messageId, status: "PENDING" }, data: { status: "FAILED", errorCode: error instanceof ApiError ? error.code : "AI_PROVIDER_UNAVAILABLE" } });
    });
    throw error;
  } finally {
    await prisma.assistantSession.updateMany({ where: { id: session.id, leaseId }, data: { leaseId: null, leaseExpiresAt: null } });
  }
}

export async function changeAssistantDialogue(token: string, action: "begin_booking" | "return_inquiry" | "account_access", actor?: Principal | null, selectedService?: string) {
  const session = await ownAssistantSession(token, actor);
  if (session.consultationRequestId && action === "begin_booking") throw new ApiError(409, "CONFLICT", "This conversation cannot change mode.");
  const state = readDialogue(session.dialogue);
  if (action === "begin_booking") { state.mode = "BOOKING"; state.consentAt = new Date().toISOString(); state.activeDomain = "OFFICE"; delete state.followup; }
  if (action === "return_inquiry") { state.mode = "INQUIRY"; state.consentAt = null; state.offerShown = true; state.accountAccess = false; }
  if (action === "account_access") state.accountAccess = true;
  const changed = await prisma.assistantSession.updateMany({ where: { id: session.id, revision: session.revision, leaseId: null }, data: { ...(action === "begin_booking" && selectedService ? { draft: intakeDraftSchema.parse({ ...intakeDraftSchema.parse(session.draft), service: selectedService }) } : {}), dialogue: state as Prisma.InputJsonValue, revision: { increment: 1 } } });
  if (!changed.count) throw new ApiError(409, "CONFLICT", "Conversation state changed.");
  return readAssistantSession(token, actor);
}
