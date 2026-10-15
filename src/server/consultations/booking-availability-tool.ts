import { directBookingCopy } from "@/content/direct-booking-copy";
import { bookingClockLabel, bookingDateLabel, bookingTimeLabel, bookingWeekdayLabel, type BookingAvailability, type BookingSlot } from "@/lib/direct-booking-availability";
import { cairoDateString } from "./consultation-availability-service";

/** Keep the tool result compact; the full calendar belongs in the booking panel. */
export function bookingAvailabilityToolResult(result: BookingAvailability, locale: "ar" | "en", alternatives: boolean) {
  const copy = directBookingCopy[locale];
  const describe = (slot: BookingSlot) => ({ ...slot, dateLabel: bookingDateLabel(cairoDateString(new Date(slot.startsAt)), locale), timeLabel: bookingTimeLabel(slot.startsAt, locale) });
  const suggestions = result.suggestedSlots.slice(0, alternatives ? 3 : 1).map(describe);
  return {
    published: result.published, timezone: result.timezone, now: result.now, slotDurationMinutes: result.slotDurationMinutes,
    scheduleTitle: copy.scheduleTitle, hasAvailability: result.hasAvailability,
    weeklyHours: result.weeklyHours.map(day => ({ day: bookingWeekdayLabel(day.weekday, locale), hours: day.hours ? `${bookingClockLabel(day.hours.start, locale)} – ${bookingClockLabel(day.hours.end, locale)}` : copy.closedDay })),
    requestedDay: { ...result.selectedDay, dateLabel: bookingDateLabel(result.selectedDay.date, locale), reason: copy.availabilityReasons[result.selectedDay.status],
      hoursLabel: result.selectedDay.hours ? `${bookingClockLabel(result.selectedDay.hours.start, locale)} – ${bookingClockLabel(result.selectedDay.hours.end, locale)}` : null,
      closedPeriods: result.selectedDay.closedPeriods.map(period => ({ ...period, label: `${bookingClockLabel(period.start, locale)} – ${bookingClockLabel(period.end, locale)}` })) },
    nearestSlot: result.nearestSlot ? describe(result.nearestSlot) : null, suggestions
  };
}
