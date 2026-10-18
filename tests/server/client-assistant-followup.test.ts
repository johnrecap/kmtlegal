import { describe, expect, it } from "vitest";
import { followupCategory, explicitNewBooking } from "@/server/portal/client-assistant-followup";
import { applyAssessment, messageAssessmentSchema, readDialogue } from "@/server/ai/company-conversation-policy";
import { redactMetadata } from "@/server/audit/redaction";

describe("follow-up routing and consent boundaries", () => {
  it("preserves a correlation UUID without allowing private text to bypass redaction", () => {
    const requestId = "cca01234-5678-4ee0-8aa1-ca27a189708e";
    expect(redactMetadata({ requestId, email: "private@synthetic.invalid", message: "Private customer message" })).toEqual({ requestId, email: "[REDACTED]", message: "[REDACTED]" });
    expect(JSON.stringify(redactMetadata({ requestId: "private@synthetic.invalid" }))).not.toContain("private@");
  });
  it.each([
    ["عايز أتابع الطلب بتاعي", "REQUESTS"], ["هل اتقبل واله لا", "REQUESTS"], ["انا قدمت طلب للمكتب ولم يتم الرد عليا", "REQUESTS"],
    ["عليّا كام؟", "PAYMENT"], ["my invoices", "PAYMENT"], ["ميعادي إمتى؟", "APPOINTMENT"], ["مستنداتي", "DOCUMENT"], ["قضيتي", "CASE"], ["جلساتي", "HEARING"], ["بياناتي", "PROFILE"], ["ردود المكتب", "CONVERSATION"]
  ])("routes personal question %s to %s", (text, category) => expect(followupCategory(text)).toBe(category));
  it.each(["هل توجد مواعيد في هذا اليوم؟", "What documents are needed for company formation?", "Explain contract review", "ما المستندات المطلوبة لتأسيس شركة؟", "مواعيد عمل المكتب؟"])("preserves general office inquiry: %s", text => expect(followupCategory(text)).toBeNull());
  it("preserves short context but clears focus on explicit new booking consent", () => {
    const state = readDialogue({ followup: { category: "REQUESTS", selected: { kind: "SERVICE_REQUEST", id: "12345678-1234-4234-8234-123456789abc" } } });
    for (const text of ["الحجز", "هل اتقبل ولا لا؟", "لسه؟", "ناقصني إيه؟", "has it been accepted?"]) expect(followupCategory(text, state.followup)).toBe("REQUESTS");
    const text = "عايز احجز موعد جديد"; expect(explicitNewBooking(text)).toBe(true); expect(followupCategory(text, state.followup)).toBeNull();
    const assessment = messageAssessmentSchema.parse({ scope: "OFFICE", intent: "BOOK", evidence: text, locale: "ar", offerAppropriate: false, inScopeQuestion: text });
    expect(applyAssessment(state, assessment, text).followup).toBeUndefined();
    expect(applyAssessment(state, { ...assessment, intent: "FOLLOW_UP" }, text).consentAt).toBeNull();
  });
});
