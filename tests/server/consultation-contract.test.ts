import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { consultationAssistantOutputSchema } from "@/server/ai/schemas";
import { adminConsultationListQuerySchema } from "@/server/admin/consultation-review-service";
import {
  clientOrganizerIntentFromMessage,
  deterministicBookingSummary,
  handlePublicConsultationAssistant,
  inferPublicConsultationServiceCategory,
  isCrossClientDataRequest,
  isLegalAdviceRequest,
  publicBookingSlotConfirmationError,
  publicConsultationAssistantSchema
} from "@/server/consultations/consultation-assistant-service";
import {
  canManageConsultationAvailability,
  consultationAvailabilitySchema,
  defaultConsultationAvailability,
  generateConsultationSlots
} from "@/server/consultations/consultation-availability-service";
import { publicConsultationReference, publicConsultationRequestSchema } from "@/server/consultations/consultation-service";
import { canonicalPhone } from "@/server/phone/phone-normalization";

describe("public consultation contract", () => {
  it("validates the booking payload shape", () => {
    const parsed = publicConsultationRequestSchema.parse({
      fullName: "أحمد منصور",
      phone: "+201000000000",
      email: "ahmed@example.com",
      city: "القاهرة",
      serviceCategory: "corporate-business-services",
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
        serviceCategory: "corporate-business-services",
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
      serviceCategory: "corporate-business-services",
      summary: "أحتاج مراجعة عقد توريد قبل التوقيع مع توضيح أهم المخاطر.",
      urgency: "NORMAL",
      preferredMode: "ONLINE",
      startsAt: "2026-07-05T10:00:00+03:00",
      consent: true
    });

    expect(booking.intent).toBe("book_consultation_appointment");
    expect(booking.locale).toBe("ar");

    const conversational = publicConsultationAssistantSchema.parse({
      locale: "en",
      message: "My name is Sara, phone +201000000002, I need contract review",
      draft: {
        serviceCategory: "corporate-business-services",
        preferredMode: "ONLINE",
        availabilityPreference: {
          date: "2026-07-06",
          fromTime: "15:00"
        }
      },
      selectedSlot: "2026-07-05T10:00:00+03:00",
      confirmBooking: false
    });
    expect(conversational.draft?.serviceCategory).toBe("corporate-business-services");
    expect(conversational.draft?.availabilityPreference?.date).toBe("2026-07-06");
    expect(conversational.selectedSlot).toContain("2026-07-05");

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

  it("infers real KMT service categories from booking chat language", () => {
    expect(inferPublicConsultationServiceCategory("وصل أمانة موقع عليا وعايز استشارة عاجلة")).toBe("claims-collections");
    expect(inferPublicConsultationServiceCategory("I signed a promissory note and need urgent consultation")).toBe("claims-collections");
    expect(inferPublicConsultationServiceCategory("I need contract review and company formation")).toBe("corporate-business-services");
    expect(inferPublicConsultationServiceCategory("Lease agreement for an apartment")).toBe("real-estate-legal-support");
    expect(inferPublicConsultationServiceCategory("استشارات جنائية")).toBe("legal-consultation");
  });

  it("keeps public booking confirmation and reference inquiry independent from AI provider availability", () => {
    const source = readFileSync(join(process.cwd(), "src/server/consultations/consultation-assistant-service.ts"), "utf8");

    expect(source).not.toContain("generateStructured");
    expect(source).not.toContain("runAssistantAI");
    expect(source).toContain("deterministicBookingSummary");
    expect(source).toContain("deterministic_booking_rules");
    expect(source).toContain("publicAppointmentInquiry({ body, requestId: input.requestId })");
    expect(source).toContain("bookConsultationAppointment({ body: bookingBody, request: input.request, requestId: input.requestId })");
  });

  it("builds a useful office brief for public AI chat bookings", () => {
    const brief = deterministicBookingSummary(
      {
        locale: "ar",
        message: "احجز استشارة",
        fullName: "خالد أحمد",
        phone: "01063887871",
        email: "khaled@example.com",
        city: "القاهرة",
        serviceCategory: "claims-collections",
        summary: "وصل أمانة موقع عليا وعايز استشارة عاجلة قبل اتخاذ أي خطوة.",
        urgency: "URGENT",
        preferredMode: "ONLINE",
        startsAt: "2026-07-01T09:00:00.000Z",
        consent: true
      },
      new Date("2026-07-01T09:00:00.000Z")
    );

    expect(brief).toContain("ملخص للفريق");
    expect(brief).toContain("خالد أحمد");
    expect(brief).toContain("التحصيل والتسويات");
    expect(brief).toContain("وصل أمانة");
    expect(brief).toContain("01063887871");
    expect(brief).toContain("أونلاين");
    expect(brief).toContain("تعيين محامي مناسب");
  });

  it("does not treat booking quick actions as the client name", async () => {
    const request = new Request("https://example.test/api/public/consultations/assistant", {
      headers: { "x-forwarded-for": "203.0.113.10" }
    });

    const start = await handlePublicConsultationAssistant({
      body: { locale: "en", message: "Book consultation" },
      request,
      requestId: "test-booking-start"
    });

    expect((start as unknown as { draft: { fullName: string } }).draft.fullName).toBe("");

    const confirm = await handlePublicConsultationAssistant({
      body: {
        locale: "en",
        message: "Book appointment",
        confirmBooking: true,
        selectedSlot: "2026-07-05T10:00:00.000Z",
        draft: {
          fullName: "Book consultation",
          phone: "01036887871",
          serviceCategory: "claims-collections",
          summary: "Signed trust receipt dispute requiring urgent office review.",
          preferredMode: "ONLINE",
          startsAt: "2026-07-05T10:00:00.000Z"
        }
      },
      request,
      requestId: "test-booking-confirm"
    });

    const confirmResult = confirm as unknown as { missingFields: string[]; draft: { fullName: string } };
    expect(confirmResult.missingFields).toContain("fullName");
    expect(confirmResult.draft.fullName).toBe("");

    const polluted = await handlePublicConsultationAssistant({
      body: {
        locale: "en",
        message: "Book appointment",
        confirmBooking: true,
        selectedSlot: "2026-07-05T10:00:00.000Z",
        draft: {
          fullName: "01063887871",
          phone: "tomorrow",
          serviceCategory: "claims-collections",
          summary: "Signed trust receipt dispute requiring urgent office review.",
          preferredMode: "ONLINE",
          startsAt: "2026-07-05T10:00:00.000Z"
        }
      },
      request,
      requestId: "test-booking-polluted"
    });

    const pollutedResult = polluted as unknown as { missingFields: string[]; draft: { fullName: string; phone: string } };
    expect(pollutedResult.missingFields).toEqual(expect.arrayContaining(["fullName", "phone"]));
    expect(pollutedResult.draft.fullName).toBe("");
    expect(pollutedResult.draft.phone).toBe("");
  });

  it("recovers expired booking slots before confirming an appointment", async () => {
    expect(publicBookingSlotConfirmationError("en", "2020-01-01T10:00:00.000Z", new Date("2026-06-30T10:00:00.000Z"))).toContain(
      "no longer available"
    );

    const request = new Request("https://example.test/api/public/consultations/assistant", {
      headers: { "x-forwarded-for": "203.0.113.11" }
    });

    const result = await handlePublicConsultationAssistant({
      body: {
        locale: "en",
        message: "Book appointment",
        confirmBooking: true,
        selectedSlot: "2020-01-01T10:00:00.000Z",
        draft: {
          fullName: "Khaled Ahmed",
          phone: "01063887871",
          serviceCategory: "claims-collections",
          summary: "Signed trust receipt dispute requiring urgent office review.",
          preferredMode: "ONLINE",
          startsAt: "2020-01-01T10:00:00.000Z"
        }
      },
      request,
      requestId: "test-booking-expired-slot"
    });

    const bookingResult = result as unknown as {
      message: string;
      missingFields: string[];
      readyToConfirm: boolean;
      needsAvailabilityPreference: boolean;
      draft: { startsAt: string };
    };
    expect(bookingResult.message).toContain("no longer available");
    expect(bookingResult.missingFields).toContain("startsAt");
    expect(bookingResult.readyToConfirm).toBe(false);
    expect(bookingResult.needsAvailabilityPreference).toBe(true);
    expect(bookingResult.draft.startsAt).toBe("");
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
  it("generates public consultation slots from secretary availability and skips booked times", () => {
    const availability = consultationAvailabilitySchema.parse({
      ...defaultConsultationAvailability,
      minLeadHours: 0,
      bookingWindowDays: 1,
      slotDurationMinutes: 60,
      days: defaultConsultationAvailability.days.map((day) => ({
        ...day,
        enabled: day.weekday === 0,
        start: "10:00",
        end: "12:00",
        modes: ["ONLINE"]
      }))
    });

    const slots = generateConsultationSlots({
      availability,
      mode: "ONLINE",
      now: new Date("2026-07-05T05:00:00.000Z"),
      appointments: [
        {
          startsAt: new Date("2026-07-05T07:00:00.000Z"),
          endsAt: new Date("2026-07-05T08:00:00.000Z")
        }
      ]
    });

    expect(slots.map((slot) => slot.startsAt)).toEqual(["2026-07-05T08:00:00.000Z"]);
  });

  it("filters public consultation slots by requested day and time window", () => {
    const availability = consultationAvailabilitySchema.parse({
      ...defaultConsultationAvailability,
      minLeadHours: 0,
      bookingWindowDays: 3,
      slotDurationMinutes: 60,
      days: defaultConsultationAvailability.days.map((day) => ({
        ...day,
        enabled: day.weekday === 1,
        start: "10:00",
        end: "17:00",
        modes: ["ONLINE"]
      }))
    });

    const slots = generateConsultationSlots({
      availability,
      mode: "ONLINE",
      now: new Date("2026-07-05T05:00:00.000Z"),
      date: "2026-07-06",
      fromTime: "15:00",
      appointments: []
    });

    expect(slots.map((slot) => slot.startsAt)).toEqual(["2026-07-06T12:00:00.000Z", "2026-07-06T13:00:00.000Z"]);
  });

  it("allows secretaries with appointment management permission to manage consultation availability", () => {
    expect(canManageConsultationAvailability({ id: "staff-1", roleName: "Secretary", permissions: ["appointment.manage.any"] })).toBe(true);
    expect(canManageConsultationAvailability({ id: "client-1", roleName: "Client", permissions: [] })).toBe(false);
  });

  it("supports the unassigned consultation queue filter for admins", () => {
    const filters = adminConsultationListQuerySchema.parse({ assigned: "unassigned", status: "SCHEDULED" });
    expect(filters.assigned).toBe("unassigned");
  });
});
