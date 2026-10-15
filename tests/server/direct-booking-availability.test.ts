import { describe, expect, it } from "vitest";
import { buildBookingAvailability, type BookingAvailabilitySnapshot } from "@/server/consultations/direct-booking-availability";
import { bookingAvailabilityToolResult } from "@/server/consultations/booking-availability-tool";
import { cairoDateString, defaultConsultationAvailability } from "@/server/consultations/consultation-availability-service";
import { bookingLocalDate } from "@/lib/direct-booking-availability";

const date = "2026-10-16";
function snapshot(): BookingAvailabilitySnapshot {
  const availability = structuredClone(defaultConsultationAvailability);
  availability.minLeadHours = 0;
  availability.days = availability.days.map(day => ({ ...day, enabled: true, start: "10:00", end: "13:00", modes: ["PHONE"] }));
  availability.directBooking = { published: true, closures: [], roster: availability.days.map(day => ({ weekday: day.weekday, lawyerIds: ["lawyer-private"] })) };
  return { availability, now: new Date("2026-10-15T05:00:00Z"), lawyers: [{ id: "lawyer-private" }], appointments: [] };
}
const busy = { type: "CONSULTATION", lawyerId: null, startsAt: new Date("2026-10-16T07:00:00Z"), endsAt: new Date("2026-10-16T10:00:00Z") };

describe("shared consultation availability", () => {
  it.each([
    ["weekly closure", "CLOSED_WEEKLY", (s: BookingAvailabilitySnapshot) => { s.availability.days[5].enabled = false; }],
    ["exceptional closure", "CLOSED_EXCEPTION", (s: BookingAvailabilitySnapshot) => { s.availability.directBooking.closures.push({ date, start: "10:00", end: "13:00", lawyerId: null }); }],
    ["office appointments", "FULL", (s: BookingAvailabilitySnapshot) => { s.appointments.push(busy); }],
    ["lawyer appointments", "FULL", (s: BookingAvailabilitySnapshot) => { s.appointments.push({ ...busy, type: "HEARING", lawyerId: "lawyer-private" }); }],
    ["missing staff", "NO_STAFF", (s: BookingAvailabilitySnapshot) => { s.lawyers = []; }],
    ["different mode", "MODE_UNAVAILABLE", (s: BookingAvailabilitySnapshot) => { s.availability.days[5].modes = ["OFFICE"]; }],
    ["unpublished", "UNPUBLISHED", (s: BookingAvailabilitySnapshot) => { s.availability.directBooking.published = false; }],
    ["lead time", "LEAD_TIME", (s: BookingAvailabilitySnapshot) => { s.availability.minLeadHours = 30; }],
    ["elapsed day", "LEAD_TIME", (s: BookingAvailabilitySnapshot) => { s.now = new Date("2026-10-16T10:30:00Z"); }],
    ["mixed absence", "NO_SLOTS", (s: BookingAvailabilitySnapshot) => {
      s.availability.directBooking.closures.push({ date, start: "10:00", end: "11:00", lawyerId: null });
      s.appointments.push({ ...busy, startsAt: new Date("2026-10-16T08:00:00Z") });
    }]
  ] as const)("explains %s without inventing a holiday", (_name, status, modify) => {
    const source = snapshot(); modify(source);
    const result = buildBookingAvailability(source, { date });
    expect(result.selectedDay.status).toBe(status);
    expect(result.slots).toEqual([]);
    expect(JSON.stringify(result)).not.toContain("lawyer-private");
    if (status === "UNPUBLISHED") expect(result.weeklyHours).toEqual([]);
    else if (result.nearestSlot) expect(cairoDateString(new Date(result.nearestSlot.startsAt)) > date).toBe(true);
  });

  it("keeps partial closure gaps, sorts slots, and finds a later time without replacing the requested day", () => {
    const source = snapshot();
    source.availability.directBooking.closures.push({ date, start: "10:00", end: "11:00", lawyerId: null });
    const result = buildBookingAvailability(source, { date });
    expect(result.slots.map(slot => slot.startsAt)).toEqual(["2026-10-16T08:00:00.000Z", "2026-10-16T09:00:00.000Z"]);
    expect(result.selectedDay).toMatchObject({ date, status: "AVAILABLE", hours: { start: "10:00", end: "13:00" }, closedPeriods: [{ start: "10:00", end: "11:00" }] });
    expect(result.nearestSlot).toEqual(result.slots[0]);
    const outside = buildBookingAvailability(source, { date, fromTime: "14:00" });
    expect(outside.selectedDay).toMatchObject({ date, status: "OUTSIDE_HOURS" });
    expect(cairoDateString(new Date(outside.nearestSlot!.startsAt))).toBe("2026-10-17");
  });

  it("does not attribute overlapping blocking causes to a holiday or full calendar", () => {
    const source = snapshot(); source.appointments.push(busy);
    source.availability.directBooking.closures.push({ date, start: "10:00", end: "13:00", lawyerId: null });
    expect(buildBookingAvailability(source, { date }).selectedDay.status).toBe("NO_SLOTS");
    source.availability.directBooking.closures = []; source.availability.minLeadHours = 30;
    expect(buildBookingAvailability(source, { date }).selectedDay.status).toBe("NO_SLOTS");
  });

  it("filters times and validates impossible ranges and dates", () => {
    const source = snapshot();
    expect(buildBookingAvailability(source, { date, fromTime: "11:00", toTime: "12:00" }).slots.map(slot => slot.startsAt)).toEqual(["2026-10-16T08:00:00.000Z"]);
    const shortRange = buildBookingAvailability(source, { date, fromTime: "10:00", toTime: "10:30" });
    expect(shortRange.selectedDay.status).toBe("NO_SLOTS");
    expect(shortRange.slots).toEqual([]);
    expect(shortRange.nearestSlot?.startsAt).toBe("2026-10-16T08:00:00.000Z");
    for (const filter of [{ date: "2026-02-31" }, { date, fromTime: "25:00" }, { date, fromTime: "12:00", toTime: "11:00" }]) {
      expect(() => buildBookingAvailability(source, filter)).toThrow();
    }
    for (const target of ["2026-10-14", "2026-11-15"]) expect(buildBookingAvailability(source, { date: target }).selectedDay.status).toBe("OUTSIDE_WINDOW");
    expect(buildBookingAvailability(source, { date: "2026-11-15" }).nearestSlot).toBeNull();
  });

  it("uses the configured interval rather than rounding times to a new grid", () => {
    const source = snapshot(); source.availability.slotDurationMinutes = 30;
    source.availability.days[5].start = "10:10";
    const result = buildBookingAvailability(source, { date });
    expect(result.slots.slice(0, 3).map(slot => slot.startsAt)).toEqual(["2026-10-16T07:10:00.000Z", "2026-10-16T07:40:00.000Z", "2026-10-16T08:10:00.000Z"]);
  });

  it("preserves the exact existing lead-time/window bounds even beyond 62 days", () => {
    const source = snapshot(); source.availability.minLeadHours = 168; source.availability.bookingWindowDays = 60;
    const result = buildBookingAvailability(source, { date: "2026-12-20" });
    expect(result.selectedDay.status).toBe("AVAILABLE");
    const earliest = source.now.getTime() + 168 * 3600000, latest = earliest + 60 * 86400000;
    expect(result.slots.every(slot => Date.parse(slot.startsAt) >= earliest && Date.parse(slot.startsAt) < latest)).toBe(true);
    expect(result.window.endsOn).toBe(cairoDateString(new Date(latest - 1)));
  });

  it.each([
    ["2026-04-24", "2026-04-23T18:00:00Z", "00:00", "03:00", ["2026-04-23T22:00:00.000Z", "2026-04-23T23:00:00.000Z"]],
    ["2026-10-29", "2026-10-29T18:00:00Z", "22:00", "24:00", ["2026-10-29T19:00:00.000Z", "2026-10-29T20:00:00.000Z"]]
  ] as const)("respects Cairo transitions on %s without duplicate or shifted appointments", (day, now, start, end, expected) => {
    const source = snapshot(); source.now = new Date(now);
    source.availability.days = source.availability.days.map(d => ({ ...d, start, end }));
    const result = buildBookingAvailability(source, { date: day });
    expect(result.slots.map(slot => slot.startsAt)).toEqual(expected);
    expect(new Set(result.slots.map(slot => slot.startsAt)).size).toBe(result.slots.length);
    expect(bookingLocalDate(result.nearestSlot!.startsAt)).toBe(day);
  });

  it.each(["ar", "en"] as const)("shares compact localized facts with chat (%s)", locale => {
    const source = snapshot(); source.availability.days[5].enabled = false;
    const result = buildBookingAvailability(source, { date });
    const nearest = bookingAvailabilityToolResult(result, locale, false);
    const alternatives = bookingAvailabilityToolResult(result, locale, true);
    expect(nearest.requestedDay.status).toBe("CLOSED_WEEKLY");
    expect(nearest.nearestSlot?.startsAt).toBe(result.nearestSlot?.startsAt);
    expect(nearest.suggestions).toHaveLength(1);
    expect(alternatives.suggestions).toHaveLength(3);
    expect(nearest.nearestSlot?.dateLabel).toBeTruthy(); expect(nearest.nearestSlot?.timeLabel).toBeTruthy();
    expect(JSON.stringify(alternatives).length).toBeLessThan(20000);
    expect(nearest).not.toHaveProperty("days");
    expect(JSON.stringify(nearest)).not.toContain("lawyer-private");
  });
});
