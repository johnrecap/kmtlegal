"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, CalendarDays, Scale, ShieldCheck, UserRound, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { conversationCopy } from "@/content/conversation-copy";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { DirectBookingPanel, type DirectBooking } from "./direct-booking-panel";
import type { PublicLocale } from "@/lib/public-locale";
import "./consultation-experience.css";

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
  const experience = useRef<HTMLElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [newMessages, setNewMessages] = useState(false);
  const [bookingFooter, setBookingFooter] = useState<HTMLDivElement | null>(null);
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
  const latestAssistant = state?.turns.at(-1)?.assistantText;

  useEffect(() => {
    const resize = () => {
      const root = experience.current;
      if (root) root.style.setProperty("--consultation-height", `${Math.max(180, (window.visualViewport?.height ?? window.innerHeight) - Math.max(0, root.getBoundingClientRect().top) - 16)}px`);
    };
    resize(); window.addEventListener("resize", resize); window.visualViewport?.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); };
  }, [language]);
  useEffect(() => {
    const input = messageInput.current;
    if (input) { input.style.height = "44px"; input.style.height = `${Math.min(120, input.scrollHeight)}px`; }
  }, [message]);
  useEffect(() => {
    if (followLatest.current && log.current) log.current.scrollTop = log.current.scrollHeight;
    else setNewMessages(true);
  }, [state?.turns.length, latestAssistant, state?.staffMessages?.length]);

  // Open on entry into a data-entry phase, not on polling or draft updates.
  useEffect(() => { setPanelOpen(showPanel); }, [showPanel, booking]);

  async function changeMode(mode: "begin_booking" | "return_inquiry" | "account_access") {
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    if (await action({ action: mode, ...(mode === "begin_booking" && initialService ? {service: initialService} : {}) })) {
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
    followLatest.current = true; setNewMessages(false);
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    setPendingMessage(next);
    if (await action({ action: "message", ...next, locale: language })) { setPendingMessage(null); setMessage(""); }
  }

  return <section ref={experience} lang={language} aria-label={copy.title} className="kmt-consultation" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="consultation-welcome"><h1>{copy.welcome}</h1><p>{copy.conversationIntro}</p></header>
    <div className="consultation-chat">
      <header className="consultation-chat-head"><div className="consultation-heading"><span className="consultation-avatar"><Scale aria-hidden="true" /></span><div><h2>{copy.title}</h2><p>{copy.conversationIntro}</p></div></div>
      <Button type="button" variant="ghost" disabled={busy || !state} onClick={() => void action({ action: "set_locale", locale: language === "ar" ? "en" : "ar" })}>{language === "ar" ? "English" : "العربية"}</Button></header>
      <div className="consultation-log-wrap"><div ref={log} role="log" tabIndex={0} aria-label={copy.transcript} aria-live="polite" aria-relevant="additions" className="consultation-log" onScroll={() => { const el = log.current; if (el) { followLatest.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64; if (followLatest.current) setNewMessages(false); } }}>
        <p className="consultation-day-label">{copy.today}</p>
        {!state?.turns.length && !state?.staffMessages?.length && <p className="consultation-empty">{copy.emptyConversation}</p>}
        {[
          ...(state?.turns.flatMap((turn, index) => [
            { id: `${turn.messageId}-user`, body: turn.userText, type: "user", at: turn.createdAt ? Date.parse(turn.createdAt) : index * 2 },
            ...(turn.assistantText ? [{ id: `${turn.messageId}-assistant`, body: turn.assistantText, type: "assistant", at: turn.updatedAt ? Date.parse(turn.updatedAt) : turn.createdAt ? Date.parse(turn.createdAt) + 1 : index * 2 + 1 }] : [])
          ]) ?? []),
          ...(state?.staffMessages?.map(item => ({ id: item.id, body: item.body, type: "staff", at: Date.parse(item.createdAt) })) ?? [])
        ].sort((a, b) => a.at - b.at).map(item => <div key={item.id} className={`consultation-message consultation-message-${item.type}`}>
          <p className="consultation-author">{item.type === "user" ? <UserRound aria-hidden="true" /> : item.type === "staff" ? <Headset aria-hidden="true" /> : <Scale aria-hidden="true" />}{item.type === "user" ? copy.you : item.type === "staff" ? copy.staff : copy.assistant}</p><p className="whitespace-pre-wrap break-words" dir="auto">{item.body}</p>
        </div>)}
      </div>
      {newMessages && <Button className="consultation-latest" variant="outline" type="button" onClick={() => { followLatest.current = true; setNewMessages(false); if (log.current) log.current.scrollTop = log.current.scrollHeight; }}>{copy.latest}</Button>}
      </div>
      <div className="consultation-chat-bottom">
      {state?.humanOwned && <p role="status" className="text-sm leading-7">{state.closed ? copy.closed : direct.claimed}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(null); }} className="consultation-composer">
        <label htmlFor="kmt-chat-message" className="sr-only">{copy.message}</label>
        <textarea ref={messageInput} id="kmt-chat-message" placeholder={copy.placeholder} value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} rows={1} disabled={busy} dir="auto" />
        <Button aria-label={busy ? copy.waiting : copy.send} disabled={busy || state?.closed || !message.trim()} type="submit"><ArrowUp aria-hidden="true" /></Button>
      </form>
      {busy && <p role="status" className="consultation-feedback">{copy.waiting}</p>}
      {pendingMessage && !busy && <Button type="button" variant="outline" onClick={() => void send()}>{copy.retry}</Button>}
      {notice && !panelOpen && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {showPanel && <Button className="h-auto min-h-11 whitespace-normal" type="button" onClick={() => setPanelOpen(true)}>{state?.submitted ? direct.openDetails : booking ? direct.openForm : policy.account}</Button>}
      {interactive && <div className="consultation-chat-actions">
        <Button className="h-auto min-h-11 whitespace-normal" type="button" disabled={busy} onClick={() => void changeMode(booking ? "return_inquiry" : "begin_booking")} leadingIcon={<CalendarDays aria-hidden="true" />}>{booking ? policy.back : policy.begin}</Button>
        {!booking && !state?.dialogue?.accountAccess && !state?.accountReady && <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="ghost" disabled={busy} onClick={() => void changeMode("account_access")}>{policy.account}</Button>}
      </div>}
      {!showPanel && state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      <div className="consultation-help"><span><ShieldCheck aria-hidden="true" />{copy.privacy}</span><a href={publicOfficeProfile.whatsappHref}>{copy.whatsapp}</a></div>
      {(state?.submitted || state?.closed) && <Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingMessage(null); void action({ action: "restart", locale, service: initialService }); }}>{copy.newConversation}</Button>}
      </div>
    </div>
    {showPanel && <Dialog open={panelOpen} onClose={closePanel} title={booking || state?.submitted ? direct.dialogTitle : policy.account}
      closeLabel={direct.closeForm}
      description={!state?.submitted && booking ? direct.shortHelp : undefined}
      className="kmt-consultation-dialog"
      footer={(booking || state?.booking) ? <div ref={setBookingFooter} className="consultation-dialog-actions" /> : undefined}>
      <div className="min-w-0 space-y-4">
      {notice && notice !== policy.bookingStarted && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {state && ((booking && !state.submitted) || state.booking) && <DirectBookingPanel footerContainer={bookingFooter} locale={language} revision={state.revision} draft={state.draft} booking={state.booking} onRefresh={async () => { const response = await fetch(endpoint, { cache: "no-store" }); if (!response.ok) throw new Error(); setState((await response.json()).data); }} />}
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
