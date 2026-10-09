"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { getPublicContent } from "@/content/public-content";
import type { PublicLocale } from "@/lib/public-locale";

export type DirectBooking = {
  confirmationSource: string; contactChannel: string; publicReference: string | null;
  fullName: string; phone: string | null; serviceCategory: string; status: string;
  appointments: Array<{ id: string; startsAt: string; endsAt: string; status: string; lawyer: { name: string } | null }>;
};
type Slot = { startsAt: string; endsAt: string };
const endpoint = "/api/public/assistant/conversation";
const field = "min-h-11 w-full min-w-0 rounded border border-kmt-gold/30 bg-transparent px-3";

export function DirectBookingPanel({ locale, revision, draft, booking, onRefresh }: {
  locale: PublicLocale; revision: number; draft: Record<string, string | null>;
  booking: DirectBooking | null; onRefresh: () => Promise<void>;
}) {
  const copy = directBookingCopy[locale];
  const [name, setName] = useState(draft.fullName ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [channel, setChannel] = useState("PHONE");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
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
  const requestedTime = useRef<string | null>(null);
  const slotRequest = useRef(0);
  const appointment = booking?.appointments[0];
  const cancelled = appointment?.status === "CANCELLED";
  const canEdit = !!appointment && ["SCHEDULED", "RESCHEDULED"].includes(appointment.status) && Date.parse(appointment.startsAt) > Date.now();
  const format = (time: string) => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(time));
  const service = getPublicContent(locale).legalServices.find(s => s.slug === draft.service)?.title;

  const load = useCallback(async () => {
    const request = ++slotRequest.current;
    setLoading(true); setLoaded(false); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify({ action: "booking_slots", ...(date ? { date } : {}) }) });
      const data = await response.json();
      if (request !== slotRequest.current) return;
      if (!response.ok) throw new Error();
      setSlots(data.data.slots); setLoaded(true);
      if (requestedTime.current) {
        const requested = data.data.slots.find((s: Slot) => Date.parse(s.startsAt) === Date.parse(requestedTime.current!));
        setSlot(requested ?? null); setConsent(false);
        if (!requested) setError(copy.conflict);
        requestedTime.current = null;
      }
    } catch { if (request === slotRequest.current) setError(copy.failed); }
    finally { if (request === slotRequest.current) setLoading(false); }
  }, [date, locale, copy.failed, copy.conflict]);
  useEffect(() => { if (!booking || editing) void load(); }, [load, booking, editing]);
  useEffect(() => { if (draft.fullName) setName(draft.fullName); if (draft.phone) setPhone(draft.phone); }, [draft.fullName, draft.phone]);
  useEffect(() => {
    if (draft.contactChannel) setChannel(draft.contactChannel);
    if (!booking && draft.requestedStartsAt && Number.isFinite(Date.parse(draft.requestedStartsAt))) {
      requestedTime.current = draft.requestedStartsAt;
      setDate(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(draft.requestedStartsAt)));
    }
  }, [draft.requestedStartsAt, draft.contactChannel, booking]);

  async function submit(action: string) {
    setBusy(true); setError("");
    pending.current ??= { action, key: crypto.randomUUID(), revision, confirmed: true,
      ...(!booking ? { fullName: name.trim(), phone: phone.trim(), contactChannel: channel } : {}),
      ...(slot && action !== "cancel_booking" ? { startsAt: slot.startsAt } : {}) };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify(pending.current) });
      if (!response.ok) {
        if (response.status < 500) pending.current = null;
        if (response.status === 409) { await onRefresh(); setSlot(null); setConsent(false); await load(); }
        setError(response.status === 409 ? copy.conflict : copy.failed); return;
      }
      await onRefresh(); pending.current = null; setEditing(false); setCancelling(false); setConsent(false); setSlot(null);
    } catch { setError(copy.failed); }
    finally { setBusy(false); }
  }
  function calendar() {
    if (!appointment) return;
    const stamp = (v: string) => new Date(v).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
    const data = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KMT Legal//Booking//EN", "BEGIN:VEVENT", `UID:${appointment.id}@kmtlegal.org`, `DTSTAMP:${stamp(new Date().toISOString())}`, `DTSTART:${stamp(appointment.startsAt)}`, `DTEND:${stamp(appointment.endsAt)}`, `SUMMARY:${copy.appointmentTitle}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
    const url = URL.createObjectURL(new Blob([data], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "kmt-appointment.ics"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-4" aria-busy={busy || loading}>
    <h3 className="text-lg font-semibold">{copy.title}</h3>
    {booking && <div className="space-y-3 rounded border border-kmt-gold/30 p-3">
      <p role="status">{cancelled ? copy.cancelled : appointment ? copy.confirmed : copy.callbackDone}</p>
      <p className="break-all">{copy.reference}: <bdi>{booking.publicReference}</bdi></p>
      {appointment && <><p>{format(appointment.startsAt)} — {copy.cairo}</p><p>{copy.lawyer}: {appointment.lawyer?.name}</p></>}
      <p>{booking.fullName} · <bdi>{booking.phone}</bdi></p><p>{booking.contactChannel === "WHATSAPP" ? copy.whatsapp : copy.phone}</p>
      {canEdit && !editing && !cancelling && <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={calendar}>{copy.calendar}</Button>
        <Button type="button" variant="outline" onClick={() => { setEditing(true); setConsent(false); }}>{copy.change}</Button>
        <Button type="button" variant="ghost" onClick={() => setCancelling(true)}>{copy.cancel}</Button>
      </div>}
      {cancelling && <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={() => void submit("cancel_booking")}>{copy.cancelConfirm}</Button><Button type="button" variant="ghost" disabled={busy || !!pending.current} onClick={() => setCancelling(false)}>{copy.keep}</Button></div>}
      <p className="text-sm leading-6">{copy.optionalAccount}</p><p className="text-sm leading-6">{copy.expired}</p>
    </div>}
    {(!booking || editing) && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(editing ? "reschedule_booking" : slot ? "confirm_booking" : "request_callback"); }}>
      <p className="text-sm leading-7">{copy.intro}</p>
      <fieldset disabled={busy || !!pending.current} className="min-w-0 space-y-4">
        {!booking && <label className="block space-y-2"><span>{copy.channel}</span><select aria-label={copy.channel} className={field} value={channel} onChange={e => { setChannel(e.target.value); setConsent(false); }}><option value="PHONE">{copy.phone}</option><option value="WHATSAPP">{copy.whatsapp}</option></select></label>}
        <label className="block space-y-2"><span>{copy.date}</span><input className={field} type="date" value={date} onChange={e => { setDate(e.target.value); setSlot(null); setConsent(false); }} /></label>
        {date && <Button type="button" variant="ghost" onClick={() => { setDate(""); setSlot(null); setConsent(false); }}>{copy.nearest}</Button>}
        {loading ? <p role="status">{copy.waiting}</p> : loaded && !slots.length ? <p>{copy.empty}</p> : <fieldset className="space-y-2"><legend>{copy.choose} · {copy.cairo}</legend>{slots.map(s => <label key={s.startsAt} className="flex min-h-11 cursor-pointer items-center gap-2 rounded border border-kmt-gold/30 p-3 text-sm"><input type="radio" name="direct-slot" checked={slot?.startsAt === s.startsAt} onChange={() => { setSlot(s); setConsent(false); }} /><span>{format(s.startsAt)}</span></label>)}</fieldset>}
        {!booking && <><label className="block space-y-2"><span>{copy.name}</span><input className={field} required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={e => { setName(e.target.value); setConsent(false); }} /></label><label className="block space-y-2"><span>{copy.number}</span><input className={field} required type="tel" dir="ltr" maxLength={24} autoComplete="tel" value={phone} onChange={e => { setPhone(e.target.value); setConsent(false); }} /></label></>}
        {(slot || (loaded && !slots.length && !editing)) && <div className="space-y-2 rounded border border-kmt-gold/30 p-3 text-sm leading-7">
          <p className="font-semibold">{copy.review}</p>{service && <p>{service}</p>}
          {slot ? <><p>{format(slot.startsAt)} · {copy.cairo}</p><p>{(Date.parse(slot.endsAt) - Date.parse(slot.startsAt)) / 60000} {copy.minutes}</p></> : <p>{copy.callback}</p>}
          <p>{booking?.fullName ?? name} · <bdi>{booking?.phone ?? phone}</bdi></p><p>{(booking?.contactChannel ?? channel) === "WHATSAPP" ? copy.whatsapp : copy.phone}</p>
          <label className="flex min-h-11 items-start gap-2"><input className="mt-2 size-5 shrink-0" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{copy.consent}</span></label>
        </div>}
      </fieldset>
      <Button className="h-auto min-h-11 whitespace-normal" type="submit" disabled={busy || loading || !consent || (!slot && (editing || !loaded || !!slots.length))}>{busy ? copy.waiting : pending.current ? copy.retry : slot ? copy.confirm : copy.callback}</Button>
      {editing && <Button type="button" variant="ghost" disabled={busy || !!pending.current} onClick={() => setEditing(false)}>{copy.keep}</Button>}
    </form>}
    {error && <p role="alert" className="text-sm leading-7">{error}</p>}
    {!loaded && !loading && (!booking || editing) && <Button type="button" variant="outline" onClick={() => void load()}>{copy.retry}</Button>}
  </div>;
}
