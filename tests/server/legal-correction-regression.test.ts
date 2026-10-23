import { afterEach, expect, it, vi } from "vitest";
import { composeLegalAssistance } from "@/server/ai/legal-assistance-service";
import { legalContextSchema } from "@/server/ai/legal-assistance-contract";
import { getAIProvider } from "@/server/ai/provider-registry";

afterEach(() => vi.unstubAllGlobals());
const review = { inScope: true, grounded: true, noFalseCurrentLaw: true, factsAccurate: true, noExternalReferrals: true, noGuarantees: true, draftMarked: true, noFalseActionClaim: true };
function input(message: string, mode: "DRAFT" | "ANALYSIS" = "ANALYSIS") {
  return { provider: getAIProvider({ provider: "openai-compatible", model: "synthetic", baseUrl: "https://synthetic.invalid", apiKey: "synthetic", timeoutMs: 1000, maxTokens: 1200, temperature: 0 }),
    context: legalContextSchema.parse({ mode }), locale: "en" as const, message, requestId: crypto.randomUUID(), history: [], knowledge: {}, showJurisdiction: true };
}
function response(name: string, result: unknown) {
  return Response.json({ choices: [{ finish_reason: "tool_calls", message: { content: null, tool_calls: [{ id: crypto.randomUUID(), type: "function", function: { name, arguments: JSON.stringify(result) } }] } }] });
}

it("repairs the malformed review of an English draft without replacing the valid draft (live 2026-10-23)", async () => {
  let generated = false, reviewed = false;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    if (name === "compose_legal_reply") {
      const answer = generated ? "UNWANTED REPLACEMENT" : "The fee is [AMOUNT], payable on [DATE]."; generated = true;
      return response(name, { answer, sourceIds: [] });
    }
    const result = reviewed ? review : { ...review, grounded: "true" }; reviewed = true;
    return response(name, result);
  }));
  const result = await composeLegalAssistance(input("Draft a short payment clause with placeholders.", "DRAFT"));
  expect(result.text).toContain("The fee is [AMOUNT], payable on [DATE].");
  expect(result.text).not.toContain("UNWANTED REPLACEMENT");
});

it.each([
  ["Summarize only the facts, without legal analysis or another question.", "Your partner paid the other party. You hold the receipt."],
  ["قبل أي رأي قانوني، لخّص فقط الوقائع اللي قلتها لك", "شريكك سلّم المال للطرف الآخر وأنت تحتفظ بالإيصال."],
  ["Who paid? Answer in one sentence, without legal analysis or another question.", "Your partner handed the money to the other party."]
])("honors the requested response boundary and adds no legal boilerplate: %s", async (message, answer) => {
  let repaired = false;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    if (name === "compose_legal_reply") { const value = repaired ? answer : `${answer} Would you like to book?`; repaired = true; return response(name, { answer: value, sourceIds: [] }); }
    return response(name, review);
  }));
  const result = await composeLegalAssistance(input(message));
  expect(result.text).toBe(answer);
  expect(result.allowConsultationOffer).toBe(false);
});

it("never accepts a repeatedly unsupported article", async () => {
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    return response(name, name === "compose_legal_reply" ? { answer: "Article 999 guarantees your case.", sourceIds: [] } : { ...review, grounded: "true" });
  }));
  await expect(composeLegalAssistance(input("Does the correction change things?"))).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
});

it("fails closed after two malformed reviews without regenerating an unchecked draft", async () => {
  const operations: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name; operations.push(name);
    return response(name, name === "compose_legal_reply" ? { answer: "Payment is [AMOUNT] on [DATE].", sourceIds: [] } : { ...review, grounded: "true" });
  }));
  await expect(composeLegalAssistance(input("Draft a short payment clause.", "DRAFT"))).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
  expect(operations).toEqual(["compose_legal_reply", "review_legal_reply", "review_legal_reply"]);
});

it("repairs a verbose English draft before review and adds only the preliminary marker", async () => {
  const clause = "The Client shall pay [AMOUNT AND CURRENCY] for [SERVICES] according to [PAYMENT SCHEDULE], on [DATES TO BE AGREED].";
  let generated = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    if (name !== "compose_legal_reply") return response(name, review);
    return response(name, { answer: ++generated === 1 ? `${"Extra terms. ".repeat(55)}Next step: book a consultation.` : clause, sourceIds: [] });
  }));
  const result = await composeLegalAssistance(input("Draft a short preliminary payment clause; use placeholders for amount and dates.", "DRAFT"));
  expect(result.text).toBe(`Preliminary draft for review before use\n\n${clause}`);
  expect(result.allowConsultationOffer).toBe(false);
});

it.each([
  ["Draft a short payment clause with placeholders.", false],
  ["Draft a short payment clause including taxes with placeholders.", true]
])("only includes additional contractual terms when requested: %s", async (message, includeTax) => {
  let generated = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    if (name !== "compose_legal_reply") return response(name, review);
    return response(name, { answer: ++generated === 1 ? "The fee is [AMOUNT]. Taxes are [TO BE AGREED]." : "The fee is [AMOUNT], payable on [DATE].", sourceIds: [] });
  }));
  const result = await composeLegalAssistance(input(message, "DRAFT"));
  expect(result.text.includes("Taxes")).toBe(includeTax);
  expect(generated).toBe(includeTax ? 1 : 2);
});

it("repairs an unsupported correction response using a concrete reason while retaining the corrected payer", async () => {
  const answer = "Your partner paid the signer; holding the receipt alone does not establish that you paid.";
  let generated = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const body = JSON.parse(String(init?.body)), name = body.tools[0].function.name;
    if (name !== "compose_legal_reply") return response(name, review);
    if (++generated === 1) return response(name, { answer: "Article 999 makes you the payer.", sourceIds: [] });
    const data = JSON.parse(body.messages[1].content);
    expect(data.rejectionReasons).toEqual(["UNSUPPORTED_PRECISE_LAW"]);
    expect(data.repairInstructions[0]).toContain("Remove unsupported article");
    expect(data.question).toContain("my partner");
    return response(name, { answer, sourceIds: [] });
  }));
  const result = await composeLegalAssistance(input("Correction: my partner paid him, not me. Does that change things?"));
  expect(result.text).toContain(answer);
  expect(result.text).not.toContain("999");
});
it("repairs extra prose around an explicitly bounded Arabic document list", async () => {
  const answer = "1. عقد العمل.\n2. كشوف تحويل الراتب.\n3. المراسلات بشأن الأجر المتأخر.";
  let attempts = 0;
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const name = JSON.parse(String(init?.body)).tools[0].function.name;
    return response(name, name === "compose_legal_reply" ? { answer: ++attempts === 1 ? `${answer}\nويفضل إضافة أوراق أخرى.` : answer, sourceIds: [] } : review);
  }));
  const result = await composeLegalAssistance(input("اذكر فقط 3 مستندات أجهزها لمناقشة تأخر راتبي، من غير سؤال إضافي."));
  expect(attempts).toBe(2);
  expect(result.text).toBe(answer);
  expect(result.allowConsultationOffer).toBe(false);
});

it.each([
  ["List only 3 documents for my wage discussion.", true],
  ["Explain which documents matter for my wage discussion.", false]
])("separates customer facts from prior assistant prose for bounded lists: %s", async (message, bounded) => {
  const oldUser = "My wages are two months late.";
  const oldAssistant = "UNTRUSTED OLD BOILERPLATE";
  vi.stubGlobal("fetch", vi.fn(async (_url, init) => {
    const body = JSON.parse(String(init?.body)), name = body.tools[0].function.name;
    const data = JSON.parse(body.messages[1].content);
    expect(data.history).toEqual([{ user: oldUser, assistant: bounded ? null : oldAssistant }]);
    return response(name, name === "compose_legal_reply" ? { answer: "1. Employment contract.\n2. Wage statements.\n3. Payment correspondence.", sourceIds: [] } : review);
  }));
  const result = await composeLegalAssistance({ ...input(message), history: [{ user: oldUser, assistant: oldAssistant }] });
  expect(result.text).toContain("Employment contract.");
});
