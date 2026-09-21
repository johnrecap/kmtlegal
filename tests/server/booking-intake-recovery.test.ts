import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handlePublicConsultationAssistant } from "@/server/consultations/consultation-assistant-service";
import * as ai from "@/server/ai";
import * as availability from "@/server/consultations/consultation-availability-service";

vi.mock("@/server/rate-limit/memory-rate-limit", () => ({ enforceRateLimit: vi.fn(), rateLimiters: { ai: {}, booking: {} } }));
vi.mock("@/server/consultations/consultation-booking-settings", async importOriginal => ({
  ...await importOriginal<typeof import("@/server/consultations/consultation-booking-settings")>(),
  getPublicConsultationBookingMode: vi.fn(async () => "AI_CHAT_PAID")
}));
const ask = async (message: string, draft: unknown = {}, extra: Record<string, unknown> = {}) =>
  await handlePublicConsultationAssistant({
    body: { locale: "ar", message, draft, ...extra },
    request: new Request("http://example.test/api/public/consultations/assistant"), requestId: "intake-regression"
  }) as any;
const validDraft = {
  fullName: "عادل سعيد عادل", phone: "+201000009999", serviceCategory: "real-estate-legal-support",
  summary: "أحتاج مراجعة عقد إيجار سكني قبل توقيعه مع المالك.", preferredMode: "ONLINE", urgency: "NORMAL"
};
beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(ai, "generateStructured").mockRejectedValue(new Error("Simulated provider outage"));
  vi.spyOn(availability, "listPublicConsultationSlots").mockResolvedValue([
    { id: "test-slot", startsAt: "2099-09-20T10:00:00.000Z", endsAt: "2099-09-20T11:00:00.000Z", mode: "ONLINE" }
  ]);
});
afterEach(() => vi.restoreAllMocks());

describe("incremental booking intake recovery", () => {
  it("keeps an Arabic matter, then name and phone, when the provider is unavailable", async () => {
    const selected = await ask("مراجعة قانونية عقارية", { serviceCategory: "real-estate-legal-support" }, { event: "select_category" });
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(selected.draft.summary).toBe("");
    expect(selected.intake.nextField).toBe("fullName");
    const matter = await ask("عايز استشارة عن حد اتهجم عليا في بيتي", selected.draft);
    expect(matter.draft.summary).toContain("اتهجم");
    expect(matter.draft.fullName).toBe("");
    expect(matter.draft.serviceCategory).toBe("real-estate-legal-support");
    expect(matter.categorySuggestion).toEqual({ current: "real-estate-legal-support", suggested: "legal-consultation" });
    expect(matter.intake).toMatchObject({ status: "degraded", progressed: true, nextField: "fullName" });
    const name = await ask(validDraft.fullName, matter.draft);
    expect(ai.generateStructured).toHaveBeenCalledTimes(1);
    expect(name.draft.fullName).toBe(validDraft.fullName);
    expect(name.draft.summary).toBe(matter.draft.summary);
    expect(name.intake.nextField).toBe("phone");
    expect(name.message).toContain("رقم الهاتف");
    const phone = await ask("٠١٠٠٠٠٠٩٩٩٩", name.draft);
    expect(ai.generateStructured).toHaveBeenCalledTimes(1);
    expect(phone.draft.phone).toBe("01000009999");
    expect(phone.needsAvailabilityPreference).toBe(true);
    const time = await ask("بكره", phone.draft);
    expect(time.availableSlots).toHaveLength(1);
    expect(time.reference).toBeUndefined();
    expect(time.readyToConfirm).toBe(false);
  });

  it.each(["ar", "en"])("starts without calling a model or treating an action label as a fact (%s)", async locale => {
    const r = await ask(locale === "ar" ? "حجز استشارة" : "Book consultation", {}, { locale, event: "start_booking" });
    expect(r.draft.fullName).toBe(""); expect(r.draft.summary).toBe("");
    expect(r.intake).toMatchObject({ status: "understood", progressed: true, nextField: "fullName" });
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it("replaces a stale category-label summary with the actual matter", async () => {
    const r = await ask("عايز استشارة عن حد اتهجم عليا في بيتي", { serviceCategory: "real-estate-legal-support", summary: "مراجعة قانونية عقارية" });
    expect(r.draft.summary).toContain("اتهجم");
    expect(r.intake.nextField).toBe("fullName");
  });

  it("accepts an Arabic name without inventing a city from part of that name", async () => {
    const r = await ask("عبد الرحمن سعيد");
    expect(r.draft.fullName).toBe("عبد الرحمن سعيد");
    expect(r.draft.city).toBe("");
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it.each(["رقمي ٠١٠٠٠٠٠٩٩٩٩", "My phone is +201000009999", "بريدي test@example.test"])("handles a clear contact label without the model: %s", async message => {
    const r = await ask(message, { ...validDraft, phone: "", email: "" });
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(r.intake.progressed).toBe(true);
  });

  it("does not label a short matter description as a name", async () => {
    const r = await ask("حد اتهجم عليا في بيتي");
    expect(r.draft.fullName).toBe("");
    expect(r.intake.nextField).toBe("fullName");
  });

  it("exposes a no-progress degradation while asking only for the missing field", async () => {
    const r = await ask("؟؟؟", { ...validDraft, phone: "" });
    expect(r.intake).toMatchObject({ status: "degraded", progressed: false, nextField: "phone" });
    expect(r.message).toContain("رقم الهاتف");
    expect(r.message).not.toContain("الاسم");
    expect(r.draft.fullName).toBe(validDraft.fullName);
  });

  it("preserves intake and offers the next booking step after a direct legal question", async () => {
    const r = await ask("هل هكسب القضية؟", { ...validDraft, phone: "" });
    expect(r.intake.status).toBe("legal_boundary");
    expect(r.message).toContain("مراجعة محامٍ");
    expect(r.message).toContain("رقم الهاتف");
    expect(r.draft.fullName).toBe(validDraft.fullName);
    expect(r.reference).toBeUndefined();
    expect(r.readyToConfirm).toBe(false);
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it("accepts a booking description asking a lawyer to interpret a contract", async () => {
    const r = await ask("محتاج تفسير بند في عقد توريد قبل التوقيع", { fullName: validDraft.fullName });
    expect(r.intake.status).toBe("degraded");
    expect(r.draft.summary).toContain("تفسير بند");
    expect(r.intake.nextField).toBe("phone");
  });

  it("ignores a low-confidence legal flag and never displays model-written advice", async () => {
    vi.mocked(ai.generateStructured).mockResolvedValue({ output: {
      intent: "legal_advice", fields: {}, confidence: 0.1, fieldConfidence: {}, needsClarification: true,
      clarifyingQuestion: "You will win; file a case immediately", legalAdviceRequested: true, reviewNote: "Review"
    } } as any);
    const r = await ask("؟؟؟", { ...validDraft, phone: "" });
    expect(r.intake.status).toBe("needs_clarification");
    expect(r.message).toContain("رقم الهاتف");
    expect(r.message).not.toContain("win");
    const input = vi.mocked(ai.generateStructured).mock.calls[0][0].input as any;
    expect(input.conversationContext.expectedField).toBe("phone");
    expect(input.conversationContext.collectedFields).toContain("fullName");
  });

  it("does not present invented model facts or advice as client intake", async () => {
    vi.mocked(ai.generateStructured).mockResolvedValue({ output: {
      intent: "booking", fields: { fullName: "Invented Person", phone: "+201000001234", email: "madeup@example.test", city: "Invented City", summary: "You should sue the other party immediately." },
      confidence: 0.99, fieldConfidence: { fullName: 1, phone: 1, email: 1, city: 1, summary: 1 }, needsClarification: false,
      legalAdviceRequested: false, reviewNote: "Review"
    } } as any);
    const r = await ask("؟؟؟");
    expect(r.draft).toMatchObject({ fullName: "", phone: "", email: "", city: "", summary: "" });
    expect(r.message).not.toContain("sue");
  });

  it("does not let a legal flag on a matter description discard new facts", async () => {
    vi.mocked(ai.generateStructured).mockResolvedValue({ output: {
      intent: "legal_advice", fields: {}, confidence: 0.99, fieldConfidence: {}, needsClarification: false,
      legalAdviceRequested: true, reviewNote: "Review"
    } } as any);
    const r = await ask("عايز استشارة عن حد اتهجم عليا في بيتي");
    expect(r.intake.status).toBe("understood");
    expect(r.draft.summary).toContain("اتهجم");
    expect(r.message).toContain("اسمك الكامل");
  });

  it("a category decision clears stale selected slots and never books implicitly", async () => {
    const r = await ask("استشارة عامة", { ...validDraft, serviceCategory: "legal-consultation", startsAt: "2099-09-20T10:00:00.000Z" }, {
      event: "select_category", selectedSlot: "2099-09-20T10:00:00.000Z"
    });
    expect(r.draft.startsAt).toBe("");
    expect(r.readyToConfirm).toBe(false);
    expect(r.reference).toBeUndefined();
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it("validates structured category values on the server", async () => {
    await expect(ask("anything", { serviceCategory: "invented" }, { event: "select_category" })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
