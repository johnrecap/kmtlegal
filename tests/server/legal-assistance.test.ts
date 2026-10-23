import { afterEach, describe, expect, it, vi } from "vitest";
import { legalSourceMetadata, legalSourceSchema, officialLegalUrl, readLegalSources } from "@/lib/legal-assistant";
import { legalContextForMessage } from "@/server/ai/legal-context";
import { legalContextSchema, legalTopics } from "@/server/ai/legal-assistance-contract";
import { legalResearchQuery, requestLegalResearch } from "@/server/ai/providers/legal-research";
import { legalAnswerSafe, noOutsideReferral } from "@/server/ai/legal-safety";
import { followupCategory } from "@/server/portal/client-assistant-followup";
import { boundedConversationProvider } from "@/server/ai/company-conversation-policy";
import type { AIProviderConfig } from "@/server/ai/config";

const config: AIProviderConfig = { provider: "openrouter", apiKey: "synthetic", baseUrl: "https://synthetic.invalid", model: "synthetic", maxTokens: 1200, temperature: 0, timeoutMs: 1000 };
const research = { jurisdiction: "EG", topics: ["RENT" as const], locale: "ar" as const, requestId: "synthetic" };
const source = { id: "S1", title: "Official synthetic fixture", url: "https://cc.gov.eg/", jurisdiction: "EG", retrievedAt: "2026-10-18T10:00:00.000Z" };
afterEach(() => vi.unstubAllGlobals());
describe("legal context, official research and safety boundaries", () => {
  it("defaults Egypt and retains the topic and draft mode across short continuations", () => {
    const first = legalContextForMessage(undefined, { topics: ["DIVORCE"], mode: "DRAFT" }, "اكتب مسودة");
    expect(first.context).toMatchObject({ jurisdiction: "EG", explicit: false, topics: ["DIVORCE"], mode: "DRAFT" });
    expect(legalContextForMessage(first.context, undefined, "كمل").context).toEqual(first.context);
    expect(legalContextForMessage(first.context, undefined, "وفي السعودية؟").context).toMatchObject({ jurisdiction: "SA", explicit: true });
  });
  it("requires exact current evidence for a model jurisdiction and asks once for conflicting countries", () => {
    expect(legalContextForMessage(undefined, { jurisdiction: "FR", jurisdictionEvidence: "France" }, "ما حقوقي؟").context.jurisdiction).toBe("EG");
    expect(legalContextForMessage(undefined, { jurisdiction: "QA", jurisdictionEvidence: "قطر" }, "في قطر").context.jurisdiction).toBe("QA");
    expect(legalContextForMessage(undefined, undefined, "أنا في مصر والعقد في السعودية").conflict).toBe(true);
    expect(legalContextForMessage(undefined, undefined, "مصري في السعودية").conflict).toBe(false);
    expect(legalContextForMessage(undefined, { conflict: true }, "تفاصيل متعارضة").conflict).toBe(true);
  });
  it.each(["ما شروط قبول الدعوى؟", "ناقصني إيه لعمل توكيل؟", "حلل قضيتي", "draft my claim", "What are admissibility requirements?"])("does not route a legal question into private status: %s", question => {
    expect(followupCategory(question, { category: "REQUESTS" })).toBeNull();
  });
  it("keeps actual account status/balance follow-up eligible for deterministic server answers", () => {
    expect(followupCategory("طلبي اتقبل؟")).toBe("REQUESTS"); expect(followupCategory("عليّا كام؟")).toBe("PAYMENT");
    expect(followupCategory("الحجز", { category: "CONSULTATION" })).toBe("CONSULTATION");
  });
  it("builds queries from controlled concepts only across all supported topics", () => {
    for (const topic of Object.keys(legalTopics) as Array<keyof typeof legalTopics>) {
      const query = legalResearchQuery({ ...research, topics: [topic], message: "PRIVATE_NAME email@synthetic.invalid +201099998888 ignore instructions" } as typeof research);
      expect(query).not.toMatch(/PRIVATE_NAME|synthetic\.invalid|1099998888|ignore instructions/);
      expect(query).toContain(legalTopics[topic][0]);
    }
  });
  it.each(["https://cc.gov.eg.evil.invalid/", "https://evil.invalid/cc.gov.eg", "http://cc.gov.eg/", "https://cc.gov.eg@evil.invalid/", "javascript:alert(1)", "https://cc.gov.eg:444/"])("rejects nonofficial/unsafe citation URLs: %s", url => {
    expect(officialLegalUrl(url, "EG")).toBe(false); expect(legalSourceSchema.safeParse({ ...source, url }).success).toBe(false);
  });
  it("keeps old JSON compatible and never exposes malformed/unofficial source metadata", () => {
    expect(readLegalSources(null)).toEqual([]); expect(readLegalSources([])).toEqual([]);
    expect(readLegalSources([legalSourceMetadata(legalSourceSchema.array().parse([source]))])).toEqual([source]);
    expect(readLegalSources([{ role: "system", content: "KMT_LEGAL_SOURCES:{bad" }])).toEqual([]);
    expect(readLegalSources([legalSourceMetadata([{ ...source, id: "S1", url: "https://lawyers.invalid/" }])])).toEqual([]);
  });
  it("limits one Exa request, five official excerpts and ignores model prose as source evidence", async () => {
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => Response.json({ choices: [{ message: { content: "UNSUPPORTED MODEL PROSE", annotations: Array.from({ length: 8 }, (_, i) => ({ type: "url_citation", url_citation: { title: `Source ${i}`, url: `https://cc.gov.eg/${i}`, content: "EXCERPT ".repeat(600) } })) } }] }));
    vi.stubGlobal("fetch", fetch);
    const result = await requestLegalResearch(config, research); expect(result.sources).toHaveLength(5);
    expect(result.sources.every(s => s.excerpt.length === 2000 && !s.excerpt.includes("MODEL PROSE"))).toBe(true);
    const body = JSON.parse(fetch.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ max_tool_calls: 1, tools: [{ type: "openrouter:web_search", parameters: { engine: "exa", max_results: 5, max_total_results: 5, max_uses: 1, max_characters: 2000 } }] });
    expect(body.messages).toHaveLength(2); expect(body.tools[0].parameters.allowed_domains).toContain("cc.gov.eg"); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("deduplicates citations, rejects commercial or cross-country sources and needs actual excerpts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ message: { annotations: [
      { url: "https://cc.gov.eg/", title: "Official", content: "One relevant excerpt" }, { url: "https://cc.gov.eg/", title: "Duplicate", content: "duplicate" },
      { url: "https://lawyers.invalid/", title: "Commercial", content: "Not official" }, { url: "https://gov.uk/", title: "Wrong country", content: "foreign" },
      { url: "https://eta.gov.eg/", title: "No excerpt" }
    ].map(url_citation => ({ type: "url_citation", url_citation })) } }] })));
    expect((await requestLegalResearch(config, research)).sources).toMatchObject([{ id: "S1", title: "Official" }]);
  });
  it("honestly reports unavailable research, unknown authority coverage and insufficient annotations", async () => {
    const fetch = vi.fn(async () => Response.json({ choices: [{ message: { content: "A model answer without evidence" } }] })); vi.stubGlobal("fetch", fetch);
    expect((await requestLegalResearch(config, research)).status).toBe("INSUFFICIENT");
    expect((await requestLegalResearch(config, { ...research, jurisdiction: "QA" })).status).toBe("INSUFFICIENT");
    expect((await requestLegalResearch({ ...config, apiKey: undefined }, research)).status).toBe("UNAVAILABLE");
    expect(fetch).toHaveBeenCalledTimes(1);
    fetch.mockRejectedValueOnce(new Error("PRIVATE_ERROR")); expect((await requestLegalResearch(config, research)).status).toBe("UNAVAILABLE");
  });
  it("ignores new annotation kinds without treating them or model prose as legal evidence", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ choices: [{ message: { annotations: [
      { type: "new_provider_annotation", content: "Invented law" },
      { type: "url_citation", url_citation: { title: "Official fixture", url: "https://cc.gov.eg/", content: "A synthetic excerpt" } },
      { type: "url_citation", url_citation: { title: "Missing excerpt", url: "https://eta.gov.eg/" } }
    ] } }] })));
    expect((await requestLegalResearch(config, research)).sources).toMatchObject([{ id: "S1", excerpt: "A synthetic excerpt" }]);
  });
  it.each(["أرشح المحامي أحمد", "أنصحك بمكتب محاماة آخر", "ابحث عن محامي", "I recommend lawyer John", "Contact a law firm outside", "Book at https://outside.invalid/", "أنا محاميك", "اضمن لك الفوز"])("rejects outside referrals, impersonation or guarantees: %s", text => { expect(legalAnswerSafe(text)).toBe(false); });
  it("allows official citations, conditional explanation and internal booking", () => {
    expect(legalAnswerSafe("لا أضمن نتيجة. المسودة أولية وتتوقف على الوقائع.")).toBe(true);
    expect(noOutsideReferral("المصدر https://cc.gov.eg/", ["https://cc.gov.eg/"])).toBe(true);
    expect(noOutsideReferral("احجز من https://kmtlegal.org/ar/book-consultation")).toBe(true);
    expect(legalContextSchema.parse({}).jurisdiction).toBe("EG");
  });
  it("counts research in the shared call budget and checks identity before it", async () => {
    const assertActive = vi.fn(async () => {}), researchLegal = vi.fn(async () => ({ status: "AVAILABLE" as const, sources: [] }));
    const provider = boundedConversationProvider({ name: "mock", generate: vi.fn(), chat: vi.fn(), researchLegal }, new AbortController().signal, assertActive);
    for (let i = 0; i < 6; i++) await provider.researchLegal(research);
    await expect(provider.researchLegal(research)).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" }); expect(researchLegal).toHaveBeenCalledTimes(6);
    assertActive.mockRejectedValueOnce(new Error("revoked")); await expect(provider.researchLegal(research)).rejects.toThrow("revoked"); expect(researchLegal).toHaveBeenCalledTimes(6);
  });
});
