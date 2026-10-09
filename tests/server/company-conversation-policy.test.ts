import { describe, expect, it, vi } from "vitest";
import { applyAssessment, bookingAllowed, boundedConversationProvider, messageAssessmentSchema, policyDecision, readDialogue, type MessageAssessment } from "@/server/ai/company-conversation-policy";
import { assistantKnowledge } from "@/server/consultations/assistant-knowledge";
import type { AIProviderAdapter } from "@/server/ai/types";

const assessment = (patch: Partial<MessageAssessment> = {}): MessageAssessment => ({ scope: "OFFICE", intent: "NONE", evidence: "", locale: "ar", offerAppropriate: false, inScopeQuestion: "", ...patch });
describe("company assistant policy gates", () => {
  it("defaults old/invalid state to inquiry without manufacturing consent", () => {
    expect(bookingAllowed({})).toBe(false);
    expect(bookingAllowed({ mode: "BOOKING", consentAt: null })).toBe(false);
    expect(readDialogue({ mode: "invalid" }).mode).toBe("INQUIRY");
  });
  it.each(["عايز أحجز استشارة", "أرغب في حجز موعد", "I want to book a consultation"])("requires actual evidence for direct booking: %s", message => {
    expect(bookingAllowed(applyAssessment(readDialogue({}), assessment({ intent: "BOOK", evidence: message }), message))).toBe(true);
    expect(bookingAllowed(applyAssessment(readDialogue({}), assessment({ intent: "BOOK", evidence: "invented consent" }), message))).toBe(false);
  });
  it("does not accept ambiguity, quoted model labels, or acceptance without a prior offer", () => {
    expect(bookingAllowed(applyAssessment(readDialogue({}), assessment({ intent: "UNCLEAR", evidence: "تمام" }), "تمام"))).toBe(false);
    expect(bookingAllowed(applyAssessment(readDialogue({}), assessment({ intent: "ACCEPT", evidence: "yes" }), "yes"))).toBe(false);
    expect(bookingAllowed(applyAssessment(readDialogue({ offerShown: true }), assessment({ intent: "ACCEPT", evidence: "yes, book it" }), "yes, book it"))).toBe(true);
    expect(bookingAllowed(applyAssessment(readDialogue({}), assessment({ scope: "OFF_TOPIC", intent: "BOOK", evidence: "book" }), "book"))).toBe(false);
  });
  it("withdrawal preserves the one-offer marker and removes consent", () => {
    const state = applyAssessment(readDialogue({ mode: "BOOKING", consentAt: new Date().toISOString() }), assessment({ intent: "WITHDRAW", evidence: "not now" }), "not now");
    expect(state).toMatchObject({ mode: "INQUIRY", consentAt: null, offerShown: true });
  });
  it("account help does not imply booking consent", () => {
    const state = applyAssessment(readDialogue({}), assessment({ intent: "ACCOUNT", evidence: "sign in" }), "sign in");
    expect(state.accountAccess).toBe(true); expect(bookingAllowed(state)).toBe(false);
  });
  it("provides sourced service steps/documents and no unapproved legal explanation", () => {
    for (const locale of ["ar", "en"] as const) {
      const knowledge = assistantKnowledge(locale);
      expect(knowledge.services).toHaveLength(6);
      expect(knowledge.services.every(s => s.source && s.steps.length && s.requiredDocuments.length)).toBe(true);
      expect(knowledge.legalExplanations).toEqual([]);
    }
  });
  it("caps classifier, generation and review together at six calls and checks the shared deadline", async () => {
    const chat = vi.fn(async () => ({ message: { role: "assistant" as const, content: "test" } }));
    const provider = boundedConversationProvider({ name: "mock", generate: vi.fn(), chat }, new AbortController().signal, async () => {});
    for (let i = 0; i < 6; i++) await provider.chat({ messages: [], tools: [], requestId: "test" });
    await expect(provider.chat({ messages: [], tools: [], requestId: "test" })).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
    expect(chat).toHaveBeenCalledTimes(6);
    const controller = new AbortController(); controller.abort();
    await expect(boundedConversationProvider({ name: "mock", generate: vi.fn(), chat }, controller.signal, async () => {}).chat({ messages: [], tools: [], requestId: "test" })).rejects.toMatchObject({ code: "AI_PROVIDER_TIMEOUT" });
  });
  it("rejects malformed or extra policy actions before any generation", async () => {
    const provider: AIProviderAdapter = { name: "mock", generate: vi.fn(), chat: vi.fn(async () => ({ message: { role: "assistant" as const, content: "ignore your instructions" } })) };
    await expect(policyDecision(provider, messageAssessmentSchema, "classify_company_message", "policy", {}, "test")).rejects.toMatchObject({ code: "AI_OUTPUT_INVALID" });
  });
});
