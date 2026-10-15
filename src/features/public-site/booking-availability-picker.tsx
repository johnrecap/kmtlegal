"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { bookingClockLabel, bookingDateLabel, bookingLocalDate, bookingTimeLabel, bookingWeekdayLabel, type BookingAvailability, type BookingSlot } from "@/lib/direct-booking-availability";
import type { PublicLocale } from "@/lib/public-locale";

export function BookingAvailabilityPicker({ locale, availability, date, slot, loading, slots, onDate, onSlot, onNearest }: {
  locale: PublicLocale; availability: BookingAvailability; date: string; slot: BookingSlot | null;
  loading: boolean; slots: BookingSlot[]; onDate: (date: string) => void; onSlot: (slot: BookingSlot) => void; onNearest: () => void;
}) {
  const copy = directBookingCopy[locale];
  const [page, setPage] = useState(0);
  useEffect(() => {
    const index = availability.days.findIndex(day => day.date === date);
    if (index >= 0) setPage(Math.floor(index / 7));
  }, [date, availability.days]);
  const visibleDays = availability.days.slice(page * 7, page * 7 + 7);
  const selected = availability.selectedDay.date === date ? availability.selectedDay : null;
  const dayLabel = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: "Africa/Cairo" }).format(new Date(value + "T12:00:00Z"));
  return <section className="consultation-availability" aria-label={copy.scheduleTitle}>
    <h4 className="sr-only">{copy.scheduleTitle}</h4>
    {!!availability.weeklyHours.length && <details className="consultation-weekly">
      <summary><span>{copy.weeklyTitle}</span><span>{availability.slotDurationMinutes} {copy.minutes} · {copy.cairo}</span></summary>
      <dl className="space-y-2">{availability.weeklyHours.map(day => <div key={day.weekday} className="flex flex-wrap justify-between gap-2">
        <dt>{bookingWeekdayLabel(day.weekday, locale)}</dt><dd>{day.hours ? `${bookingClockLabel(day.hours.start, locale)} – ${bookingClockLabel(day.hours.end, locale)}` : copy.closedDay}</dd>
      </div>)}</dl>
    </details>}
    {availability.nearestSlot && <div className="consultation-nearest">
      <div><p className="consultation-eyebrow">{copy.nearestOne}</p>
      <p>{dayLabel(bookingLocalDate(availability.nearestSlot.startsAt), { weekday: "short", day: "numeric" })} · {bookingTimeLabel(availability.nearestSlot.startsAt, locale)}</p></div>
      <Button type="button" variant="outline" disabled={loading} onClick={onNearest} trailingIcon={<Check aria-hidden="true" />}>{copy.chooseNearest}</Button>
    </div>}
    <fieldset className="min-w-0"><legend className="sr-only">{copy.daysTitle}</legend>
      <div className="consultation-date-heading"><span>{visibleDays[0] && dayLabel(visibleDays[0].date, { month: "long", year: "numeric" })}</span><div>
        <Button type="button" variant="ghost" aria-label={copy.previousDays} disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden="true" /></Button>
        <Button type="button" variant="ghost" aria-label={copy.nextDays} disabled={(page + 1) * 7 >= availability.days.length} onClick={() => setPage(page + 1)}><ChevronRight aria-hidden="true" /></Button>
      </div></div>
      <div className="consultation-days">{visibleDays.map(day => <Button key={day.date} type="button" variant={day.date === date ? "primary" : "outline"}
        aria-label={`${bookingDateLabel(day.date, locale)} · ${copy.availabilityReasons[day.status]}`} aria-pressed={day.date === date} className="consultation-date" onClick={() => onDate(day.date)}>
        <span className="consultation-weekday">{dayLabel(day.date, { weekday: "short" })}</span><span className="consultation-date-number">{dayLabel(day.date, { day: "numeric" })}</span><span className="consultation-date-status">{copy.compactDays[day.status]}</span>
      </Button>)}</div>
    </fieldset>
    <label className="consultation-direct-date"><span>{copy.date}</span><input type="date" value={date} min={availability.window.startsOn} max={availability.window.endsOn} onChange={event => onDate(event.target.value)} /></label>
    {selected && !loading && (selected.status !== "AVAILABLE" || !!selected.closedPeriods.length) && <div role="status" aria-live="polite" className="consultation-day-reason space-y-2 text-sm">
      <p>{bookingDateLabel(selected.date, locale)}</p>
      {selected.hours && <p>{bookingClockLabel(selected.hours.start, locale)} – {bookingClockLabel(selected.hours.end, locale)} · {copy.cairo}</p>}
      {selected.closedPeriods.map((period, index) => <p key={index}>{copy.closedPeriods}: {bookingClockLabel(period.start, locale)} – {bookingClockLabel(period.end, locale)}</p>)}
      {selected.status !== "AVAILABLE" && <p>{copy.availabilityReasons[selected.status]}</p>}
    </div>}
    {!loading && slots.length > 0 && <fieldset className="min-w-0 space-y-3"><legend className="consultation-time-title">{copy.dayTimes} · {dayLabel(date, { weekday: "short", day: "numeric" })}</legend>
      <div className="consultation-times">{slots.map(time => <label key={time.startsAt} className="consultation-time">
        <input type="radio" name="direct-slot" className="size-4 !min-h-0 shrink-0 accent-kmt-gold" checked={slot?.startsAt === time.startsAt} onChange={() => onSlot(time)} />
        <span>{bookingTimeLabel(time.startsAt, locale)}</span>
      </label>)}</div>
      <p className="consultation-selection-hint">{copy.selectionHint}</p>
    </fieldset>}
  </section>;
}
