"use client";

import { useEffect, useState } from "react";
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
  return <section className="min-w-0 space-y-4" aria-label={copy.scheduleTitle}>
    <h4 className="font-semibold">{copy.scheduleTitle}</h4>
    <p className="text-sm">{copy.cairo} · {availability.slotDurationMinutes} {copy.minutes}</p>
    {!!availability.weeklyHours.length && <details open className="rounded border border-kmt-gold/30 p-3 text-sm">
      <summary className="min-h-11 cursor-pointer font-semibold">{copy.weeklyTitle}</summary>
      <dl className="space-y-2">{availability.weeklyHours.map(day => <div key={day.weekday} className="flex flex-wrap justify-between gap-2">
        <dt>{bookingWeekdayLabel(day.weekday, locale)}</dt><dd>{day.hours ? `${bookingClockLabel(day.hours.start, locale)} – ${bookingClockLabel(day.hours.end, locale)}` : copy.closedDay}</dd>
      </div>)}</dl>
    </details>}
    {availability.nearestSlot && <div className="space-y-2 rounded border border-kmt-gold/40 bg-kmt-gold/5 p-3">
      <p className="text-sm font-semibold">{copy.nearestOne}</p>
      <p>{bookingDateLabel(bookingLocalDate(availability.nearestSlot.startsAt), locale)} · {bookingTimeLabel(availability.nearestSlot.startsAt, locale)}</p>
      <Button type="button" variant="outline" disabled={loading} onClick={onNearest}>{copy.chooseNearest}</Button>
    </div>}
    <fieldset className="min-w-0 space-y-3"><legend className="font-semibold">{copy.daysTitle}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleDays.map(day => <Button key={day.date} type="button" variant={day.date === date ? "primary" : "outline"}
        aria-pressed={day.date === date} className="h-auto flex-col items-start whitespace-normal p-3 text-start text-sm" onClick={() => onDate(day.date)}>
        <span className="flex flex-col gap-1"><span>{bookingDateLabel(day.date, locale)}</span><span className="text-xs leading-5">{copy.availabilityReasons[day.status]}</span></span>
      </Button>)}</div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>{copy.previousDays}</Button>
        <Button type="button" variant="ghost" disabled={(page + 1) * 7 >= availability.days.length} onClick={() => setPage(page + 1)}>{copy.nextDays}</Button>
      </div>
    </fieldset>
    {selected && !loading && <div role="status" aria-live="polite" className="space-y-2 text-sm">
      <p>{bookingDateLabel(selected.date, locale)}</p>
      {selected.hours && <p>{bookingClockLabel(selected.hours.start, locale)} – {bookingClockLabel(selected.hours.end, locale)} · {copy.cairo}</p>}
      {selected.closedPeriods.map((period, index) => <p key={index}>{copy.closedPeriods}: {bookingClockLabel(period.start, locale)} – {bookingClockLabel(period.end, locale)}</p>)}
      {selected.status !== "AVAILABLE" && <p>{copy.availabilityReasons[selected.status]}</p>}
    </div>}
    {!loading && slots.length > 0 && <fieldset className="min-w-0 space-y-2"><legend>{copy.dayTimes}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{slots.map(time => <label key={time.startsAt} className="flex min-h-11 cursor-pointer items-center gap-2 rounded border border-kmt-gold/30 p-3 text-sm">
        <input type="radio" name="direct-slot" className="size-4 !min-h-0 shrink-0 accent-kmt-gold" checked={slot?.startsAt === time.startsAt} onChange={() => onSlot(time)} />
        <span>{bookingTimeLabel(time.startsAt, locale)}</span>
      </label>)}</div>
    </fieldset>}
  </section>;
}
