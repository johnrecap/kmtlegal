import type { Prisma } from "@prisma/client";
import { conversationCopy } from "@/content/conversation-copy";
import { createHash } from "node:crypto";

function transcriptId(turnId: string, side: string) {
  const hex = createHash("sha256").update(`kmt-transcript:${turnId}:${side}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function syncAssistantTranscript(tx: Prisma.TransactionClient, sessionId: string, threadId: string) {
  const turns = await tx.assistantTurn.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" }, take: 100 });
  await tx.conversationMessage.createMany({ skipDuplicates: true, data: turns.flatMap(turn => [
    { id: transcriptId(turn.id, "user"), threadId, senderType: "CLIENT" as const, body: turn.userText, createdAt: turn.createdAt },
    ...(turn.assistantText ? [{ id: transcriptId(turn.id, "assistant"), threadId, senderType: "SYSTEM" as const, body: turn.assistantText, createdAt: turn.updatedAt }] : [])
  ]) });
}

/** Called under the assistant-session row lock, preserving the existing staff inbox and reply APIs. */
export async function ensureAssistantHandoff(tx: Prisma.TransactionClient, sessionId: string) {
  const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.conversationThreadId) { await syncAssistantTranscript(tx, sessionId, session.conversationThreadId); return session.conversationThreadId; }
  const copy = conversationCopy[session.locale === "en" ? "en" : "ar"];
  const thread = await tx.conversationThread.create({ data: {
    clientId: session.clientId, subject: copy.title, status: "WAITING_STAFF"
  } });
  await tx.assistantSession.update({ where: { id: sessionId }, data: { conversationThreadId: thread.id } });
  await syncAssistantTranscript(tx, sessionId, thread.id);
  return thread.id;
}

export async function bindAssistantThreadIdentity(tx: Prisma.TransactionClient, sessionId: string, clientId: string) {
  const session = await tx.assistantSession.findUniqueOrThrow({ where: { id: sessionId } });
  if (session.consultationRequestId) {
    const request = await tx.consultationRequest.findUniqueOrThrow({ where: { id: session.consultationRequestId }, include: { client: true } });
    // Only this capability's new isolated lead can be attached. Never claim historical clients by contact details.
    if (request.clientId !== clientId && request.confirmationSource !== "STAFF_APPROVAL" && request.client?.source === "assistant_guest_booking" && !request.client.userId) {
      await tx.consultationRequest.update({ where: { id: request.id }, data: { clientId } });
      await tx.appointment.updateMany({ where: { consultationRequestId: request.id, clientId: request.clientId! }, data: { clientId } });
    }
  }
  if (session.conversationThreadId) {
    await tx.conversationThread.update({ where: { id: session.conversationThreadId }, data: { clientId } });
  }
}
