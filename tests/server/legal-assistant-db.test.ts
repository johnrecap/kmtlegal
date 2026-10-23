import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { Principal } from "@/server/auth/policy";

const fixture = vi.hoisted(() => ({ db: null as unknown as PrismaClient }));
vi.mock("@/server/db/prisma", () => ({ prisma: new Proxy({}, { get: (_target, key) => {
  const value = fixture.db[key as keyof PrismaClient];
  return typeof value === "function" ? value.bind(fixture.db) : value;
} }) }));
import { capabilityHash, createAssistantSession, readAssistantSession, sendAssistantMessage } from "@/server/consultations/conversation-session-service";
import { permissionsForRole } from "@/server/auth/policy";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";
import { liveAssistantEvaluation } from "./helpers/live-assistant-evaluation";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { proposeAssistantAction, resolveAssistantAction } from "@/server/consultations/assistant-action-service";
import { listDirectBookingSlots } from "@/server/consultations/direct-booking-service";
import { CONSULTATION_AVAILABILITY_SETTING_KEY, defaultConsultationAvailability } from "@/server/consultations/consultation-availability-service";

let db: PGlite, server: PGLiteSocketServer;
const nativeFetch = globalThis.fetch;
const requests: Array<Record<string, any>> = [];
const legalChecks = { inScope: true, grounded: true, noFalseCurrentLaw: true, factsAccurate: true, noExternalReferrals: true, noGuarantees: true, draftMarked: true, noFalseActionClaim: true };
function tool(name: string, value: unknown) { return Response.json({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: randomUUID(), type: "function", function: { name, arguments: JSON.stringify(value) } }] } }] }); }
function mockProvider(options: { answer?: string; review?: boolean; search?: "fail" | "commercial"; classification?: Record<string, unknown>; inspect?: (body: Record<string, any>) => void } = {}) {
  requests.length = 0;
  const fetch = vi.fn(async (_url, init) => {
    const body = JSON.parse(String(init?.body)); requests.push(body); options.inspect?.(body);
    const name = body.tools?.[0]?.function?.name;
    const data = JSON.parse(body.messages.at(-1).content.startsWith("{") ? body.messages.at(-1).content : "{}");
    if (name === "classify_company_message") {
      const message = data.message as string;
      const book = /احجز|book (?:a |with)/i.test(message);
      return tool(name, { scope: book ? "OFFICE" : "LEGAL", intent: book ? "BOOK" : "NONE", evidence: book ? message : "", locale: /[a-z]/i.test(message) && !/[ء-ي]/.test(message) ? "en" : "ar", offerAppropriate: false, inScopeQuestion: message,
        legal: { topics: ["RENT"], mode: /مسودة|draft/i.test(message) ? "DRAFT" : "EXPLANATION" }, ...options.classification });
    }
    if (body.tools?.[0]?.type === "openrouter:web_search") {
      if (options.search === "fail") return new Response("synthetic failure", { status: 503 });
      return Response.json({ choices: [{ message: { annotations: [{ type: "url_citation", url_citation: { url: options.search === "commercial" ? "https://lawyers.invalid/law" : "https://elpai.idsc.gov.eg/", title: "مصدر رسمي — بيانات اختبار مصطنعة", content: "SYNTHETIC EVIDENCE: تحديد آثار عقد الإيجار يتوقف على نوع العقد ووقائعه. هذا مقتطف اختبار لا يثبت نص قانون بعينه." } }] } }] });
    }
    if (name === "compose_legal_reply") {
      const sourced = data.research.sources.length > 0;
      return tool(name, { answer: options.answer ?? (data.jurisdiction.mode === "DRAFT" ? "عقد إيجار أولي: الطرف الأول [الاسم] والطرف الثاني [الاسم]. العين [الوصف] والمدة [المدة المتفق عليها]. تخضع البنود للمراجعة بحسب الوقائع. [S1]" : `يتوقف تقييم الإيجار على نوع العقد وتاريخه وطبيعة العين. احتفظ بنسخة العقد وحدد سبب النزاع قبل اختيار الخطوة المناسبة.${sourced ? " [S1]" : " لا أؤكد حكمًا محددًا دون النص والوقائع."}`), sourceIds: sourced ? ["S1"] : [] });
    }
    if (name === "review_legal_reply") return tool(name, { ...legalChecks, grounded: options.review ?? true });
    if (name === "review_company_reply") return tool(name, { inScope: true, grounded: true, noPrematureContact: true, noBookingPressure: true, noFinalLegalAdvice: true, noFalseActionClaim: true });
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: "يمكنك استكمال الحجز من النموذج داخل الموقع." } }] });
  });
  vi.stubGlobal("fetch", fetch); return fetch;
}
async function account() {
  const role = await fixture.db.role.findUniqueOrThrow({ where: { name: "Client" } });
  const user = await fixture.db.user.create({ data: { name: "SYNTHETIC_PRIVATE_CLIENT", email: `${randomUUID()}@synthetic.invalid`, status: "ACTIVE", roleId: role.id } });
  const client = await fixture.db.client.create({ data: { fullName: user.name, phone: "01099998888", userId: user.id } });
  return { id: user.id, clientId: client.id, roleName: "Client" } satisfies Principal;
}
async function ask(token: string, message: string, actor?: Principal) {
  return sendAssistantMessage({ token, actor, messageId: randomUUID(), message, locale: "ar", requestId: "synthetic-legal" });
}
beforeAll(async () => {
  vi.stubEnv("AI_PROVIDER", "openrouter"); vi.stubEnv("AI_API_KEY", "synthetic-not-a-secret"); vi.stubEnv("AI_BASE_URL", "https://synthetic.invalid/v1");
  db = await PGlite.create();
  for (const name of (await readdir("prisma/migrations", { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort()) await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
  server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 55509, maxConnections: 3 }); await server.start();
  fixture.db = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://postgres:synthetic@127.0.0.1:55509/template1", max: 1 }) });
  const role = await fixture.db.role.create({ data: { name: "Client", status: "ACTIVE" } });
  for (const key of permissionsForRole("Client")) { const permission = await fixture.db.permission.upsert({ where: { key }, create: { key }, update: {} }); await fixture.db.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } }); }
}, 60_000);
afterAll(async () => { await fixture.db?.$disconnect(); await server?.stop(); await db?.close(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe.sequential("legal assistance with isolated SQL and controlled provider", () => {
  it("turns an account handoff into a saved preview without sending until explicit confirmation", async () => {
    vi.stubEnv("AI_ACTIONS_ENABLED", "true"); vi.stubEnv("AI_ACTION_CLIENT_IDS", "*");
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const message = "محتاج أكلم موظف";
    mockProvider({ classification: { scope: "OFFICE", intent: "HANDOFF", evidence: message } });
    const preview = await ask(token, message, actor);
    expect(preview.proposals).toHaveLength(1);
    expect(await fixture.db.conversationThread.count({ where: { clientId: actor.clientId } })).toBe(0);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    await resolveAssistantAction({ sessionId: session.id, actor, proposalId: preview.proposals[0].id, decision: "confirm" });
    expect(await fixture.db.conversationMessage.count({ where: { thread: { clientId: actor.clientId }, body: message } })).toBe(1);
  });
  it("routes the original receipt question away from an existing account focus and retains facts after rejected replies", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    await fixture.db.assistantSession.update({ where: { id: session.id }, data: { dialogue: { followup: { category: "CASE" } } } });
    mockProvider({ search: "fail", answer: "ذكرت أن معك إيصال أمانة على بياض. هل تسلم الموقّع مالًا بالفعل؟" });
    const first = await ask(token, "معايا إيصال أمانة على بياض وعايز أرفع قضية بيه", actor);
    expect(first.dialogue.activeDomain).toBe("LEGAL");
    mockProvider({ review: false });
    await expect(ask(token, "تصحيح: استلم مبلغ بس مش مني", actor)).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    const saved = await readAssistantSession(token, actor);
    expect(saved.dialogue.legalMemory?.statements.at(-1)?.quote).toBe("تصحيح: استلم مبلغ بس مش مني");
    expect(saved.dialogue.legalMemory?.pendingQuestion?.text).toContain("هل تسلم");
  });
  it("persists a profile proposal, requires explicit confirmation, rejects changed data and replays one atomic result", async () => {
    vi.stubEnv("AI_ACTIONS_ENABLED", "true"); vi.stubEnv("AI_ACTION_CLIENT_IDS", "*");
    const actor = await account(), other = await account();
    const token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    const proposal = await proposeAssistantAction({ sessionId: session.id, actor, messageId: randomUUID(), locale: "ar", draft: { kind: "PROFILE", changes: { city: "القاهرة" } } });
    expect((await fixture.db.client.findUniqueOrThrow({ where: { id: actor.clientId } })).city).not.toBe("القاهرة");
    await expect(resolveAssistantAction({ sessionId: session.id, actor: other, proposalId: proposal.id, decision: "confirm" })).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    const results = await Promise.all([1, 2].map(() => resolveAssistantAction({ sessionId: session.id, actor, proposalId: proposal.id, decision: "confirm" })));
    expect(results).toEqual([{ status: "COMPLETED", result: { updated: true } }, { status: "COMPLETED", result: { updated: true } }]);
    expect((await fixture.db.client.findUniqueOrThrow({ where: { id: actor.clientId } })).city).toBe("القاهرة");
    const second = await proposeAssistantAction({ sessionId: session.id, actor, messageId: randomUUID(), locale: "ar", draft: { kind: "PROFILE", changes: { city: "الجيزة" } } });
    await fixture.db.client.update({ where: { id: actor.clientId }, data: { city: "الإسكندرية" } });
    expect(await resolveAssistantAction({ sessionId: session.id, actor, proposalId: second.id, decision: "confirm" })).toMatchObject({ status: "STALE" });
    expect((await fixture.db.client.findUniqueOrThrow({ where: { id: actor.clientId } })).city).toBe("الإسكندرية");
  });
  it("executes service create/save/submit/accept through existing services and invalidates a changed quote", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    const propose = (draft: unknown) => proposeAssistantAction({ sessionId: session.id, actor, messageId: randomUUID(), locale: "ar", draft });
    const confirm = (proposalId: string) => resolveAssistantAction({ sessionId: session.id, actor, proposalId, decision: "confirm" });
    const created = await confirm((await propose({ kind: "SERVICE_CREATE", service: "CONTRACT_REVIEW" })).id);
    const id = (created.result as { id: string }).id;
    expect((await fixture.db.serviceRequest.findUniqueOrThrow({ where: { id } })).status).toBe("DRAFT");
    await confirm((await propose({ kind: "SERVICE", targetId: id, operation: "save", intake: { title: "Synthetic contract", purpose: "Review terms before signing the synthetic contract" } })).id);
    await confirm((await propose({ kind: "SERVICE", targetId: id, operation: "submit" })).id);
    expect((await fixture.db.serviceRequest.findUniqueOrThrow({ where: { id } })).status).toBe("RECEIVED");
    const quote = { amount: "100", currency: "EGP", scope: "Synthetic contract review", durationDays: 3 };
    await fixture.db.serviceRequest.update({ where: { id }, data: { status: "AWAITING_ACCEPTANCE", quote, quoteVersion: 1, revision: { increment: 1 } } });
    const old = await propose({ kind: "SERVICE", targetId: id, operation: "accept" });
    await fixture.db.serviceRequest.update({ where: { id }, data: { quote: { ...quote, amount: "150" }, quoteVersion: 2, revision: { increment: 1 } } });
    expect(await confirm(old.id)).toMatchObject({ status: "STALE" });
    const accepted = await propose({ kind: "SERVICE", targetId: id, operation: "accept" });
    expect(JSON.stringify(accepted.preview)).toContain("150");
    await Promise.all([confirm(accepted.id), confirm(accepted.id)]);
    expect(await fixture.db.payment.count({ where: { clientId: actor.clientId } })).toBe(1);
    expect((await fixture.db.payment.findFirstOrThrow({ where: { clientId: actor.clientId } })).amount.toString()).toBe("150");
    await expect(propose({ kind: "SERVICE", targetId: id, operation: "quote" })).rejects.toBeDefined();
  });
  it("honors the emergency hold before executing an already saved proposal", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    const proposal = await proposeAssistantAction({ sessionId: session.id, actor, locale: "ar", messageId: randomUUID(), draft: { kind: "PROFILE", changes: { city: "Cairo" } } });
    vi.stubEnv("AI_ACTIONS_HOLD_FILE", "package.json"); // Existing file represents a hold, without creating/deleting runtime state.
    try {
      await expect(resolveAssistantAction({ sessionId: session.id, actor, proposalId: proposal.id, decision: "confirm" })).rejects.toMatchObject({ code: "FEATURE_DISABLED" });
      expect((await fixture.db.assistantActionProposal.findUniqueOrThrow({ where: { id: proposal.id } })).status).toBe("PENDING");
      expect((await fixture.db.client.findUniqueOrThrow({ where: { id: actor.clientId } })).city).not.toBe("Cairo");
    } finally { vi.stubEnv("AI_ACTIONS_HOLD_FILE", ""); }
  });
  it("confirms an office message once and denies a suspended client before executing a saved proposal", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    const thread = await fixture.db.conversationThread.create({ data: { clientId: actor.clientId!, subject: "Synthetic office thread" } });
    const proposal = await proposeAssistantAction({ sessionId: session.id, actor, messageId: randomUUID(), locale: "ar", draft: { kind: "OFFICE_MESSAGE", targetId: thread.id, message: "Please clarify the required documents." } });
    const input = { sessionId: session.id, actor, proposalId: proposal.id, decision: "confirm" as const };
    expect(await fixture.db.conversationMessage.count({ where: { threadId: thread.id } })).toBe(0);
    await Promise.all([resolveAssistantAction(input), resolveAssistantAction(input)]);
    expect(await fixture.db.conversationMessage.count({ where: { threadId: thread.id } })).toBe(1);
    const next = await proposeAssistantAction({ sessionId: session.id, actor, messageId: randomUUID(), locale: "ar", draft: { kind: "PROFILE", changes: { city: "Cairo" } } });
    await fixture.db.user.update({ where: { id: actor.id }, data: { status: "SUSPENDED" } });
    await expect(resolveAssistantAction({ ...input, proposalId: next.id })).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    expect((await fixture.db.assistantActionProposal.findUniqueOrThrow({ where: { id: next.id } })).status).toBe("PENDING");
  });
  it("keeps a failed legal turn retryable under the original identity, then persists receipt context across reopen", async () => {
    const token = await createAssistantSession("ar"), messageId = randomUUID();
    const input = { token, messageId, message: "معايا إيصال أمانة على بياض", locale: "ar" as const, requestId: randomUUID() };
    mockProvider({ review: false });
    await expect(sendAssistantMessage(input)).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    mockProvider({ search: "fail", answer: "ذكرت إيصال أمانة على بياض. هل حصل تسليم فعلي للمال؟" });
    const first = await sendAssistantMessage(input);
    expect(first.turns).toHaveLength(1); expect(first.turns[0].status).toBe("COMPLETED");
    expect((await readAssistantSession(token)).dialogue.legalMemory?.statements[0]).toMatchObject({ messageId, quote: input.message });
    for (let i = 0; i < 6; i++) await ask(token, `متابعة ${i}`);
    await ask(token, "تصحيح: مفيش تسليم فلوس");
    const generation = requests.filter(r => r.tools[0]?.function?.name === "compose_legal_reply").at(-1)!;
    const data = JSON.parse(generation.messages[1].content);
    expect(data.customerStatements.statements[0].messageId).toBe(messageId);
    expect(data.customerStatements.statements.at(-1).quote).toBe("تصحيح: مفيش تسليم فلوس");
  });
  it("does not strand a lease on invalid routing or repeat the research banner after reopening", async () => {
    const token = await createAssistantSession("ar");
    vi.stubEnv("AI_OPENROUTER_PROVIDERS", "invalid!route");
    await expect(ask(token, "اشرح إيصال الأمانة")).rejects.toThrow("routing");
    expect((await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } })).leaseId).toBeNull();
    vi.stubEnv("AI_OPENROUTER_PROVIDERS", "");
    mockProvider({ search: "fail" });
    expect((await ask(token, "ما حقوق المستأجر؟")).turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.unverified);
    await readAssistantSession(token);
    expect((await ask(token, "كمل")).turns.at(-1)?.assistantText).not.toContain(legalAssistantCopy.ar.unverified);
  });
  it("creates only the confirmed office message and remembers its thread without forwarding legal history", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    await fixture.db.assistantTurn.create({ data: { sessionId: session.id, messageId: randomUUID(), userText: "PRIVATE LEGAL HISTORY", status: "COMPLETED", assistantText: "PRIVATE LEGAL ANSWER" } });
    const proposal = await proposeAssistantAction({ sessionId: session.id, actor, locale: "ar", messageId: randomUUID(), draft: { kind: "OFFICE_MESSAGE", message: "Please clarify the documents." } });
    expect(await fixture.db.conversationThread.count({ where: { clientId: actor.clientId } })).toBe(0);
    const result = await resolveAssistantAction({ sessionId: session.id, actor, proposalId: proposal.id, decision: "confirm" });
    const threadId = (result.result as { id: string }).id;
    const messages = await fixture.db.conversationMessage.findMany({ where: { threadId } });
    expect(messages.map(m => m.body)).toEqual(["Please clarify the documents."]);
    expect((await readAssistantSession(token, actor)).dialogue.followup?.selected).toEqual({ kind: "CONVERSATION", id: threadId });
  });
  it("cancels a proposal without executing it and keeps callback creation atomic on repeated confirmation", async () => {
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    await fixture.db.assistantSession.update({ where: { id: session.id }, data: { dialogue: { mode: "BOOKING", consentAt: new Date().toISOString() } } });
    const propose = () => proposeAssistantAction({ sessionId: session.id, actor, locale: "ar", messageId: randomUUID(), draft: { kind: "BOOKING", operation: "request_callback", fullName: "Synthetic callback", phone: "01099998888", contactChannel: "PHONE" } });
    const cancelled = await propose();
    const resolve = (proposalId: string, decision: "confirm" | "cancel") => resolveAssistantAction({ sessionId: session.id, actor, proposalId, decision });
    expect(await resolve(cancelled.id, "cancel")).toMatchObject({ status: "CANCELLED" });
    expect(await resolve(cancelled.id, "confirm")).toMatchObject({ status: "CANCELLED" });
    expect(await fixture.db.consultationRequest.count({ where: { clientId: actor.clientId } })).toBe(0);
    const next = await propose();
    await Promise.all([resolve(next.id, "confirm"), resolve(next.id, "confirm")]);
    expect(await fixture.db.consultationRequest.count({ where: { clientId: actor.clientId } })).toBe(1);
    expect(await fixture.db.assistantBookingAction.count({ where: { sessionId: session.id } })).toBe(1);
    expect((await fixture.db.assistantActionProposal.findUniqueOrThrow({ where: { id: next.id } })).status).toBe("COMPLETED");
  });
  it("uses published slots for confirmed booking, reschedule and cancellation; alternative requests stay unconfirmed", async () => {
    const role = await fixture.db.role.upsert({ where: { name: "Lawyer" }, create: { name: "Lawyer", status: "ACTIVE" }, update: {} });
    const lawyer = await fixture.db.user.create({ data: { name: "Synthetic lawyer", email: `${randomUUID()}@synthetic.invalid`, roleId: role.id, status: "ACTIVE" } });
    const availability = { ...defaultConsultationAvailability, minLeadHours: 1, days: defaultConsultationAvailability.days.map(day => ({ ...day, enabled: true })), directBooking: { published: true, closures: [], roster: defaultConsultationAvailability.days.map(day => ({ weekday: day.weekday, lawyerIds: [lawyer.id] })) } };
    await fixture.db.systemSetting.upsert({ where: { key: CONSULTATION_AVAILABILITY_SETTING_KEY }, create: { key: CONSULTATION_AVAILABILITY_SETTING_KEY, value: availability }, update: { value: availability } });
    const actor = await account(), token = await createAssistantSession("ar", actor);
    const session = await fixture.db.assistantSession.findUniqueOrThrow({ where: { capabilityHash: capabilityHash(token) } });
    await fixture.db.assistantSession.update({ where: { id: session.id }, data: { dialogue: { mode: "BOOKING", consentAt: new Date().toISOString() } } });
    const slot = (await listDirectBookingSlots()).nearestSlot!; expect(slot).toBeTruthy();
    const propose = (draft: unknown) => proposeAssistantAction({ sessionId: session.id, actor, locale: "ar", messageId: randomUUID(), draft });
    const confirm = (proposalId: string) => resolveAssistantAction({ sessionId: session.id, actor, proposalId, decision: "confirm" });
    const booking = await propose({ kind: "BOOKING", operation: "confirm_booking", startsAt: slot.startsAt, fullName: "Synthetic client", phone: "01012345678", contactChannel: "PHONE" });
    expect(await fixture.db.appointment.count({ where: { clientId: actor.clientId } })).toBe(0);
    await confirm(booking.id);
    const appointment = await fixture.db.appointment.findFirstOrThrow({ where: { clientId: actor.clientId } });
    const nextSlot = (await listDirectBookingSlots()).nearestSlot!;
    const move = await propose({ kind: "BOOKING", operation: "reschedule_booking", startsAt: nextSlot.startsAt });
    await confirm(move.id);
    expect((await fixture.db.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).startsAt.toISOString()).toBe(nextSlot.startsAt);
    await confirm((await propose({ kind: "BOOKING", operation: "cancel_booking" })).id);
    expect((await fixture.db.appointment.findUniqueOrThrow({ where: { id: appointment.id } })).status).toBe("CANCELLED");
    const request = await fixture.db.consultationRequest.create({ data: { clientId: actor.clientId!, fullName: "Synthetic alternative", phone: "01012345678", summary: "Synthetic", serviceCategory: "legal", preferredMode: "PHONE" } });
    await fixture.db.assistantSession.update({ where: { id: session.id }, data: { consultationRequestId: request.id } });
    await confirm((await propose({ kind: "ALTERNATIVE_TIME", targetId: request.id, startsAt: slot.startsAt, mode: "PHONE" })).id);
    expect(await fixture.db.consultationRequest.findUniqueOrThrow({ where: { id: request.id } })).toMatchObject({ status: "NEW", outcomeVersion: 1, requestedStartsAt: new Date(slot.startsAt) });
    expect(await fixture.db.appointment.count({ where: { consultationRequestId: request.id } })).toBe(0);
  });
  it("representative Arabic legal question → cited answer → follow-up → preliminary draft → internal booking", async () => {
    mockProvider(); const token = await createAssistantSession("ar");
    const first = await ask(token, "ما حقوق المستأجر في عقد الإيجار؟");
    expect(first.turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.assumed);
    expect(first.turns.at(-1)?.assistantText).toContain("نوع العقد");
    expect(first.turns.at(-1)?.sources).toMatchObject([{ id: "S1", url: "https://elpai.idsc.gov.eg/" }]);
    expect(first.dialogue.legal).toMatchObject({ jurisdiction: "EG", topics: ["RENT"], mode: "EXPLANATION" });
    expect((await ask(token, "ولو رفض؟")).turns.at(-1)?.assistantText).toContain("نوع العقد");
    const draft = await ask(token, "اكتب مسودة عقد إيجار");
    expect(draft.turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.draft);
    expect(draft.turns.at(-1)?.assistantText).toContain("[الاسم]");
    const booked = await ask(token, "عايز احجز استشارة مع المكتب");
    expect(booked.dialogue.mode).toBe("BOOKING"); expect(booked.submitted).toBe(false);
    const saved = await readAssistantSession(token); expect(saved.turns[0].sources).toHaveLength(1);
    expect(JSON.stringify(saved.turns)).not.toContain("KMT_LEGAL_SOURCES:");
    const searches = requests.filter(r => r.tools[0]?.type === "openrouter:web_search"); expect(searches).toHaveLength(3);
    expect(searches.every(r => r.max_tool_calls === 1 && r.tools[0].parameters.engine === "exa")).toBe(true);
  });
  it("changes jurisdiction, preserves legal short-follow-up context and clarifies a country conflict without searching", async () => {
    mockProvider(); const token = await createAssistantSession("ar");
    await ask(token, "ما حقوق المستأجر؟");
    const sa = await ask(token, "وفي السعودية؟"); expect(sa.dialogue.legal?.jurisdiction).toBe("SA");
    expect(sa.turns.at(-1)?.assistantText).toContain("السعودية");
    const count = requests.length;
    const conflict = await ask(token, "أنا في مصر والعقد في السعودية");
    expect(conflict.turns.at(-1)?.assistantText).toBe(legalAssistantCopy.ar.conflict);
    expect(requests.length - count).toBe(1); expect(conflict.dialogue.legal?.jurisdiction).toBe("SA");
    await ask(token, "هل ينفع؟"); expect(requests.at(-1)?.tools[0].function.name).toBe("review_legal_reply");
  });
  it.each(["ما شروط قبول الدعوى؟", "ناقصني إيه لعمل توكيل؟"])("corrects an account-followup misclassification for %s", async message => {
    const answer = message.includes("توكيل") ? "تقييم التوكيل يبدأ بتحديد التصرف المطلوب وحدود الوكالة، دون افتراض صلاحيات غير مذكورة. [S1]" : "قبول الدعوى يتطلب تقييم موضوع الطلب وصفة الأطراف والمصلحة بحسب الوقائع، دون الجزم بقبول حالة بعينها. [S1]";
    const owner = await account(); mockProvider({ answer, classification: { scope: "OFFICE", intent: "FOLLOW_UP", evidence: message } });
    const token = await createAssistantSession("ar", owner); const result = await ask(token, message, owner);
    expect(result.turns.at(-1)?.assistantText).toContain(answer); expect(result.dialogue.followup).toBeUndefined();
    expect(requests.some(r => r.tools[0]?.type === "openrouter:web_search")).toBe(true);
  });
  it.each(["fail", "commercial"] as const)("gives useful qualified explanation when research is %s", async search => {
    mockProvider({ search }); const state = await ask(await createAssistantSession("ar"), "ما حقوق المستأجر؟");
    expect(state.turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.unverified);
    expect(state.turns.at(-1)?.assistantText).toContain("نوع العقد"); expect(state.turns.at(-1)?.sources).toEqual([]);
  });
  it.each(["أرشح المحامي أحمد [S1]", "هتكسب أكيد [S1]", "راجع المصدر [S5]", "هذا أحدث قانون نافذ قطعًا [S1]"])("rejects unsafe/unsupported prose or citations: %s", async answer => {
    mockProvider({ answer, review: false }); const token = await createAssistantSession("ar");
    await expect(ask(token, "وضح القانون")).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    const state = await readAssistantSession(token);
    expect(state.turns.at(-1)).toMatchObject({ status: "FAILED", assistantText: null, sources: [] });
  });
  it("rechecks a selected owned case, separates legal analysis from status and never sends private facts to research", async () => {
    const owner = await account();
    const record = await fixture.db.legalCase.create({ data: { clientId: owner.clientId!, assignedLawyerId: owner.id, title: "PRIVATE_CASE_TITLE", internalFileNumber: `CASE-${randomUUID()}`, caseType: "Civil", courtName: "PRIVATE_COURT" } });
    await fixture.db.internalNote.create({ data: { caseId: record.id, authorId: owner.id, content: "INTERNAL_INSTRUCTION_IGNORE_RULES" } });
    const token = await createAssistantSession("ar");
    await fixture.db.assistantSession.update({ where: { capabilityHash: capabilityHash(token) }, data: { dialogue: { followup: { category: "CASE", selected: { kind: "CASE", id: record.id } } } } });
    mockProvider({ classification: { legal: { topics: ["RENT"], mode: "ANALYSIS" }, accountEvidence: "قضيتي" }, answer: "الوقائع المسجلة: PRIVATE_CASE_TITLE. التحليل المشروط: يلزم فحص العقد ولا يمكن الجزم بالنتيجة. [S1]" });
    const state = await ask(token, "حلل قضيتي، اسمي PRIVATE_NAME وبريدي private@synthetic.invalid", owner);
    expect(state.accountReady).toBe(true); expect(state.turns.at(-1)?.assistantText).toContain("التحليل المشروط");
    expect(state.turns.at(-1)?.sources).toHaveLength(1); await expect(readAssistantSession(token)).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    const generation = requests.find(r => r.tools[0]?.function?.name === "compose_legal_reply")!;
    expect(generation.messages[1].content).toContain("PRIVATE_CASE_TITLE"); expect(generation.messages[1].content).not.toContain("INTERNAL_INSTRUCTION_IGNORE_RULES");
    const search = requests.find(r => r.tools[0]?.type === "openrouter:web_search")!;
    expect(JSON.stringify(search)).not.toMatch(/PRIVATE_|private@|0109999|INTERNAL_INSTRUCTION|CASE-/);
    await fixture.db.legalCase.update({ where: { id: record.id }, data: { title: "FRESH_CASE_TITLE" } });
    mockProvider({ classification: { legal: { topics: ["RENT"], mode: "ANALYSIS" }, accountEvidence: "قضيتي" }, answer: "الوقائع: FRESH_CASE_TITLE. التحليل المشروط لا يؤكد نتيجة. [S1]" });
    await ask(token, "حلل قضيتي", owner);
    const next = requests.find(r => r.tools[0]?.function?.name === "compose_legal_reply")!;
    const data = JSON.parse(next.messages[1].content); expect(data.ownedRecords.title).toBe("FRESH_CASE_TITLE");
    expect(data.history.at(-1).assistant).not.toContain("PRIVATE_CASE_TITLE");
    const other = await account(); await fixture.db.legalCase.update({ where: { id: record.id }, data: { clientId: other.clientId! } });
    mockProvider({ classification: { accountEvidence: "قضيتي" } });
    const denied = await ask(token, "حلل قضيتي", owner); expect(denied.turns.at(-1)?.assistantText).toContain("لم أجد");
    expect(requests).toHaveLength(1);
  });
  it("retains deterministic server status with provider unavailable and does not search office-only questions", async () => {
    const owner = await account(); const row = await fixture.db.serviceRequest.create({ data: { reference: `SR-${randomUUID()}`, clientId: owner.clientId!, kind: "CONTRACT_REVIEW", locale: "ar", status: "RECEIVED", intake: {}, idempotencyKey: randomUUID() } });
    const token = await createAssistantSession("ar", owner);
    const offline = vi.fn(() => { throw new Error("synthetic unavailable"); }); vi.stubGlobal("fetch", offline);
    const state = await ask(token, "طلبي اتقبل؟", owner); expect(state.turns.at(-1)?.assistantText).toContain(row.reference); expect(offline).not.toHaveBeenCalled();
    mockProvider(); await ask(token, "ما شروط قبول الدعوى؟", owner);
    mockProvider({ classification: { intent: "FOLLOW_UP", evidence: "هل اتقبل؟" } });
    const legalContinuation = await ask(token, "هل اتقبل؟", owner);
    expect(legalContinuation.dialogue.activeDomain).toBe("LEGAL"); expect(legalContinuation.turns.at(-1)?.assistantText).not.toContain(row.reference);
    vi.stubGlobal("fetch", offline);
    expect((await ask(token, "طلبي اتقبل؟", owner)).turns.at(-1)?.assistantText).toContain(row.reference);
    mockProvider(); await ask(token, "ما شروط قبول الدعوى؟", owner);
    vi.stubGlobal("fetch", offline);
    expect((await ask(token, "عايز أتابع الطلب بتاعي", owner)).turns.at(-1)?.assistantText).toContain(row.reference); expect(offline).not.toHaveBeenCalled();
    mockProvider({ classification: { scope: "OFFICE", intent: "NONE", legal: undefined } });
    await ask(token, "ما خدمات المكتب؟", owner); expect(requests.some(r => r.tools[0]?.type === "openrouter:web_search")).toBe(false);
  });
  it("asks one owned-case selection question then keeps fresh facts for analysis continuations", async () => {
    const owner = await account();
    for (const title of ["FIRST_SYNTHETIC_CASE", "SECOND_SYNTHETIC_CASE"]) await fixture.db.legalCase.create({ data: { clientId: owner.clientId!, assignedLawyerId: owner.id, title, internalFileNumber: `CASE-${randomUUID()}`, caseType: "Civil", courtName: "Synthetic court" } });
    mockProvider({ classification: { legal: { topics: ["CIVIL_PROCEDURE"], mode: "ANALYSIS" }, accountEvidence: "قضيتي" } });
    const token = await createAssistantSession("ar", owner), first = await ask(token, "حلل قضيتي", owner);
    expect(first.dialogue.followup?.choices).toHaveLength(2); expect(first.dialogue.legal?.useSelectedRecord).toBe(true);
    expect(requests.some(r => r.tools[0]?.type === "openrouter:web_search")).toBe(false);
    mockProvider({ classification: { legal: { topics: ["CIVIL_PROCEDURE"], mode: "ANALYSIS" } } });
    const selected = await ask(token, "2", owner); expect(selected.dialogue.followup?.selected).toEqual(first.dialogue.followup?.choices?.[1]);
    expect(requests.some(r => r.tools[0]?.function?.name === "compose_legal_reply")).toBe(true);
    const chosen = selected.dialogue.followup!.selected!;
    await fixture.db.legalCase.update({ where: { id: chosen.id }, data: { title: "UPDATED_SELECTED_CASE" } });
    mockProvider({ classification: { legal: { topics: ["CIVIL_PROCEDURE"], mode: "ANALYSIS" } } });
    await ask(token, "كمل", owner);
    const data = JSON.parse(requests.find(r => r.tools[0]?.function?.name === "compose_legal_reply")!.messages[1].content);
    expect(data.ownedRecords.title).toBe("UPDATED_SELECTED_CASE");
  });
  it("does not count rejected legal answers as booking invitations and offers at most once after useful answers", async () => {
    const token = await createAssistantSession("ar");
    mockProvider({ review: false, classification: { offerAppropriate: true } });
    for (let i = 0; i < 3; i++) await expect(ask(token, "وضح حقوق المستأجر")).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect((await readAssistantSession(token)).dialogue.offerShown).toBe(false);
    mockProvider({ classification: { offerAppropriate: true } });
    expect((await ask(token, "اشرح نوع العقد")).dialogue.offerShown).toBe(false);
    expect((await ask(token, "وضح طبيعة العين")).dialogue.offerShown).toBe(false);
    const offer = await ask(token, "الصورة أوضح الآن"); expect(offer.dialogue.offerShown).toBe(true); expect(offer.turns.at(-1)?.assistantText).toContain(assistantPolicyCopy.ar.offer);
    expect((await ask(token, "كمل الشرح")).turns.at(-1)?.assistantText).not.toContain(assistantPolicyCopy.ar.offer);
  });
  it.skipIf(process.env.RUN_LIVE_LEGAL_ASSISTANT !== "true")("evaluates real configured OpenRouter with synthetic legal questions separately", async () => {
    const evaluation = await liveAssistantEvaluation(nativeFetch, ".playwright/legal-assistant");
    const cases: Array<{ question: string; answer: string | null; sources: unknown }> = [];
    let passed = false, failure: unknown;
    try {
      evaluation.requireConfigured();
      const token = await createAssistantSession("ar");
      for (const question of ["ما الفرق عمومًا بين عقد الإيجار القديم والجديد في مصر؟ اذكر مصدرًا رسميًا دون افتراض تفاصيل حالة شخصية.", "ما أهم المعلومات الناقصة لتقييم عقد؟", "اكتب مسودة بند يحدد العين المؤجرة مع خانات فارغة للمعلومات الناقصة", "عايز احجز استشارة مع المكتب"]) {
        const state = await sendAssistantMessage({ token, messageId: randomUUID(), message: question, locale: "ar", requestId: randomUUID() }); const last = state.turns.at(-1)!;
        cases.push({ question, answer: last.assistantText, sources: last.sources });
        expect(last.assistantText?.length).toBeGreaterThan(40);
        if (cases.length === 1) expect(last.sources.length).toBeGreaterThan(0);
        if (cases.length === 3) expect(last.assistantText).toContain(legalAssistantCopy.ar.draft);
        if (cases.length === 4) expect(state.dialogue.mode).toBe("BOOKING");
      }
      expect(evaluation.requestCount()).toBeGreaterThan(0);
      passed = true;
    } catch (error) { failure = error; throw error;
    } finally {
      await evaluation.report(passed, cases, failure);
    }
  }, 300_000);
});
