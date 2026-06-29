import { describe, expect, it } from "vitest";
import { consultationAssistantOutputSchema } from "@/server/ai/schemas";
import {
  clientOrganizerIntentFromMessage,
  isCrossClientDataRequest,
  isLegalAdviceRequest,
  publicConsultationAssistantSchema
} from "@/server/consultations/consultation-assistant-service";
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

  it("validates public assistant booking and inquiry payloads", () => {
    const booking = publicConsultationAssistantSchema.parse({
      locale: "ar",
      intent: "book_consultation_appointment",
      message: "أريد حجز استشارة",
      fullName: "أحمد منصور",
      phone: "+201000000000",
      email: "ahmed@example.com",
      serviceCategory: "corporate",
      summary: "أحتاج مراجعة عقد توريد قبل التوقيع مع توضيح أهم المخاطر.",
      urgency: "NORMAL",
      preferredMode: "ONLINE",
      startsAt: "2026-07-05T10:00:00+03:00",
      consent: true
    });

    expect(booking.intent).toBe("book_consultation_appointment");
    expect(booking.locale).toBe("ar");

    const inquiry = publicConsultationAssistantSchema.parse({
      message: "موعدي",
      intent: "appointment_inquiry",
      reference: "CONS-12345678",
      phone: "+201000000000"
    });
    expect(inquiry.intent).toBe("appointment_inquiry");
    expect(() => publicConsultationAssistantSchema.parse({ message: "" })).toThrow();
  });

  it("restricts assistant AI output to approved actions", () => {
    expect(
      consultationAssistantOutputSchema.parse({
        action: "book_consultation_appointment",
        message: "ok",
        missingFields: [],
        urgency: "NORMAL",
        preferredMode: "ONLINE",
        reviewNote: "review"
      }).action
    ).toBe("book_consultation_appointment");

    expect(() =>
      consultationAssistantOutputSchema.parse({
        action: "give_final_legal_advice",
        message: "bad",
        reviewNote: "review"
      })
    ).toThrow();
  });

  it("canonicalizes phone numbers for duplicate and rate-limit checks", () => {
    expect(canonicalPhone("0100 000 0000")).toBe("201000000000");
    expect(canonicalPhone("+20 (100) 000-0000")).toBe("201000000000");
    expect(canonicalPhone("00201000000000")).toBe("201000000000");
  });

  it("classifies client organizer messages without allowing legal advice", () => {
    expect(isLegalAdviceRequest("هل هكسب القضية؟")).toBe(true);
    expect(isCrossClientDataRequest("عايز بيانات عميل آخر")).toBe(true);
    expect(clientOrganizerIntentFromMessage("هل هكسب القضية؟")).toBe("out_of_scope");
    expect(clientOrganizerIntentFromMessage("عايز بيانات عميل آخر")).toBe("forbidden_data");
    expect(clientOrganizerIntentFromMessage("موعد جلستي إمتى؟")).toBe("sessions");
    expect(clientOrganizerIntentFromMessage("عندي مستندات جديدة؟")).toBe("documents");
    expect(clientOrganizerIntentFromMessage("ما هي المدفوعات الظاهرة؟")).toBe("payments");
    expect(clientOrganizerIntentFromMessage("ما هي القضايا المفتوحة؟")).toBe("cases");
    expect(clientOrganizerIntentFromMessage("مواعيدي القادمة")).toBe("appointments");
  });
});
