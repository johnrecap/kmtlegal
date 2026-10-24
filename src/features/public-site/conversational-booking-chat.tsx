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
import { DirectBookingPanel } from "./direct-booking-panel";
import { AssistantMessageBody } from "./assistant-message-body";
import { OfficeContactDialog, type OfficeContactInput } from "./office-contact-dialog";
import { ConversationAccountForm } from "./conversation-account-form";
import type { PublicLocale } from "@/lib/public-locale";
import { legalSourceSchema, type LegalSource } from "@/lib/legal-assistant";
import { legalAssistantCopy } from "@/content/legal-assistant-copy";
import { assistantActionCopy } from "@/content/assistant-action-copy";
import { conversationRequest, ConversationRequestError, type ConversationState as State } from "./conversation-request";
import "./consultation-experience.css";

type Recipient = "ASSISTANT" | "OFFICE";
type PendingMessage = { messageId: string; message: string; recipient: Recipient; delivery: "SENDING" | "UNKNOWN" | "FAILED" | "PENDING"; local: boolean; at: number };
function turnRecipient(turn: State["turns"][number]): Recipient { return turn.recipient ?? (turn.status === "HUMAN" ? "OFFICE" : "ASSISTANT"); }
function sameAttempt(turn: State["turns"][number], pending: PendingMessage) { return turn.messageId === pending.messageId && turn.userText === pending.message && turnRecipient(turn) === pending.recipient; }

export function ConversationalBookingChat({ locale, initialService, layout = "public", headerAction }: { locale: PublicLocale; initialService?: string; layout?: "public" | "portal"; headerAction?: ReactNode }) {

  const [panelOpen, setPanelOpen] = useState(false);
  const panelTrigger = useRef<HTMLButtonElement>(null);
  const closePanel = useCallback(() => { setPanelOpen(false); requestAnimationFrame(() => panelTrigger.current?.focus()); }, []);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const experience = useRef<HTMLElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [newMessages, setNewMessages] = useState(false);
  const [bookingFooter, setBookingFooter] = useState<HTMLDivElement | null>(null);
  const [state, setState] = useState<State | null>(null);
  const currentState = useRef<State | null>(null);
  const acceptSnapshot = useCallback((snapshot: State | null) => { currentState.current = snapshot; setState(snapshot); }, []);
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
  const [assistantRequestPending, setAssistantRequestPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [pendingMessages, setPendingMessages] = useState<Record<Recipient, PendingMessage | null>>({ ASSISTANT: null, OFFICE: null });
  const pendingMessage = pendingMessages[recipient];
  const limitStopsAttempt = !!state?.messageLimitReached && (!pendingMessage || !state.turns.some(turn => sameAttempt(turn, pendingMessage)));
  const [contactOpen, setContactOpen] = useState(false);
  const followupTrigger = useRef<HTMLButtonElement>(null);
  const closeContact = useCallback(() => { setContactOpen(false); requestAnimationFrame(() => followupTrigger.current?.focus()); }, []);
  const [sessionExpired, setSessionExpired] = useState(false);
  const requestEpoch = useRef(0);
  const operationPending = useRef(false);
  const sendPending = useRef(false);
  const recoverySnapshot = useRef<State | null>(null);
  const lastFailure = useRef<ConversationRequestError | null>(null);
  const awaitingAnswer = !!state?.turns.some(turn => turn.status === "PENDING");
  const preparingReply = !sessionExpired && (assistantRequestPending || !!state?.turns.some(turn => turn.status === "PENDING" && turnRecipient(turn) === "ASSISTANT"));
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
  }, [state?.turns.length, latestAssistant, state?.staffMessages?.length, pendingMessages.ASSISTANT?.messageId, pendingMessages.OFFICE?.messageId, preparingReply]);

  useEffect(() => {
    if (!state) return;
    const restoreSaved = recoverySnapshot.current !== state;
    recoverySnapshot.current = state;
    for (const target of ["ASSISTANT", "OFFICE"] as const) {
      const pending = pendingMessages[target];
      if (pending && state.turns.some(turn => sameAttempt(turn, pending) && ["COMPLETED", "HUMAN"].includes(turn.status))) {
        setDrafts(current => current[target].trim() === pending.message ? { ...current, [target]: "" } : current);
      }
    }
    setPendingMessages(current => {
      const recovered = { ...current };
      let changed = false;
      for (const target of ["ASSISTANT", "OFFICE"] as const) {
        const pending = current[target];
        const turn = pending ? state.turns.find(turn => sameAttempt(turn, pending)) : state.turns.filter(turn => turnRecipient(turn) === target).at(-1);
        if (!turn) continue;
        if (!pending && (!restoreSaved || (drafts[target].trim() && drafts[target].trim() !== turn.userText))) continue;
        if (["COMPLETED", "HUMAN"].includes(turn.status) && pending) { recovered[target] = null; changed = true; }
        else if (["FAILED", "PENDING"].includes(turn.status) && pending?.delivery !== "SENDING" && (!pending || pending.delivery !== turn.status)) { recovered[target] = {
          messageId: turn.messageId, message: turn.userText, recipient: target, delivery: turn.status as "FAILED" | "PENDING", local: pending?.local ?? false, at: pending?.at ?? Date.now()
        }; changed = true; }
      }
      return changed ? recovered : current;
    });
  }, [state, pendingMessages, drafts]);

  // Open on entry into a data-entry phase, not on polling or draft updates.
  useEffect(() => { setPanelOpen(showPanel && (!state?.submitted || booking)); }, [showPanel, booking, state?.submitted]);
  useEffect(() => {
    if (booking && state?.dialogue.bookingFormRequestId && !state.submitted) setPanelOpen(true);
  }, [booking, state?.dialogue.bookingFormRequestId, state?.submitted]);

  async function changeMode(mode: "begin_booking" | "return_inquiry" | "account_access") {
    if (!state && !await action({ action: "start", locale, service: initialService })) return;
    if (await action({ action: mode, ...(mode === "begin_booking" && initialService ? {service: initialService} : {}) })) {
      setNotice(mode === "begin_booking" ? policy.bookingStarted : mode === "return_inquiry" ? policy.returned : policy.accountOpened);
      setPanelOpen(mode !== "return_inquiry");
      if (mode === "return_inquiry") requestAnimationFrame(() => messageInput.current?.focus());
    }
  }

  async function action(body: Record<string, unknown>) {
    if (operationPending.current) return false;
    requestEpoch.current++; operationPending.current = true;
    const epoch = requestEpoch.current;
    lastFailure.current = null;
    setBusy(true); setNotice("");
    try {
      if (body.action === "register" && await recoverRegistration()) return true;
      const snapshot = await conversationRequest(body, language);
      const refreshed = body.action === "submit" || body.action === "attach"
        ? await conversationRequest(undefined, language) : snapshot;
      if (epoch !== requestEpoch.current) return false;
      acceptSnapshot(refreshed);
      setSessionExpired(false);
      if (body.action === "register") { setSignedIn(true); setNotice(copy.registered); }
      return true;
    } catch (error) {
      if (body.action === "register" && await recoverRegistration()) return true;
      if (epoch !== requestEpoch.current) return false;
      const failure = error instanceof ConversationRequestError ? error : new ConversationRequestError("NETWORK");
      lastFailure.current = failure;
      showFailure(failure, body.action);
      return false;
    }
    finally { requestEpoch.current++; operationPending.current = false; setBusy(false); }
  }

  const showFailure = useCallback((error: unknown, operation?: unknown) => {
    const failure = error instanceof ConversationRequestError ? error : new ConversationRequestError("NETWORK");
    const expired = !!currentState.current?.expiresAt && Date.parse(currentState.current.expiresAt) <= Date.now();
    const denied = failure.status === 401 || failure.status === 403;
    if (denied) {
      requestEpoch.current++; acceptSnapshot(null); setSignedIn(false);
      setPendingMessages(current => ({ ASSISTANT: current.ASSISTANT?.local ? { ...current.ASSISTANT, delivery: "UNKNOWN" } : null, OFFICE: current.OFFICE?.local ? { ...current.OFFICE, delivery: "UNKNOWN" } : null }));
      // An inaccessible saved capability also needs explicit replacement, even before the first snapshot.
      setSessionExpired(true);
    }
    const code = failure.code;
    const explanation = denied ? expired ? copy.sessionExpired : copy.sessionUnavailable
      : failure.kind === "TIMEOUT" || code === "AI_PROVIDER_TIMEOUT" ? copy.timeout
      : failure.kind === "NETWORK" ? copy.network
      : failure.kind === "INVALID_RESPONSE" ? copy.invalidResponse
      : code === "AI_OUTPUT_INVALID" ? copy.replyInvalid
      : code === "AI_PROVIDER_UNAVAILABLE" ? copy.providerUnavailable
      : code === "ACCOUNT_EMAIL_UNAVAILABLE" ? copy.accountUnavailable
      : code === "CONVERSATION_LIMIT_REACHED" ? copy.messageLimit
      : failure.status === 429 ? copy.accountRateLimited
      : failure.status === 409 ? copy.changed
      : code === "VALIDATION_ERROR" ? operation === "register" ? copy.accountInvalid : operation === "set_office_contact" ? copy.contactInvalid : copy.needDetails : copy.unavailable;
    setNotice(failure.requestId ? `${explanation} ${copy.supportReference.replace("{id}", failure.requestId)}` : explanation);
  }, [acceptSnapshot, copy]);

  async function recoverRegistration() {
    // A lost response is a success only when both authenticated identity and owned conversation agree.
    try {
      const epoch = requestEpoch.current;
      const auth = await fetch("/api/auth/me", { cache: "no-store", signal: AbortSignal.timeout(20_000) });
      if (!auth.ok) return false;
      const snapshot = await conversationRequest(undefined, language);
      if (!snapshot?.accountReady || epoch !== requestEpoch.current) return false;
      acceptSnapshot(snapshot); setSignedIn(true); setSessionExpired(false); setNotice(copy.registered);
      return true;
    } catch { return false; }
  }

  useEffect(() => {
    if (!panelOpen) return;
    let active = true;
    const epoch = requestEpoch.current;
    fetch("/api/auth/me", { cache: "no-store", signal: AbortSignal.timeout(20_000) }).then(async response => {
      const payload = response.ok ? await response.json() : null;
      if (active && epoch === requestEpoch.current) setSignedIn(payload?.user?.role === "Client" && !!payload.user.clientId);
    }).catch(() => {});
    return () => { active = false; };
  }, [panelOpen]);

  useEffect(() => {
    let active = true;
    const epoch = requestEpoch.current;
    conversationRequest(undefined, locale).then(snapshot => {
      if (active && epoch === requestEpoch.current) acceptSnapshot(snapshot);
    }).catch(error => { if (active && epoch === requestEpoch.current) showFailure(error); });
    return () => { active = false; };
  }, [copy.unavailable, acceptSnapshot, locale, showFailure]);

  useEffect(() => {
    if ((!hasOffice && !state?.accountReady && !awaitingAnswer) || sessionExpired) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState !== "visible" || operationPending.current || sendPending.current) return;
      const epoch = requestEpoch.current;
      conversationRequest(undefined, locale).then(snapshot => {
        if (active && epoch === requestEpoch.current && snapshot && (!currentState.current || snapshot.revision >= currentState.current.revision)) acceptSnapshot(snapshot);
      }).catch(error => { if (active && epoch === requestEpoch.current && error instanceof ConversationRequestError && [401, 403].includes(error.status ?? 0)) showFailure(error); });
    };
    const timer = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [hasOffice, state?.accountReady, awaitingAnswer, sessionExpired, copy.loginRequired, acceptSnapshot, locale, showFailure]);

  async function send(value = pendingMessage) {
    if (sendPending.current || operationPending.current || sessionExpired) return;
    const next: PendingMessage = value ?? { messageId: crypto.randomUUID(), message: message.trim(), recipient, delivery: "SENDING", local: true, at: Date.now() };
    if (!next.message) return;
    sendPending.current = true; setBusy(true);
    followLatest.current = true; setNewMessages(false);
    try {
      if (value) {
        const epoch = requestEpoch.current;
        try {
          const snapshot = await conversationRequest(undefined, language);
          if (epoch !== requestEpoch.current) return;
          acceptSnapshot(snapshot);
          const recovered = reconcileAttempt(snapshot, next);
          if (recovered === "ACCEPTED" || recovered === "PENDING") return;
        } catch (error) { showFailure(error); if (next.local || !(error instanceof ConversationRequestError) || ![401, 403].includes(error.status ?? 0)) updateDelivery(next, "UNKNOWN"); return; }
      }
      setAssistantRequestPending(next.recipient === "ASSISTANT");
      updateDelivery(next, "SENDING");
      if (!currentState.current && !await action({ action: "start", locale, service: initialService })) { updateDelivery(next, "UNKNOWN"); return; }
      const sent = await action({ action: "message", messageId: next.messageId, message: next.message, recipient: next.recipient, locale: language });
      setAssistantRequestPending(false);
      if (sent) { reconcileAttempt(currentState.current, next); return; }
      if ([401, 403].includes(lastFailure.current?.status ?? 0)) { if (next.local) updateDelivery(next, "UNKNOWN"); return; }
      const epoch = requestEpoch.current;
      try {
        const snapshot = await conversationRequest(undefined, language);
        if (epoch !== requestEpoch.current) return;
        acceptSnapshot(snapshot); reconcileAttempt(snapshot, next);
      } catch (error) {
        if (epoch !== requestEpoch.current) return;
        const denied = error instanceof ConversationRequestError && [401, 403].includes(error.status ?? 0);
        if (denied) showFailure(error);
        if (next.local || !denied) updateDelivery(next, "UNKNOWN");
      }
    } finally { sendPending.current = false; setBusy(false); setAssistantRequestPending(false); }
  }

  function updateDelivery(pending: PendingMessage, delivery: PendingMessage["delivery"]) {
    setPendingMessages(current => ({ ...current, [pending.recipient]: { ...pending, delivery } }));
  }

  function reconcileAttempt(snapshot: State | null, pending: PendingMessage) {
    const turn = snapshot?.turns.find(turn => sameAttempt(turn, pending));
    if (turn && ["COMPLETED", "HUMAN"].includes(turn.status)) {
      setPendingMessages(current => current[pending.recipient]?.messageId === pending.messageId ? { ...current, [pending.recipient]: null } : current);
      setDrafts(current => current[pending.recipient].trim() === pending.message ? { ...current, [pending.recipient]: "" } : current);
      setNotice(pending.recipient === "OFFICE" ? copy.officeReceived : "");
      return "ACCEPTED";
    }
    const delivery = turn?.status === "FAILED" ? "FAILED" : turn?.status === "PENDING" ? "PENDING" : "UNKNOWN";
    updateDelivery(pending, delivery);
    return delivery;
  }

  async function saveContact(value: OfficeContactInput) {
    const saved = await action({ action: "set_office_contact", revision: state?.revision, ...value });
    if (saved) setNotice(value.phone ? copy.contactSaved : copy.contactRemoved);
    return saved;
  }

  async function restartConversation() {
    if (await action({ action: "restart", locale: language, service: initialService })) {
      // Keep each recipient's typed draft. Retire only the old session's attempt IDs,
      // and only after the server confirms the replacement session.
      setPendingMessages({ ASSISTANT: null, OFFICE: null });
    }
  }

  const Heading = layout === "portal" ? "h1" : "h2";
  const panelEpoch = requestEpoch.current;
  const bookingAccessFailure = useCallback((error: unknown) => { if (panelEpoch === requestEpoch.current) showFailure(error); }, [panelEpoch, showFailure]);
  const deliveryLabel = (delivery?: string, code?: string | null) => delivery === "SENDING" ? copy.deliveryPending : delivery === "FAILED" ? code === "AI_OUTPUT_INVALID" ? copy.replyInvalid : code === "AI_PROVIDER_UNAVAILABLE" ? copy.providerUnavailable : code === "AI_PROVIDER_TIMEOUT" ? copy.timeout : copy.deliveryFailed : delivery === "PENDING" ? copy.deliveryProcessing : delivery === "UNKNOWN" ? copy.deliveryUnknown : undefined;
  const languageControl = <Button type="button" variant="ghost" disabled={busy || !state} onClick={() => void action({ action: "set_locale", locale: language === "ar" ? "en" : "ar" })}>{language === "ar" ? "English" : "العربية"}</Button>;

  return <section ref={experience} lang={language} aria-label={copy.title} className={`kmt-consultation${layout === "portal" ? " kmt-consultation--portal" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
    {layout === "public" && <header className="consultation-welcome"><h1>{copy.welcome}</h1><p>{copy.conversationIntro}</p></header>}
    <div className="consultation-chat">
      <header className="consultation-chat-head"><div className="consultation-heading"><span className="consultation-avatar"><Scale aria-hidden="true" /></span><div><Heading>{copy.title}</Heading><p>{copy.conversationIntro}</p></div></div>
      {headerAction ? <div className="consultation-header-actions">{headerAction}{languageControl}</div> : languageControl}</header>
      <div className="consultation-log-wrap"><div ref={log} role="log" tabIndex={0} aria-label={copy.transcript} aria-live="polite" aria-relevant="additions" className="consultation-log" onScroll={() => { const el = log.current; if (el) { followLatest.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64; if (followLatest.current) setNewMessages(false); } }}>
        <p className="consultation-day-label">{copy.today}</p>
        {!state?.turns.length && !state?.staffMessages?.length && !Object.values(pendingMessages).some(Boolean) && <p className="consultation-empty">{copy.emptyConversation}</p>}
        {[
          ...(state?.turns.flatMap((turn, index) => [
            { id: `${turn.messageId}-user`, body: turn.userText, type: "user", sources: [] as LegalSource[], recipient: turnRecipient(turn), delivery: deliveryLabel(pendingMessages[turnRecipient(turn)]?.messageId === turn.messageId ? pendingMessages[turnRecipient(turn)]?.delivery : turn.status, turn.errorCode), at: turn.createdAt ? Date.parse(turn.createdAt) : index * 2 },
            ...(turn.assistantText ? [{ id: `${turn.messageId}-assistant`, body: turn.assistantText, type: "assistant", sources: turn.sources, at: turn.updatedAt ? Date.parse(turn.updatedAt) : turn.createdAt ? Date.parse(turn.createdAt) + 1 : index * 2 + 1 }] : [])
          ]) ?? []),
          ...(state?.staffMessages?.map(item => ({ id: item.id, body: item.body, type: "staff", sources: [] as LegalSource[], at: Date.parse(item.createdAt) })) ?? []),
          ...Object.values(pendingMessages).flatMap(pending => pending && !state?.turns.some(turn => sameAttempt(turn, pending)) ? [{ id: `${pending.messageId}-user`, body: pending.message, type: "user", recipient: pending.recipient, delivery: deliveryLabel(pending.delivery), sources: [] as LegalSource[], at: pending.at }] : [])
        ].sort((a, b) => a.at - b.at).map(item => <div key={item.id} className={`consultation-message consultation-message-${item.type}`}>
          <p className="consultation-author">{item.type === "user" ? <UserRound aria-hidden="true" /> : item.type === "staff" ? <Headset aria-hidden="true" /> : <Scale aria-hidden="true" />}{item.type === "user" ? copy.you : item.type === "staff" ? copy.staff : copy.assistant}{"recipient" in item && <span className="consultation-recipient-label">{item.recipient === "OFFICE" ? copy.sentToOffice : copy.sentToAssistant}</span>}</p>{item.type === "assistant" ? <AssistantMessageBody body={item.body} draftLabel={legalAssistantCopy[language].draft} /> : <p className="whitespace-pre-wrap break-words" dir="auto">{item.body}</p>}
          {"delivery" in item && item.delivery && <p role="status" className="text-sm leading-7">{item.delivery}</p>}
          {item.sources?.some(s => legalSourceSchema.safeParse(s).success) && <nav aria-label={legalAssistantCopy[language].sources} className="mt-3 space-y-2 text-sm">
            <p>{legalAssistantCopy[language].sources}</p>
            {item.sources.filter(s => legalSourceSchema.safeParse(s).success).slice(0, 5).map(source => <p key={source.id} className="break-words"><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">[{source.id}] {source.title}</a>{" · "}{legalAssistantCopy[language].accessed} {new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(source.retrievedAt))}</p>)}
          </nav>}
        </div>)}
      {state?.proposals?.map(proposal => <section key={proposal.id} aria-label={proposal.preview.title} className="space-y-2 rounded-xl border p-3 text-sm">
        <p className="font-semibold">{proposal.preview.title}</p>
        {proposal.preview.lines.map((line, index) => <p key={index} dir="auto" className="whitespace-pre-wrap break-words">{line}</p>)}
        {proposal.status === "PENDING" && Date.parse(proposal.expiresAt) > Date.now() ? <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy || sessionExpired} onClick={() => void action({ action: "confirm_action", proposalId: proposal.id, confirmed: true })}>{assistantActionCopy[language].confirm}</Button>
          <Button type="button" variant="outline" disabled={busy || sessionExpired} onClick={() => void action({ action: "cancel_action", proposalId: proposal.id })}>{assistantActionCopy[language].cancel}</Button>
        </div> : <p role="status">{assistantActionCopy[language][proposal.status === "COMPLETED" ? "completed" : proposal.status === "CANCELLED" ? "cancelled" : "stale"]}</p>}
      </section>)}
      {preparingReply && <div className="consultation-message consultation-message-assistant consultation-reply-pending">
        <p className="consultation-author"><Scale aria-hidden="true" />{copy.assistant}</p>
        <p className="consultation-reply-progress"><span className="consultation-reply-dots" aria-hidden="true"><span /><span /><span /></span><span>{copy.waiting}</span></p>
      </div>}
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
        <Button aria-label={busy ? copy.waiting : copy.send} disabled={busy || sessionExpired || limitStopsAttempt || (recipient === "OFFICE" && !!state?.closed) || !message.trim()} type="submit"><ArrowUp aria-hidden="true" /></Button>
      </form>
      {busy && (!preparingReply || recipient === "OFFICE") && <p role="status" className="consultation-feedback">{recipient === "OFFICE" ? copy.officeSending : copy.waiting}</p>}
      {pendingMessage && !busy && <Button type="button" variant="outline" disabled={sessionExpired || limitStopsAttempt || pendingMessage.delivery === "PENDING" || pendingMessage.delivery === "SENDING"} onClick={() => void send()}>{copy.retry}</Button>}

      {state?.messageLimitReached && <p role="status" className="consultation-feedback">{copy.messageLimit}</p>}
      {notice && !panelOpen && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {showPanel && <Button ref={panelTrigger} className="h-auto min-h-11 whitespace-normal" type="button" onClick={() => setPanelOpen(true)}>{state?.submitted ? direct.openDetails : booking ? direct.openForm : policy.account}</Button>}
      {interactive && <div className="consultation-chat-actions">
        <Button className="h-auto min-h-11 whitespace-normal" type="button" disabled={busy} onClick={() => void changeMode(booking ? "return_inquiry" : "begin_booking")} leadingIcon={<CalendarDays aria-hidden="true" />}>{booking ? policy.back : policy.begin}</Button>
        {!booking && !state?.dialogue?.accountAccess && !state?.accountReady && <Button className="h-auto min-h-11 whitespace-normal" type="button" variant="ghost" disabled={busy} onClick={() => void changeMode("account_access")}>{policy.account}</Button>}
      </div>}
      {!showPanel && state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      <div className="consultation-help"><span><ShieldCheck aria-hidden="true" />{copy.privacy}</span><a href={publicOfficeProfile.whatsappHref}>{copy.whatsapp}</a></div>
      {(state?.submitted || state?.closed || sessionExpired || state?.messageLimitReached) && <Button type="button" variant="outline" disabled={busy} onClick={() => void restartConversation()}>{copy.newConversation}</Button>}
      </div>
    </div>
    {contactOpen && <OfficeContactDialog locale={language} contact={state?.officeContact ?? null} expiresAt={state?.expiresAt} accountReady={!!state?.accountReady} canSave={!!state?.officeThreadStatus && !sessionExpired} error={notice} onClose={closeContact} onSave={saveContact} />}
    {showPanel && <Dialog open={panelOpen} onClose={closePanel} title={booking || state?.submitted ? direct.dialogTitle : policy.account}
      fitVisualViewport
      closeLabel={direct.closeForm}
      description={!state?.submitted && booking ? direct.shortHelp : undefined}
      className="kmt-consultation-dialog"
      footer={(booking || state?.booking) ? <div ref={setBookingFooter} className="consultation-dialog-actions" /> : undefined}>
      <div className="min-w-0 space-y-4">
      {notice && notice !== policy.bookingStarted && <p role="status" className="break-words text-sm leading-7">{notice}</p>}
      {state && ((booking && !state.submitted) || state.booking) && <DirectBookingPanel footerContainer={bookingFooter} locale={language} revision={state.revision} draft={state.draft} booking={state.booking}
        onAccessFailure={bookingAccessFailure}
        onState={snapshot => { if (panelEpoch === requestEpoch.current && (!currentState.current || snapshot.revision >= currentState.current.revision)) acceptSnapshot(snapshot); }}
        onRefresh={async () => { const snapshot = await conversationRequest(undefined, language); if (panelEpoch === requestEpoch.current && (!snapshot || !currentState.current || snapshot.revision >= currentState.current.revision)) acceptSnapshot(snapshot); }} />}
      {state?.submitted && !state.booking && <p role="status">{copy.submitted}</p>}
      {!state?.accountReady && (state?.booking || state?.dialogue?.accountAccess) && <ConversationAccountForm locale={language} panelOpen={panelOpen} busy={busy} authenticated={signedIn}
        initial={{ fullName: state?.booking?.fullName ?? state?.draft.fullName ?? "", phone: state?.booking?.phone ?? state?.draft.phone ?? "", email: state?.draft.email ?? "" }}
        onRegister={value => action({ action: "register", revision: state?.revision, ...value })} onAttach={() => void action({ action: "attach" })} />}
      {state?.accountReady && <Link className="flex min-h-11 items-center underline" href="/client/requests">{copy.requests}</Link>}
      </div>
    </Dialog>}
  </section>;
}
