"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { getPublicContent } from "@/content/public-content";
import type { PublicLocale } from "@/lib/public-locale";
import type { BookingAvailability, BookingSlot } from "@/lib/direct-booking-availability";
import { BookingAvailabilityPicker } from "./booking-availability-picker";
import { conversationRequest, ConversationRequestError, type ConversationState } from "./conversation-request";

export type DirectBooking = {
  confirmationSource: string; contactChannel: string; publicReference: string | null;
  fullName: string; phone: string | null; serviceCategory: string; status: string;
  appointments: Array<{ id: string; startsAt: string; endsAt: string; status: string; lawyer: { name: string } | null }>;
};
type Slot = BookingSlot;
const field = "min-h-11 w-full min-w-0 rounded border border-kmt-gold/30 bg-transparent px-3";

export function DirectBookingPanel({ locale, revision, draft, booking, onRefresh, onState, onAccessFailure, footerContainer }: {
  locale: PublicLocale; revision: number; draft: Record<string, string | null>;
  booking: DirectBooking | null; onRefresh: () => Promise<void>;
  onState: (snapshot: ConversationState) => void; onAccessFailure: (error: unknown) => void;
  footerContainer?: HTMLElement | null;
}) {
  const copy = directBookingCopy[locale];
  const formId = useId();
  const [name, setName] = useState(draft.fullName ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [channel, setChannel] = useState("PHONE");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Preserve the exact request after an uncertain network result. A retry must not create a second booking.
  const pending = useRef<Record<string, unknown> | null>(null);
  const mutationInFlight = useRef(false);
  const requestedTime = useRef<string | null>(null);
  const slotRequest = useRef(0);
  const appointment = booking?.appointments[0];
  const cancelled = appointment?.status === "CANCELLED";
  const canEdit = !!appointment && ["SCHEDULED", "RESCHEDULED"].includes(appointment.status) && Date.parse(appointment.startsAt) > Date.now();
  const format = (time: string) => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(time));
  const compactTime = (time: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Cairo" }).format(new Date(time));
  const service = getPublicContent(locale).legalServices.find(s => s.slug === draft.service)?.title;
  const canCallback = loaded && !!availability && (!availability.published || !availability.hasAvailability) && !editing;
  const localDate = (time: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(time));
  const failureMessage = useCallback((failure: unknown) => {
    if (!(failure instanceof ConversationRequestError)) return copy.failed;
    if (failure.status === 401 || failure.status === 403) { onAccessFailure(failure); return copy.accessFailed; }
    if (failure.status === 429) return copy.rateLimited;
    if (failure.kind === "TIMEOUT") return copy.timedOut;
    if (failure.kind === "INVALID_RESPONSE") return copy.invalidResponse;
    return copy.failed;
  }, [copy, onAccessFailure]);

  const load = useCallback(async () => {
    const request = ++slotRequest.current;
    setLoading(true); setLoaded(false); setSlots([]); setError("");
    if (!pending.current) { setSlot(null); setConsent(false); }
    try {
      const result = await conversationRequest<BookingAvailability>({ action: "booking_slots", ...(date ? { date } : {}) }, locale);
      if (request !== slotRequest.current) return;
      setAvailability(result);
      if (!date && result.nearestSlot) { setDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(result.nearestSlot.startsAt))); return; }
      setSlots(result.slots); setLoaded(true);
      if (requestedTime.current) {
        const requested = result.slots.find((s: Slot) => Date.parse(s.startsAt) === Date.parse(requestedTime.current!));
        setSlot(requested ?? null); setConsent(false);
        if (!requested) setError(copy.conflict);
        requestedTime.current = null;
      }
    } catch (failure) { if (request === slotRequest.current) setError(failureMessage(failure)); }
    finally { if (request === slotRequest.current) setLoading(false); }
  }, [date, locale, failureMessage, copy.conflict]);
  useEffect(() => { if (!booking || editing) void load(); }, [load, booking, editing]);
  useEffect(() => { if (draft.fullName) setName(draft.fullName); if (draft.phone) setPhone(draft.phone); }, [draft.fullName, draft.phone]);
  useEffect(() => {
    if (draft.contactChannel) setChannel(draft.contactChannel);
    if (!booking && draft.requestedStartsAt && Number.isFinite(Date.parse(draft.requestedStartsAt))) {
      requestedTime.current = draft.requestedStartsAt;
      setDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(draft.requestedStartsAt)));
    }
  }, [draft.requestedStartsAt, draft.contactChannel, booking]);

  function chooseDate(next: string) {
    if (next === date) return;
    slotRequest.current += 1; requestedTime.current = null;
    setDate(next); setSlots([]); setLoaded(false); setSlot(null); setConsent(false); setError("");
  }
  function chooseNearest() {
    const nearest = availability?.nearestSlot;
    if (!nearest) return;
    if (date === localDate(nearest.startsAt)) { setSlot(nearest); setConsent(false); }
    else { chooseDate(localDate(nearest.startsAt)); requestedTime.current = nearest.startsAt; }
  }

  async function submit(action: string) {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBusy(true); setError("");
    pending.current ??= { action, key: crypto.randomUUID(), revision, confirmed: true,
      ...(!booking ? { fullName: name.trim(), phone: phone.trim(), contactChannel: channel } : {}),
      ...(slot && action !== "cancel_booking" ? { startsAt: slot.startsAt } : {}) };
    try {
      const snapshot = await conversationRequest<ConversationState>(pending.current, locale);
      onState(snapshot);
      pending.current = null; setEditing(false); setCancelling(false); setConsent(false); setSlot(null);
    } catch (failure) {
      if (failure instanceof ConversationRequestError && failure.status && failure.status < 500) pending.current = null;
      if (failure instanceof ConversationRequestError && failure.status === 409) {
        setSlot(null); setConsent(false);
        try { await onRefresh(); } catch (refreshFailure) { failureMessage(refreshFailure); }
        await load(); setError(copy.conflict);
      } else setError(failureMessage(failure));
    }
    finally { mutationInFlight.current = false; setBusy(false); }
  }
  function calendar() {
    if (!appointment) return;
    const stamp = (v: string) => new Date(v).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
    const data = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KMT Legal//Booking//EN", "BEGIN:VEVENT", `UID:${appointment.id}@kmtlegal.org`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(appointment.startsAt)}`, `DTEND:${stamp(appointment.endsAt)}`, `SUMMARY:${copy.appointmentTitle}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const url = URL.createObjectURL(new Blob([data], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "kmt-appointment.ics"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const footer = (!booking || editing) ? <><div className="consultation-footer-summary">{slot ? <><strong>{compactTime(slot.startsAt)}</strong>{copy.cairo}</> : canCallback ? copy.callback : copy.choose}</div><Button className="h-auto min-h-11 whitespace-normal" form={formId} type="submit" disabled={busy || loading || (!pending.current && (!loaded || !consent || (!slot && !canCallback)))}>{busy ? copy.waiting : pending.current ? copy.retry : canCallback && !slot ? copy.callback : copy.confirm}</Button>{editing && <Button type="button" variant="ghost" disabled={busy || !!pending.current} onClick={() => setEditing(false)}>{copy.keep}</Button>}</> : null;
  return <div className="consultation-booking" aria-busy={busy || loading}>
    <h3 className="sr-only">{copy.title}</h3>
    {booking && <div className="consultation-confirmation space-y-3">
      <p role="status">{cancelled ? copy.cancelled : appointment ? copy.confirmed : copy.callbackDone}</p>
      <p className="break-all">{copy.reference}: <bdi>{booking.publicReference}</bdi></p>
      {appointment && <><p>{format(appointment.startsAt)} — {copy.cairo}</p><p>{copy.lawyer}: {appointment.lawyer?.name}</p></>}
      <p>{booking.fullName} · <bdi>{booking.phone}</bdi></p><p>{booking.contactChannel === "WHATSAPP" ? copy.whatsapp : copy.phone}</p>
      {canEdit && !editing && !cancelling && <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={calendar}>{copy.calendar}</Button>
        <Button type="button" variant="outline" onClick={() => { chooseDate(localDate(appointment.startsAt)); setEditing(true); setConsent(false); }}>{copy.change}</Button>
        <Button type="button" variant="ghost" onClick={() => setCancelling(true)}>{copy.cancel}</Button>
      </div>}
      {cancelling && <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={() => void submit("cancel_booking")}>{copy.cancelConfirm}</Button><Button type="button" variant="ghost" disabled={busy || !!pending.current} onClick={() => setCancelling(false)}>{copy.keep}</Button></div>}
      <p className="text-sm leading-6">{copy.optionalAccount}</p><p className="text-sm leading-6">{copy.expired}</p>
    </div>}
    {(!booking || editing) && <form id={formId} className="space-y-5" onSubmit={event => { event.preventDefault(); void submit(editing ? "reschedule_booking" : slot ? "confirm_booking" : "request_callback"); }}>
      <fieldset disabled={busy || !!pending.current} className="min-w-0 space-y-5">
        {loading && <p role="status">{copy.waiting}</p>}
        {availability && <BookingAvailabilityPicker locale={locale} availability={availability} date={date || availability.selectedDay.date} slot={slot} loading={loading || !loaded} slots={loaded ? slots : []} onDate={chooseDate} onSlot={value => { setSlot(value); setConsent(false); }} onNearest={chooseNearest} />}
        {!booking && <section className="consultation-contacts"><h4>{copy.contactDetails}</h4><label className="block space-y-2"><span>{copy.name}</span><input className={field} required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={e => { setName(e.target.value); setConsent(false); }} /></label><label className="block space-y-2"><span>{copy.number}</span><input className={field} required type="tel" dir="ltr" maxLength={24} autoComplete="tel" value={phone} onChange={e => { setPhone(e.target.value); setConsent(false); }} /></label><label className="block space-y-2 consultation-channel"><span>{copy.channel}</span><select aria-label={copy.channel} className={field} value={channel} onChange={e => { setChannel(e.target.value); setConsent(false); }}><option value="PHONE">{copy.phone}</option><option value="WHATSAPP">{copy.whatsapp}</option></select></label></section>}
        {(slot || canCallback) && <div className="consultation-review space-y-2 text-sm leading-7">
          <p className="font-semibold">{copy.review}</p>{service && <p>{service}</p>}
          {slot ? <><p>{format(slot.startsAt)} · {copy.cairo}</p><p>{(Date.parse(slot.endsAt) - Date.parse(slot.startsAt)) / 60000} {copy.minutes}</p></> : <p>{copy.callback}</p>}
          <p>{booking?.fullName ?? name} · <bdi>{booking?.phone ?? phone}</bdi></p><p>{(booking?.contactChannel ?? channel) === "WHATSAPP" ? copy.whatsapp : copy.phone}</p>
          <label className="flex min-h-11 items-start gap-2"><input className="mt-2 size-5 shrink-0" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{copy.consent}</span></label>
        </div>}
      </fieldset>
    </form>}
    {footerContainer ? createPortal(footer, footerContainer) : <div className="consultation-dialog-actions">{footer}</div>}
    {error && <p role="alert" className="text-sm leading-7">{error}</p>}
    {!loaded && !loading && (!booking || editing) && <Button type="button" variant="outline" onClick={() => void load()}>{copy.retry}</Button>}
  </div>;
}
