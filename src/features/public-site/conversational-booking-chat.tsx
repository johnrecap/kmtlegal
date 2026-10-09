"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { conversationCopy } from "@/content/conversation-copy";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { getPublicContent } from "@/content/public-content";
import type { PublicLocale } from "@/lib/public-locale";

type State = {
  dialogue: { mode: "INQUIRY" | "BOOKING"; offerShown: boolean; consentAt: string | null; accountAccess: boolean };
  draft: Record<string, string | null>; revision: number; accountReady: boolean; humanOwned: boolean; submitted: boolean;
  turns: Array<{ messageId: string; userText: string; assistantText: string | null; status: string; createdAt?: string; updatedAt?: string }>;
  staffMessages?: Array<{ id: string; body: string; createdAt: string }>;
  closed?: boolean;
};
const endpoint = "/api/public/assistant/conversation";

export function ConversationalBookingChat({ locale, initialService }: { locale: PublicLocale; initialService?: string }) {
  const copy = conversationCopy[locale];
  const policy = assistantPolicyCopy[locale];
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<State | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ messageId: string; message: string } | null>(null);
  const booking = state?.dialogue?.mode === "BOOKING" && !!state.dialogue.consentAt;
  const interactive = !state?.humanOwned && !state?.closed && !state?.submitted;
  const showPanel = !!state?.submitted || (interactive && (booking || !!state?.dialogue?.accountAccess));

  async function changeMode(mode: "begin_booking" | "return_inquiry" | "account_access") {
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    if (await action({ action: mode })) {
      setNotice(mode === "begin_booking" ? policy.bookingStarted : mode === "return_inquiry" ? policy.returned : policy.accountOpened);
      requestAnimationFrame(() => (mode === "return_inquiry" ? messageInput.current : panelHeading.current)?.focus());
    }
  }

  async function action(body: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload.error?.code;
        setNotice(code === "AUTH_REQUIRED" ? copy.loginRequired : code === "CONFLICT" || code === "APPOINTMENT_CONFLICT" ? copy.changed : code === "VALIDATION_ERROR" ? copy.needDetails : copy.unavailable);
        return false;
      }
      if (body.action === "verify") { setNotice(copy.emailSent); return true; }
      const refreshed = body.action === "submit" || body.action === "attach"
        ? await fetch(endpoint, { cache: "no-store" }).then(async value => { if (!value.ok) throw new Error(); return value.json(); }) : payload;
      setState(refreshed.data);
      setConfirmed(false);
      return true;
    } catch { setNotice(copy.unavailable); return false; }
    finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json();
      if (active) setState(payload.data);
    }).catch(() => { if (active) setNotice(copy.unavailable); });
    return () => { active = false; };
  }, [copy.unavailable]);

  useEffect(() => {
    if (!state?.humanOwned) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetch(endpoint, { cache: "no-store" }).then(async response => {
        if (response.ok) setState((await response.json()).data);
      }).catch(() => {});
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [state?.humanOwned]);

  async function send(value = pendingMessage) {
    const next = value ?? { messageId: crypto.randomUUID(), message: message.trim() };
    if (!next.message) return;
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    setPendingMessage(next);
    if (await action({ action: "message", ...next, locale })) { setPendingMessage(null); setMessage(""); }
  }

  return <section aria-label={copy.title} className={`mx-auto grid w-full min-w-0 max-w-5xl gap-6 text-[var(--kmt-public-text)] ${showPanel ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}`} dir={locale === "ar" ? "rtl" : "ltr"}>
    <div className="min-w-0 space-y-4 rounded-xl border border-kmt-gold/25 p-4 sm:p-6">
      <h2 className="font-display text-xl">{copy.title}</h2>
      <p className="text-sm leading-7">{copy.introduction}</p>
      {!booking && interactive && <p className="text-sm leading-7">{policy.inquiry}</p>}
      <div role="log" aria-live="polite" aria-relevant="additions" className="max-h-[55dvh] space-y-4 overflow-y-auto overscroll-contain">
        {[
          ...(state?.turns.flatMap((turn, index) => [
            { id: `${turn.messageId}-user`, body: turn.userText, type: "user", at: turn.createdAt ? Date.parse(turn.createdAt) : index * 2 },
            ...(turn.assistantText ? [{ id: `${turn.messageId}-assistant`, body: turn.assistantText, type: "assistant", at: turn.updatedAt ? Date.parse(turn.updatedAt) : index * 2 + 1 }] : [])
          ]) ?? []),
          ...(state?.staffMessages?.map(item => ({ id: item.id, body: item.body, type: "staff", at: Date.parse(item.createdAt) })) ?? [])
        ].sort((a, b) => a.at - b.at).map(item => <div key={item.id} className={item.type === "user" ? "ms-6 rounded-lg bg-kmt-gold/10 p-3" : "me-6 rounded-lg border border-kmt-gold/30 p-3"}>
          {item.type === "staff" && <p className="mb-2 text-xs font-semibold">{copy.staff}</p>}<p className="whitespace-pre-wrap break-words" dir="auto">{item.body}</p>
        </div>)}
      </div>
      {state?.humanOwned && <p role="status" className="text-sm leading-7">{state.closed ? copy.closed : copy.handoff}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(null); }} className="space-y-3">
        <label htmlFor="kmt-chat-message" className="block text-sm">{copy.message}</label>
        <textarea ref={messageInput} id="kmt-chat-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} rows={3} disabled={busy} className="w-full rounded border border-kmt-gold/30 bg-transparent p-3" dir="auto" />
        <Button disabled={busy || state?.closed || !message.trim()} type="submit">{busy ? copy.waiting : copy.send}</Button>
        {pendingMessage && !busy && <Button type="button" variant="outline" onClick={() => void send()}>{copy.retry}</Button>}
      </form>
      {notice && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {interactive && <div className="flex flex-wrap gap-2">
        <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="outline" disabled={busy} onClick={() => void changeMode(booking ? "return_inquiry" : "begin_booking")}>{booking ? policy.back : policy.begin}</Button>
        {!booking && !state?.dialogue?.accountAccess && !state?.accountReady && <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="ghost" disabled={busy} onClick={() => void changeMode("account_access")}>{policy.account}</Button>}
      </div>}
      {!showPanel && state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      <a href={publicOfficeProfile.whatsappHref} className="inline-flex min-h-11 items-center underline">{copy.whatsapp}</a>
      {(state?.submitted || state?.closed) && <Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingMessage(null); void action({ action: "restart", locale }); }}>{copy.newConversation}</Button>}
    </div>
    {showPanel && <aside className="min-w-0 space-y-4 rounded-xl border border-kmt-gold/25 p-4">
      <h2 ref={panelHeading} tabIndex={-1} className="font-display text-xl">{booking || state?.submitted ? copy.review : policy.account}</h2>
      {(booking || state?.submitted) && <><p className="text-sm leading-7">{copy.reviewNote}</p>
      <dl className="space-y-3 text-sm">{Object.entries(state?.draft ?? {}).filter(([, value]) => value).map(([key, value]) => <div key={key}>
        <dt className="font-semibold">{copy.fields[key as keyof typeof copy.fields]}</dt>
        <dd className="break-words whitespace-pre-wrap leading-6" dir={key === "email" || key === "phone" ? "ltr" : undefined}>{key === "service" ? getPublicContent(locale).legalServices.find(service => service.slug === value)?.title ?? value : key === "preferredMode" ? copy.modes[value as keyof typeof copy.modes] : key === "requestedStartsAt" && value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(value)) : value}</dd>
      </div>)}</dl></>}
      {!state?.accountReady && interactive && <div className="space-y-3 border-t border-kmt-gold/20 pt-4">
        <label htmlFor="kmt-account-email" className="block text-sm">{copy.email}</label>
        <input type="email" id="kmt-account-email" autoComplete="email" dir="ltr" value={email} onChange={event => setEmail(event.target.value)} className="min-h-11 w-full rounded border border-kmt-gold/30 bg-transparent px-3" />
        {booking && <Button type="button" disabled={busy || !state || !email} onClick={() => void action({ action: "verify", email, purpose: "ACTIVATE" })}>{copy.verify}</Button>}
        <Button type="button" variant="ghost" disabled={busy || !state || !email} onClick={() => void action({ action: "verify", email, purpose: "RECOVER" })}>{copy.recover}</Button>
        <Link className="flex min-h-11 items-center underline" href={`/login?locale=${locale}&next=${encodeURIComponent(locale === "ar" ? "/ar/book-consultation" : "/book-consultation")}`}>{copy.signIn}</Link>
        <Button type="button" variant="outline" disabled={busy || !state} onClick={() => void action({ action: "attach" })}>{copy.attach}</Button>
      </div>}
      {state?.submitted ? <p role="status">{copy.submitted}</p> : booking && <div className="space-y-3">
        <label className="flex min-h-11 items-start gap-2 text-sm leading-6"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 size-5 shrink-0" />{copy.consent}</label>
        <Button type="button" disabled={busy || !state?.accountReady || !confirmed} onClick={() => void action({ action: "submit", revision: state?.revision, confirmed: true })}>{copy.submit}</Button>
      </div>}
      {state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
    </aside>}
  </section>;
}
