import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/prisma";
import { GET } from "@/app/api/public/consultations/slots/route";
import { publicBookingAvailabilityPreferenceFromMessage, publicConsultationAssistantSchema } from "@/server/consultations/consultation-assistant-service";
import { assertPublicConsultationSlotAvailable, consultationAvailabilitySchema, defaultConsultationAvailability, generateConsultationSlots } from "@/server/consultations/consultation-availability-service";
vi.mock("@/server/payments/payment-service", () => ({ expireOpenConsultationPaymentAttempts: vi.fn() }));
const availability = { ...defaultConsultationAvailability, slotDurationMinutes: 15, minLeadHours: 0, bookingWindowDays: 60, days: defaultConsultationAvailability.days.map(day => ({ ...day, enabled: true, start: "00:00", end: "24:00" })) };
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma.systemSetting, "findUnique").mockResolvedValue({ value: availability } as never);
  vi.spyOn(prisma.appointment, "findMany").mockResolvedValue([]);
});
describe("batch4 availability regressions", () => {
  it.each(["Book on 2026-13-01", "موعد يوم ٢٠٢٦-٠٢-٣١"])("does not retain impossible chat date: %s", message => {
    expect(publicBookingAvailabilityPreferenceFromMessage(message).date).toBe("");
  });
  it("preserves trimmed and empty availability draft fields", () => {
    const parsed=publicConsultationAssistantSchema.parse({locale:"en",message:"Book",draft:{availabilityPreference:{date:" 2026-09-20 ",fromTime:" 12:00 ",toTime:" ",label:" ",timeWindow:""}}});
    expect(parsed.draft?.availabilityPreference).toEqual({date:"2026-09-20",fromTime:"12:00",toTime:"",label:"",timeWindow:""});
  });
  it("confirms a date-filtered slot beyond the first 500 without expanding the list cap", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const early = generateConsultationSlots({ availability, appointments: [], now, limit: 500 });
    const shown = generateConsultationSlots({ availability, appointments: [], now, date: "2026-02-10", limit: 1 })[0];
    expect(early).toHaveLength(500);
    expect(early.some(slot => slot.id === shown.id)).toBe(false);
    await expect(assertPublicConsultationSlotAvailable({ startsAt: new Date(shown.startsAt), mode: "ONLINE", now })).resolves.toEqual(shown);
  });
  it.each(["2026-13-01", "2026-02-31", "2025-02-29"])("rejects impossible public date %s with 400", async date => {
    const response = await GET(new Request(`http://localhost/api/public/consultations/slots?date=${date}`));
    expect(response.status).toBe(400);
  });
  it.each(["fromTime=25:90", "fromTime=24:00", "toTime=24:01", "toTime=12:60"])("rejects impossible public time %s with 400", async query => {
    expect((await GET(new Request(`http://localhost/api/public/consultations/slots?${query}`))).status).toBe(400);
  });
  it.each(["25:90", "24:00", "12:60"])("rejects invalid working-day start %s", start => {
    expect(consultationAvailabilitySchema.safeParse({ ...availability, days: availability.days.map(day => ({ ...day, start })) }).success).toBe(false);
  });
  it.each(["25:90", "24:01", "12:60"])("rejects invalid working-day end %s", end => {
    expect(consultationAvailabilitySchema.safeParse({ ...availability, days: availability.days.map(day => ({ ...day, end })) }).success).toBe(false);
  });
  it("keeps midnight start and 24:00 end including valid leap day", async () => {
    expect(consultationAvailabilitySchema.safeParse(availability).success).toBe(true);
    const slots = generateConsultationSlots({ availability, appointments: [], now: new Date("2028-02-28T00:00:00Z"), date: "2028-02-29", fromTime: "23:45", toTime: "24:00", limit: 1 });
    expect(slots).toHaveLength(1);
    expect(slots[0].endsAt).toBe("2028-02-29T22:00:00.000Z");
  });
});
