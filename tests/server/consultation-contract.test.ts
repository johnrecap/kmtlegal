import { describe, expect, it } from "vitest";
import { publicConsultationReference, publicConsultationRequestSchema } from "@/server/consultations/consultation-service";
import { canonicalPhone } from "@/server/phone/phone-normalization";

describe("public consultation contract", () => {
  it("validates the booking payload shape", () => {
    const parsed = publicConsultationRequestSchema.parse({
      fullName: "أحمد منصور",
      phone: "+201000000000",
      email: "ahmed@example.com",
      city: "القاهرة",
      serviceCategory: "corporate",
      summary: "أحتاج مراجعة عقد توريد قبل التوقيع مع توضيح أهم المخاطر.",
      opposingPartyName: "",
      urgency: "NORMAL",
      preferredMode: "ONLINE",
      consent: true
    });

    expect(parsed.email).toBe("ahmed@example.com");
    expect(parsed.preferredMode).toBe("ONLINE");
  });

  it("rejects short summaries and missing consent", () => {
    expect(() =>
      publicConsultationRequestSchema.parse({
        fullName: "أحمد",
        phone: "+201000000000",
        serviceCategory: "corporate",
        summary: "قصير",
        urgency: "NORMAL",
        preferredMode: "PHONE",
        consent: false
      })
    ).toThrow();
  });

  it("creates a non-sensitive public reference from the database id", () => {
    expect(publicConsultationReference("12345678-0000-4000-8000-000000000000")).toBe("CONS-12345678");
  });

  it("canonicalizes phone numbers for duplicate and rate-limit checks", () => {
    expect(canonicalPhone("0100 000 0000")).toBe("201000000000");
    expect(canonicalPhone("+20 (100) 000-0000")).toBe("201000000000");
    expect(canonicalPhone("00201000000000")).toBe("201000000000");
  });
});
