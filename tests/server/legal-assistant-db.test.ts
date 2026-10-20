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
    const owner = await account(); mockProvider({ classification: { scope: "OFFICE", intent: "FOLLOW_UP", evidence: message } });
    const token = await createAssistantSession("ar", owner); const result = await ask(token, message, owner);
    expect(result.turns.at(-1)?.assistantText).toContain("نوع العقد"); expect(result.dialogue.followup).toBeUndefined();
    expect(requests.some(r => r.tools[0]?.type === "openrouter:web_search")).toBe(true);
  });
  it.each(["fail", "commercial"] as const)("gives useful qualified explanation when research is %s", async search => {
    mockProvider({ search }); const state = await ask(await createAssistantSession("ar"), "ما حقوق المستأجر؟");
    expect(state.turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.unverified);
    expect(state.turns.at(-1)?.assistantText).toContain("نوع العقد"); expect(state.turns.at(-1)?.sources).toEqual([]);
  });
  it.each(["أرشح المحامي أحمد [S1]", "هتكسب أكيد [S1]", "راجع المصدر [S5]", "هذا أحدث قانون نافذ قطعًا [S1]"])("rejects unsafe/unsupported prose or citations: %s", async answer => {
    mockProvider({ answer, review: false }); const state = await ask(await createAssistantSession("ar"), "وضح القانون");
    expect(state.turns.at(-1)?.assistantText).toContain(legalAssistantCopy.ar.fallback); expect(state.turns.at(-1)?.sources).toEqual([]);
    expect(state.turns.at(-1)?.assistantText).not.toContain(answer);
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
    for (let i = 0; i < 3; i++) expect((await ask(token, "وضح حقوق المستأجر")).dialogue.offerShown).toBe(false);
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
