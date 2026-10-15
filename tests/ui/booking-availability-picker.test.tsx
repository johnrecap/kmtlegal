// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BookingAvailabilityPicker } from "@/features/public-site/booking-availability-picker";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { fixtureBookingAvailability } from "../e2e/helpers/booking-availability";
import { bookingDateLabel } from "@/lib/direct-booking-availability";

afterEach(cleanup);
for (const locale of ["ar", "en"] as const) it(`${locale}: preserves explicit date/time selection and explains a closed day`, () => {
  const availability = fixtureBookingAvailability({ start: "2026-10-18T07:00:00Z" });
  const copy = directBookingCopy[locale], onDate = vi.fn(), onSlot = vi.fn(), onNearest = vi.fn();
  const props = { locale, availability, date: availability.selectedDay.date, slot: null, loading: false, slots: availability.slots, onDate, onSlot, onNearest };
  const { rerender } = render(<BookingAvailabilityPicker {...props} />);
  fireEvent.click(screen.getByRole("button", { name: copy.chooseNearest }));
  expect(onNearest).toHaveBeenCalledOnce(); expect(onSlot).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("radio"));
  expect(onSlot).toHaveBeenCalledWith(availability.slots[0]);
  const next = availability.days[1].date;
  fireEvent.click(screen.getByRole("button", { name: new RegExp(bookingDateLabel(next, locale)) }));
  expect(onDate).toHaveBeenCalledWith(next);
  const closed = { ...availability.selectedDay, status: "CLOSED_WEEKLY" as const, hours: null };
  rerender(<BookingAvailabilityPicker {...props} availability={{ ...availability, selectedDay: closed }} slots={[]} />);
  expect(screen.getByRole("status")).toHaveTextContent(copy.availabilityReasons.CLOSED_WEEKLY);
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.callback })).not.toBeInTheDocument();
});
