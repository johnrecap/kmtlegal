export type BookingAvailabilityStatus = "AVAILABLE" | "CLOSED_WEEKLY" | "CLOSED_EXCEPTION" | "MODE_UNAVAILABLE" |
  "FULL" | "LEAD_TIME" | "OUTSIDE_WINDOW" | "UNPUBLISHED" | "NO_STAFF" | "NO_SLOTS" | "OUTSIDE_HOURS";
export type BookingSlot = { id: string; startsAt: string; endsAt: string; mode: "PHONE" };
export type BookingHours = { start: string; end: string };
export type BookingDay = {
  date: string; status: BookingAvailabilityStatus; hours: BookingHours | null; closedPeriods: BookingHours[];
};
export type BookingAvailability = {
  published: boolean; timezone: "Africa/Cairo"; now: string; slotDurationMinutes: number;
  weeklyHours: Array<{ weekday: number; enabled: boolean; hours: BookingHours | null }>;
  days: BookingDay[]; selectedDay: BookingDay; window: { startsOn: string; endsOn: string };
  slots: BookingSlot[]; nearestSlot: BookingSlot | null; suggestedSlots: BookingSlot[]; hasAvailability: boolean;
};

export function bookingDateLabel(date: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale, { timeZone: "Africa/Cairo", weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(`${date}T12:00:00Z`));
}
export function bookingLocalDate(time: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(time));
}
export function bookingTimeLabel(time: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale, { timeZone: "Africa/Cairo", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(time));
}
export function bookingClockLabel(clock: string, locale: "ar" | "en") {
  const [hour, minute] = clock.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}
export function bookingWeekdayLabel(weekday: number, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long" }).format(new Date(Date.UTC(2000, 0, 2 + weekday)));
}
