"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, CalendarDays, Scale, ShieldCheck, UserRound, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { conversationCopy } from "@/content/conversation-copy";
import { assistantPolicyCopy } from "@/content/assistant-policy-copy";
import { publicOfficeProfile } from "@/content/public-office-profile";
import { directBookingCopy } from "@/content/direct-booking-copy";
import { DirectBookingPanel, type DirectBooking } from "./direct-booking-panel";
import { OfficeContactDialog, type OfficeContact, type OfficeContactInput } from "./office-contact-dialog";
import { ConversationAccountForm } from "./conversation-account-form";
import type { PublicLocale } from "@/lib/public-locale";
import "./consultation-experience.css";

type State = {
  locale: PublicLocale; handoffState: "NONE" | "QUEUED" | "CLAIMED"; booking: DirectBooking | null;
  dialogue: { mode: "INQUIRY" | "BOOKING"; offerShown: boolean; consentAt: string | null; accountAccess: boolean };
  draft: Record<string, string | null>; revision: number; accountReady: boolean; humanOwned: boolean; submitted: boolean;
  turns: Array<{ messageId: string; recipient?: "ASSISTANT" | "OFFICE"; userText: string; assistantText: string | null; status: string; createdAt?: string; updatedAt?: string }>;
  staffMessages?: Array<{ id: string; body: string; createdAt: string }>;
  closed?: boolean;
  officeThreadStatus?: string | null; officeContact?: OfficeContact | null; expiresAt?: string;
};
type Recipient = "ASSISTANT" | "OFFICE";
type PendingMessage = { messageId: string; message: string; recipient: Recipient };
const endpoint = "/api/public/assistant/conversation";

export function ConversationalBookingChat({ locale, initialService, layout = "public", headerAction }: { locale: PublicLocale; initialService?: string; layout?: "public" | "portal"; headerAction?: ReactNode }) {

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
  const [recipient, setRecipient] = useState<Recipient>("ASSISTANT");
  const [drafts, setDrafts] = useState({ ASSISTANT: "", OFFICE: "" });
  const message = drafts[recipient];
  const setMessage = (value: string) => setDrafts(current => ({ ...current, [recipient]: value }));
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingMessages, setPendingMessages] = useState<Record<Recipient, PendingMessage | null>>({ ASSISTANT: null, OFFICE: null });
  const pendingMessage = pendingMessages[recipient];
  const [contactOpen, setContactOpen] = useState(false);
  const followupTrigger = useRef<HTMLButtonElement>(null);
  const closeContact = useCallback(() => { setContactOpen(false); requestAnimationFrame(() => followupTrigger.current?.focus()); }, []);
  const [sessionExpired, setSessionExpired] = useState(false);
  const requestEpoch = useRef(0);
  const operationPending = useRef(false);
  const booking = state?.dialogue?.mode === "BOOKING" && !!state.dialogue.consentAt;
  const interactive = !state?.submitted && !sessionExpired;
  const hasOffice = !!state?.officeThreadStatus || !!state?.humanOwned || state?.handoffState === "QUEUED";
  const showPanel = !!state?.submitted || (interactive && (booking || (!!state?.dialogue?.accountAccess && !state.accountReady)));
  const latestAssistant = state?.turns.at(-1)?.assistantText;

  useEffect(() => {
    if (layout === "portal") return;
    const resize = () => {
      const root = experience.current;
      if (root) root.style.setProperty("--consultation-height", `${Math.max(180, (window.visualViewport?.height ?? window.innerHeight) - Math.max(0, root.getBoundingClientRect().top) - 16)}px`);
    };
    resize(); window.addEventListener("resize", resize); window.visualViewport?.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); };
  }, [language, layout]);
  useEffect(() => {
    const input = messageInput.current;
    if (input) { input.style.height = "44px"; input.style.height = `${Math.min(120, input.scrollHeight)}px`; }
  }, [message]);
  useEffect(() => {
    if (followLatest.current && log.current) log.current.scrollTop = log.current.scrollHeight;
    else setNewMessages(true);
  }, [state?.turns.length, latestAssistant, state?.staffMessages?.length]);

  // Open on entry into a data-entry phase, not on polling or draft updates.
  useEffect(() => { setPanelOpen(showPanel && (!state?.submitted || booking)); }, [showPanel, booking, state?.submitted]);

  async function changeMode(mode: "begin_booking" | "return_inquiry" | "account_access") {
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    if (await action({ action: mode, ...(mode === "begin_booking" && initialService ? {service: initialService} : {}) })) {
      setNotice(mode === "begin_booking" ? policy.bookingStarted : mode === "return_inquiry" ? policy.returned : policy.accountOpened);
      setPanelOpen(mode !== "return_inquiry");
      if (mode === "return_inquiry") requestAnimationFrame(() => messageInput.current?.focus());
    }
  }

  async function action(body: Record<string, unknown>) {
    requestEpoch.current++; operationPending.current = true;
    setBusy(true); setNotice("");
    try {
      if (body.action === "register" && await recoverRegistration()) return true;
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": language }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) {
        const code = payload.error?.code;
        const expired = !!state?.expiresAt && Date.parse(state.expiresAt) <= Date.now();
        if (code === "AUTH_REQUIRED" && expired) setSessionExpired(true);
        setNotice(code === "ACCOUNT_EMAIL_UNAVAILABLE" ? copy.accountUnavailable : code === "RATE_LIMITED" ? copy.accountRateLimited : code === "AUTH_REQUIRED" ? expired ? copy.sessionExpired : copy.loginRequired : code === "CONFLICT" || code === "APPOINTMENT_CONFLICT" ? copy.changed : code === "VALIDATION_ERROR" ? body.action === "register" ? copy.accountInvalid : body.action === "set_office_contact" ? copy.contactInvalid : copy.needDetails : copy.unavailable);
        return false;
      }
      const refreshed = body.action === "submit" || body.action === "attach"
        ? await fetch(endpoint, { cache: "no-store" }).then(async value => { if (!value.ok) throw new Error(); return value.json(); }) : payload;
      setState(refreshed.data);
      setSessionExpired(false);
      if (body.action === "register") { setSignedIn(true); setNotice(copy.registered); }
      return true;
    } catch {
      if (body.action === "register" && await recoverRegistration()) return true;
      setNotice(copy.unavailable); return false;
    }
    finally { requestEpoch.current++; operationPending.current = false; setBusy(false); }
  }

  async function recoverRegistration() {
    // A lost response is a success only when both authenticated identity and owned conversation agree.
    try {
      const auth = await fetch("/api/auth/me", { cache: "no-store" });
      if (!auth.ok) return false;
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) return false;
      const payload = await response.json();
      if (!payload.data?.accountReady) return false;
      setState(payload.data); setSignedIn(true); setSessionExpired(false); setNotice(copy.registered);
      return true;
    } catch { return false; }
  }

  useEffect(() => {
    if (!panelOpen) return;
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" }).then(async response => {
      const payload = response.ok ? await response.json() : null;
      if (active) setSignedIn(payload?.user?.role === "Client" && !!payload.user.clientId);
    }).catch(() => {});
    return () => { active = false; };
  }, [panelOpen]);

  useEffect(() => {
    let active = true;
    const epoch = requestEpoch.current;
    fetch(endpoint, { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const payload = await response.json();
      if (active && epoch === requestEpoch.current) setState(payload.data);
    }).catch(() => { if (active) setNotice(copy.unavailable); });
    return () => { active = false; };
  }, [copy.unavailable]);

  useEffect(() => {
    if (!hasOffice || sessionExpired) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState !== "visible" || operationPending.current) return;
      const epoch = requestEpoch.current;
      fetch(endpoint, { cache: "no-store" }).then(async response => {
        if (response.ok) {
          const payload = await response.json();
          if (active && epoch === requestEpoch.current) setState(current => !current || payload.data?.revision >= current.revision ? payload.data : current);
        }
      }).catch(() => {});
    };
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [hasOffice, sessionExpired]);

  async function send(value = pendingMessage) {
    const next = value ?? { messageId: crypto.randomUUID(), message: message.trim(), recipient };
    if (!next.message) return;
    followLatest.current = true; setNewMessages(false);
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    setPendingMessages(current => ({ ...current, [next.recipient]: next }));
    if (await action({ action: "message", ...next, locale: language })) {
      setPendingMessages(current => ({ ...current, [next.recipient]: null }));
      setDrafts(current => ({ ...current, [next.recipient]: "" }));
      if (next.recipient === "OFFICE") setNotice(copy.officeReceived);
    }
  }

  async function saveContact(value: OfficeContactInput) {
    const saved = await action({ action: "set_office_contact", revision: state?.revision, ...value });
    if (saved) setNotice(value.phone ? copy.contactSaved : copy.contactRemoved);
    return saved;
  }

  const Heading = layout === "portal" ? "h1" : "h2";
  const languageControl = <Button type="button" variant="ghost" disabled={busy || !state} onClick={() => void action({ action: "set_locale", locale: language === "ar" ? "en" : "ar" })}>{language === "ar" ? "English" : "العربية"}</Button>;

  return <section ref={experience} lang={language} aria-label={copy.title} className={`kmt-consultation${layout === "portal" ? " kmt-consultation--portal" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
    {layout === "public" && <header className="consultation-welcome"><h1>{copy.welcome}</h1><p>{copy.conversationIntro}</p></header>}
    <div className="consultation-chat">
      <header className="consultation-chat-head"><div className="consultation-heading"><span className="consultation-avatar"><Scale aria-hidden="true" /></span><div><Heading>{copy.title}</Heading><p>{copy.conversationIntro}</p></div></div>
      {headerAction ? <div className="consultation-header-actions">{headerAction}{languageControl}</div> : languageControl}</header>
      <div className="consultation-log-wrap"><div ref={log} role="log" tabIndex={0} aria-label={copy.transcript} aria-live="polite" aria-relevant="additions" className="consultation-log" onScroll={() => { const el = log.current; if (el) { followLatest.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64; if (followLatest.current) setNewMessages(false); } }}>
        <p className="consultation-day-label">{copy.today}</p>
        {!state?.turns.length && !state?.staffMessages?.length && <p className="consultation-empty">{copy.emptyConversation}</p>}
        {[
          ...(state?.turns.flatMap((turn, index) => [
            { id: `${turn.messageId}-user`, body: turn.userText, type: "user", recipient: turn.recipient ?? (turn.status === "HUMAN" ? "OFFICE" : "ASSISTANT"), at: turn.createdAt ? Date.parse(turn.createdAt) : index * 2 },
            ...(turn.assistantText ? [{ id: `${turn.messageId}-assistant`, body: turn.assistantText, type: "assistant", at: turn.updatedAt ? Date.parse(turn.updatedAt) : turn.createdAt ? Date.parse(turn.createdAt) + 1 : index * 2 + 1 }] : [])
          ]) ?? []),
          ...(state?.staffMessages?.map(item => ({ id: item.id, body: item.body, type: "staff", at: Date.parse(item.createdAt) })) ?? [])
        ].sort((a, b) => a.at - b.at).map(item => <div key={item.id} className={`consultation-message consultation-message-${item.type}`}>
          <p className="consultation-author">{item.type === "user" ? <UserRound aria-hidden="true" /> : item.type === "staff" ? <Headset aria-hidden="true" /> : <Scale aria-hidden="true" />}{item.type === "user" ? copy.you : item.type === "staff" ? copy.staff : copy.assistant}{"recipient" in item && <span className="consultation-recipient-label">{item.recipient === "OFFICE" ? copy.sentToOffice : copy.sentToAssistant}</span>}</p><p className="whitespace-pre-wrap break-words" dir="auto">{item.body}</p>
        </div>)}
      </div>
      {newMessages && <Button className="consultation-latest" variant="outline" type="button" onClick={() => { followLatest.current = true; setNewMessages(false); if (log.current) log.current.scrollTop = log.current.scrollHeight; }}>{copy.latest}</Button>}
      </div>
      <div className="consultation-chat-bottom">
      <div className="consultation-routing">
        <div role="group" aria-label={copy.recipient} className="consultation-recipient-options">
          {(["ASSISTANT", "OFFICE"] as const).map(target => <button key={target} type="button" aria-pressed={recipient === target} disabled={busy || sessionExpired} onClick={() => { setRecipient(target); setNotice(""); requestAnimationFrame(() => messageInput.current?.focus()); }}>{target === "ASSISTANT" ? <Scale aria-hidden="true" /> : <Headset aria-hidden="true" />}{target === "ASSISTANT" ? copy.toAssistant : copy.toOffice}</button>)}
        </div>
        {hasOffice && <button ref={followupTrigger} className="consultation-followup-link" type="button" disabled={busy} onClick={() => setContactOpen(true)}>{copy.followupDetails}</button>}
      </div>
      {hasOffice && <p role="status" className="consultation-feedback">{state?.closed ? copy.closed : copy.officeFollowup}</p>}
      <form onSubmit={event => { event.preventDefault(); void send(pendingMessage); }} className="consultation-composer">
        <label htmlFor="kmt-chat-message" className="sr-only">{copy.message}</label>
        <textarea ref={messageInput} id="kmt-chat-message" placeholder={recipient === "OFFICE" ? copy.officePlaceholder : copy.placeholder} value={message} onChange={event => { setMessage(event.target.value); if (pendingMessage) setPendingMessages(current => ({ ...current, [recipient]: null })); }} maxLength={4000} rows={1} disabled={busy || sessionExpired || (recipient === "OFFICE" && !!state?.closed)} dir="auto" />
        <Button aria-label={busy ? copy.waiting : copy.send} disabled={busy || sessionExpired || (recipient === "OFFICE" && !!state?.closed) || !message.trim()} type="submit"><ArrowUp aria-hidden="true" /></Button>
      </form>
      {busy && <p role="status" className="consultation-feedback">{recipient === "OFFICE" ? copy.officeSending : copy.waiting}</p>}
      {pendingMessage && !busy && <Button type="button" variant="outline" onClick={() => void send()}>{copy.retry}</Button>}
      {notice && !panelOpen && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {showPanel && <Button className="h-auto min-h-11 whitespace-normal" type="button" onClick={() => setPanelOpen(true)}>{state?.submitted ? direct.openDetails : booking ? direct.openForm : policy.account}</Button>}
      {interactive && <div className="consultation-chat-actions">
        <Button className="h-auto min-h-11 whitespace-normal" type="button" disabled={busy} onClick={() => void changeMode(booking ? "return_inquiry" : "begin_booking")} leadingIcon={<CalendarDays aria-hidden="true" />}>{booking ? policy.back : policy.begin}</Button>
        {!booking && !state?.dialogue?.accountAccess && !state?.accountReady && <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="ghost" disabled={busy} onClick={() => void changeMode("account_access")}>{policy.account}</Button>}
      </div>}
      {!showPanel && state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      <div className="consultation-help"><span><ShieldCheck aria-hidden="true" />{copy.privacy}</span><a href={publicOfficeProfile.whatsappHref}>{copy.whatsapp}</a></div>
      {(state?.submitted || state?.closed || sessionExpired) && <Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingMessages({ ASSISTANT: null, OFFICE: null }); setDrafts({ ASSISTANT: "", OFFICE: "" }); setRecipient("ASSISTANT"); void action({ action: "restart", locale: language, service: initialService }); }}>{copy.newConversation}</Button>}
      </div>
    </div>
    {contactOpen && <OfficeContactDialog locale={language} contact={state?.officeContact ?? null} expiresAt={state?.expiresAt} accountReady={!!state?.accountReady} canSave={!!state?.officeThreadStatus && !sessionExpired} error={notice} onClose={closeContact} onSave={saveContact} />}
    {showPanel && <Dialog open={panelOpen} onClose={closePanel} title={booking || state?.submitted ? direct.dialogTitle : policy.account}
      closeLabel={direct.closeForm}
      description={!state?.submitted && booking ? direct.shortHelp : undefined}
      className="kmt-consultation-dialog"
      footer={(booking || state?.booking) ? <div ref={setBookingFooter} className="consultation-dialog-actions" /> : undefined}>
      <div className="min-w-0 space-y-4">
      {notice && notice !== policy.bookingStarted && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {state && ((booking && !state.submitted) || state.booking) && <DirectBookingPanel footerContainer={bookingFooter} locale={language} revision={state.revision} draft={state.draft} booking={state.booking} onRefresh={async () => { const response = await fetch(endpoint, { cache: "no-store" }); if (!response.ok) throw new Error(); setState((await response.json()).data); }} />}
      {state?.submitted && !state.booking && <p role="status">{copy.submitted}</p>}
      {!state?.accountReady && (state?.booking || state?.dialogue?.accountAccess) && <ConversationAccountForm locale={language} panelOpen={panelOpen} busy={busy} authenticated={signedIn}
        initial={{ fullName: state?.booking?.fullName ?? state?.draft.fullName ?? "", phone: state?.booking?.phone ?? state?.draft.phone ?? "", email: state?.draft.email ?? "" }}
        onRegister={value => action({ action: "register", revision: state?.revision, ...value })} onAttach={() => void action({ action: "attach" })} />}
      {state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      </div>
    </Dialog>}
  </section>;
}
