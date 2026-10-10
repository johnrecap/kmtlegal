"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { conversationCopy } from "@/content/conversation-copy";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { DirectBookingPanel, type DirectBooking } from "./direct-booking-panel";
import type { PublicLocale } from "@/lib/public-locale";

type State = {
  locale: PublicLocale; handoffState: "NONE" | "QUEUED" | "CLAIMED"; booking: DirectBooking | null;
  dialogue: { mode: "INQUIRY" | "BOOKING"; offerShown: boolean; consentAt: string | null; accountAccess: boolean };
  draft: Record<string, string | null>; revision: number; accountReady: boolean; humanOwned: boolean; submitted: boolean;
  turns: Array<{ messageId: string; userText: string; assistantText: string | null; status: string; createdAt?: string; updatedAt?: string }>;
  staffMessages?: Array<{ id: string; body: string; createdAt: string }>;
  closed?: boolean;
};
const endpoint = "/api/public/assistant/conversation";

export function ConversationalBookingChat({ locale, initialService }: { locale: PublicLocale; initialService?: string }) {

  const [panelOpen, setPanelOpen] = useState(false);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<State | null>(null);
  const language = state?.locale ?? locale;
  const copy = conversationCopy[language];
  const policy = assistantPolicyCopy[language];
  const direct = directBookingCopy[language];
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingMessage, setPendingMessage] = useState<{ messageId: string; message: string } | null>(null);
  const booking = state?.dialogue?.mode === "BOOKING" && !!state.dialogue.consentAt;
  const interactive = !state?.closed && !state?.submitted;
  const showPanel = !!state?.submitted || (interactive && (booking || !!state?.dialogue?.accountAccess));

  // Open on entry into a data-entry phase, not on polling or draft updates.
  useEffect(() => { setPanelOpen(showPanel); }, [showPanel, booking]);

  async function changeMode(mode: "begin_booking" | "return_inquiry" | "account_access") {
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    if (await action({ action: mode })) {
      setNotice(mode === "begin_booking" ? policy.bookingStarted : mode === "return_inquiry" ? policy.returned : policy.accountOpened);
      setPanelOpen(mode !== "return_inquiry");
      if (mode === "return_inquiry") requestAnimationFrame(() => messageInput.current?.focus());
    }
  }

  async function action(body: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": language }, body: JSON.stringify(body) });
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
    if (!state?.humanOwned && state?.handoffState !== "QUEUED") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetch(endpoint, { cache: "no-store" }).then(async response => {
        if (response.ok) setState((await response.json()).data);
      }).catch(() => {});
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [state?.humanOwned, state?.handoffState]);

  async function send(value = pendingMessage) {
    const next = value ?? { messageId: crypto.randomUUID(), message: message.trim() };
    if (!next.message) return;
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    setPendingMessage(next);
    if (await action({ action: "message", ...next, locale: language })) { setPendingMessage(null); setMessage(""); }
  }

  return <section aria-label={copy.title} className="mx-auto grid w-full min-w-0 max-w-5xl gap-6 text-[var(--kmt-public-text)]" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="min-w-0 space-y-4 rounded-xl border border-kmt-gold/25 p-4 sm:p-6">
      <h2 className="font-display text-xl">{copy.title}</h2>
      <p className="text-sm leading-7">{direct.intro}</p>
      <Button type="button" variant="ghost" disabled={busy || !state} onClick={() => void action({ action: "set_locale", locale: language === "ar" ? "en" : "ar" })}>{language === "ar" ? "English" : "العربية"}</Button>
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
      {state?.humanOwned && <p role="status" className="text-sm leading-7">{state.closed ? copy.closed : direct.claimed}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(null); }} className="space-y-3">
        <label htmlFor="kmt-chat-message" className="block text-sm">{copy.message}</label>
        <textarea ref={messageInput} id="kmt-chat-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} rows={3} disabled={busy} className="w-full rounded border border-kmt-gold/30 bg-transparent p-3" dir="auto" />
        <Button disabled={busy || state?.closed || !message.trim()} type="submit">{busy ? copy.waiting : copy.send}</Button>
        {pendingMessage && !busy && <Button type="button" variant="outline" onClick={() => void send()}>{copy.retry}</Button>}
      </form>
      {notice && !panelOpen && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {showPanel && <Button className="h-auto min-h-11 whitespace-normal" type="button" onClick={() => setPanelOpen(true)}>{state?.submitted ? direct.openDetails : booking ? direct.openForm : policy.account}</Button>}
      {interactive && <div className="flex flex-wrap gap-2">
        <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="outline" disabled={busy} onClick={() => void changeMode(booking ? "return_inquiry" : "begin_booking")}>{booking ? policy.back : policy.begin}</Button>
        {!booking && !state?.dialogue?.accountAccess && !state?.accountReady && <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="ghost" disabled={busy} onClick={() => void changeMode("account_access")}>{policy.account}</Button>}
      </div>}
      {!showPanel && state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      <a href={publicOfficeProfile.whatsappHref} className="inline-flex min-h-11 items-center underline">{copy.whatsapp}</a>
      {(state?.submitted || state?.closed) && <Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingMessage(null); void action({ action: "restart", locale }); }}>{copy.newConversation}</Button>}
    </div>
    {showPanel && <Dialog open={panelOpen} onClose={closePanel} title={booking || state?.submitted ? copy.review : policy.account}
      description={!state?.submitted && booking ? direct.formHelp : undefined}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl [&>div]:min-h-0 [&>div:first-child]:shrink-0 [&>div:last-child]:shrink-0"
      footer={<Button className="h-auto min-h-11 whitespace-normal" type="button" variant="outline" onClick={closePanel}>{direct.closeForm}</Button>}>
      <div className="min-w-0 space-y-4">
      {notice && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {state && ((booking && !state.submitted) || state.booking) && <DirectBookingPanel locale={language} revision={state.revision} draft={state.draft} booking={state.booking} onRefresh={async () => { const response = await fetch(endpoint, { cache: "no-store" }); if (!response.ok) throw new Error(); setState((await response.json()).data); }} />}
      {state?.submitted && !state.booking && <p role="status">{copy.submitted}</p>}
      {!state?.accountReady && !state?.closed && (state?.booking || state?.dialogue?.accountAccess) && <div className="space-y-3 border-t border-kmt-gold/20 pt-4">
        <label htmlFor="kmt-account-email" className="block text-sm">{copy.email}</label>
        <input type="email" id="kmt-account-email" autoComplete="email" dir="ltr" value={email} onChange={event => setEmail(event.target.value)} className="min-h-11 w-full rounded border border-kmt-gold/30 bg-transparent px-3" />
        {(booking || state?.booking) && <Button type="button" disabled={busy || !state || !email} onClick={() => void action({ action: "verify", email, purpose: "ACTIVATE" })}>{copy.verify}</Button>}
        <Button type="button" variant="ghost" disabled={busy || !state || !email} onClick={() => void action({ action: "verify", email, purpose: "RECOVER" })}>{copy.recover}</Button>
        <Link className="flex min-h-11 items-center underline" href={`/login?locale=${language}&next=${encodeURIComponent(language === "ar" ? "/ar/book-consultation" : "/book-consultation")}`}>{copy.signIn}</Link>
        <Button type="button" variant="outline" disabled={busy || !state} onClick={() => void action({ action: "attach" })}>{copy.attach}</Button>
      </div>}
      {state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      </div>
    </Dialog>}
  </section>;
}
