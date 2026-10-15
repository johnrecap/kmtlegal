import type { BookingAvailability } from "../../../src/lib/direct-booking-availability";

export function fixtureBookingAvailability(input: { start?: string; end?: string; date?: string; published?: boolean } = {}): BookingAvailability {
  const start = input.start ?? new Date(Date.now() + 3 * 86400000).toISOString();
  const end = input.end ?? new Date(Date.parse(start) + 3600000).toISOString();
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(start));
  const published = input.published ?? true;
  const slot = { id: "fixture-slot", startsAt: start, endsAt: end, mode: "PHONE" as const };
  const days = Array.from({ length: 7 }, (_, offset) => ({ date: new Date(Date.parse(date + "T12:00:00Z") + offset * 86400000).toISOString().slice(0, 10),
    status: published ? "AVAILABLE" as const : "UNPUBLISHED" as const, hours: published ? { start: "00:00", end: "24:00" } : null, closedPeriods: [] }));
  return { published, timezone: "Africa/Cairo", now: new Date().toISOString(), slotDurationMinutes: 60,
    weeklyHours: published ? Array.from({ length: 7 }, (_, weekday) => ({ weekday, enabled: true, hours: { start: "00:00", end: "24:00" } })) : [],
    days, selectedDay: { ...days[0], date: input.date ?? date }, window: { startsOn: days[0].date, endsOn: days[6].date },
    slots: published ? [slot] : [], nearestSlot: published ? slot : null, suggestedSlots: published ? [slot] : [], hasAvailability: published };
}
