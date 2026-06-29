"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { Button, MaterialSymbol, Select, Textarea, TextInput } from "@/components/ui";
import { getPublicContent, type PublicContent } from "@/content/public-content";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";
import {
  publicMotionButton,
  publicMotionControl,
  publicMotionCta,
  publicMotionForm,
  publicMotionStatus
} from "@/features/public-site/public-motion";

type BookingDraft = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  serviceCategory: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  preferredMode: "PHONE" | "ONLINE" | "OFFICE";
  summary: string;
  preferredSlot: string;
  consent: boolean;
};

type InquiryDraft = {
  reference: string;
  phone: string;
  email: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "error" | "success";
};

type ChatMode = "idle" | "booking" | "inquiry";
type BookingStep = "contact" | "details" | "review";
type BookingFormCopy = PublicContent["bookingForm"];
type BookingChatCopy = PublicContent["bookingChat"];

type ApiBody = {
  data?: {
    reference?: string;
    message?: string;
    appointment?: { title: string; startsAt: string; status: string };
    appointments?: Array<{ title: string; startsAt: string; status: string }>;
  };
  error?: {
    message?: string;
    requestId?: string;
  };
};

const MIN_SUMMARY_LENGTH = 20;

const darkSurfaceClasses = cn(
  publicMotionForm,
  "relative isolate overflow-hidden rounded-[1.75rem] border border-kmt-gold/45 bg-[linear-gradient(145deg,#17110a_0%,#090b0d_48%,#020202_100%),radial-gradient(circle_at_top_left,rgba(183,134,64,0.16),transparent_34%)] shadow-[0_34px_120px_-54px_rgba(183,134,64,0.42)] before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-kmt-gold/80 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:rounded-[1.75rem] after:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_80px_rgba(183,134,64,0.04)]"
);

const darkControlClasses = cn(
  publicMotionControl,
  "!border-kmt-gold/25 !bg-black/35 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!border-white/10 disabled:!bg-black/40 disabled:!text-slate-500"
);

const chipButtonClasses = cn(
  publicMotionButton,
  "min-h-11 rounded-full !border-kmt-gold/45 !bg-black/30 !px-4 !text-sm !text-amber-100 shadow-[0_12px_35px_-28px_rgba(183,134,64,0.9)] hover:!bg-kmt-gold hover:!text-[#120d07]"
);

const secondaryButtonClasses = cn(
  publicMotionButton,
  "!border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-[#120d07]"
);

const initialDraft: BookingDraft = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  serviceCategory: "corporate",
  urgency: "NORMAL",
  preferredMode: "PHONE",
  summary: "",
  preferredSlot: "",
  consent: false
};

const initialInquiry: InquiryDraft = {
  reference: "",
  phone: "",
  email: ""
};

export function ConsultationBookingChat({ initialService, locale = "en" }: { initialService?: string; locale?: PublicLocale }) {
  const content = getPublicContent(locale);
  const copy = content.bookingChat;
  const bookingCopy = content.bookingForm;
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ id: "greeting", role: "assistant", text: copy.greeting }]);
  const [mode, setMode] = useState<ChatMode>("idle");
  const [bookingStep, setBookingStep] = useState<BookingStep>("contact");
  const [draft, setDraft] = useState<BookingDraft>(() => ({ ...initialDraft, serviceCategory: initialService || initialDraft.serviceCategory }));
  const [inquiry, setInquiry] = useState<InquiryDraft>(initialInquiry);
  const [freeMessage, setFreeMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, mode, bookingStep, isBusy]);

  const categoryOptions = useMemo(() => Object.entries(bookingCopy.categories), [bookingCopy.categories]);

  function append(role: ChatMessage["role"], text: string, tone: ChatMessage["tone"] = "default") {
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${current.length}`, role, text, tone }]);
  }

  function appendAssistantError(message: string) {
    append("assistant", message, "error");
  }

  function startBooking() {
    setMode("booking");
    setBookingStep("contact");
    append("user", copy.book);
    append("assistant", copy.contactPrompt);
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_contact", locale });
  }

  function startBookingWithCategory(label: string, category: string) {
    setDraft((current) => ({ ...current, serviceCategory: category }));
    setMode("booking");
    setBookingStep("contact");
    append("user", label);
    append("assistant", copy.contactPrompt);
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_contact", locale, category });
  }

  function startInquiry() {
    setMode("inquiry");
    append("user", copy.inquire);
    append("assistant", copy.inquiryPrompt);
  }

  function submitFreeMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = freeMessage.trim();
    if (!text) return;
    append("user", text);
    setFreeMessage("");

    if (looksLikeLegalAdvice(text)) {
      append("assistant", copy.legalRefusal);
      return;
    }
    if (looksLikeInquiry(text)) {
      setMode("inquiry");
      append("assistant", copy.inquiryPrompt);
      return;
    }
    if (looksLikeBooking(text)) {
      setMode("booking");
      setBookingStep("contact");
      append("assistant", copy.contactPrompt);
      trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_contact", locale });
      return;
    }

    append("assistant", copy.scopeReply);
  }

  function updateDraft<K extends keyof BookingDraft>(key: K, value: BookingDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateInquiry<K extends keyof InquiryDraft>(key: K, value: InquiryDraft[K]) {
    setInquiry((current) => ({ ...current, [key]: value }));
  }

  function continueContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.fullName.trim().length < 2 || draft.phone.trim().length < 6) {
      appendAssistantError(copy.requiredContact);
      return;
    }
    append("user", `${draft.fullName} · ${draft.phone}`);
    append("assistant", copy.detailsPrompt);
    setBookingStep("details");
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_details", locale });
  }

  function continueDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.serviceCategory || draft.summary.trim().length < MIN_SUMMARY_LENGTH) {
      appendAssistantError(copy.requiredDetails);
      return;
    }
    append("user", `${categoryLabel(bookingCopy, draft.serviceCategory)} · ${draft.summary}`);
    append("assistant", copy.reviewPrompt);
    setBookingStep("review");
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_review", locale });
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.consent) {
      appendAssistantError(copy.requiredConsent);
      return;
    }

    setIsBusy(true);
    trackClientAnalyticsEvent("booking.submit_attempted", { locale, source: draft.preferredSlot ? "chat_appointment" : "chat_request" });
    try {
      const hasSlot = Boolean(draft.preferredSlot);
      const response = await fetch(hasSlot ? "/api/public/consultations/assistant" : `/api/public/consultations?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasSlot
            ? {
                locale,
                intent: "book_consultation_appointment",
                message: draft.summary,
                fullName: draft.fullName,
                phone: draft.phone,
                email: draft.email,
                city: draft.city,
                serviceCategory: draft.serviceCategory,
                summary: draft.summary,
                urgency: draft.urgency,
                preferredMode: draft.preferredMode,
                startsAt: `${draft.preferredSlot}:00+03:00`,
                consent: true
              }
            : {
                locale,
                fullName: draft.fullName,
                phone: draft.phone,
                email: draft.email,
                city: draft.city,
                serviceCategory: draft.serviceCategory,
                summary: draft.summary,
                opposingPartyName: "",
                urgency: draft.urgency,
                preferredMode: draft.preferredMode,
                consent: true
              }
        )
      });
      const body = (await response.json().catch(() => ({}))) as ApiBody;
      if (!response.ok) {
        trackClientAnalyticsEvent("booking.submit_failed", { locale, status: response.status });
        appendAssistantError(errorMessage(body, copy));
        return;
      }
      const reference = body.data?.reference ?? "";
      append("assistant", `${copy.successTitle}${reference ? ` · ${copy.reference}: ${reference}` : ""}`, "success");
      if (body.data?.appointment) {
        append("assistant", `${body.data.appointment.title} · ${formatPublicDate(body.data.appointment.startsAt, locale)}`, "success");
      }
      setMode("idle");
      setDraft({ ...initialDraft, serviceCategory: initialService || initialDraft.serviceCategory });
    } catch {
      trackClientAnalyticsEvent("booking.submit_failed", { locale, status: "network" });
      appendAssistantError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      const response = await fetch("/api/public/consultations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          intent: "appointment_inquiry",
          message: "appointment inquiry",
          reference: inquiry.reference,
          phone: inquiry.phone,
          email: inquiry.email
        })
      });
      const body = (await response.json().catch(() => ({}))) as ApiBody;
      if (!response.ok) {
        appendAssistantError(errorMessage(body, copy));
        return;
      }
      append("assistant", body.data?.message ?? copy.inquiryResult, "success");
      for (const appointment of body.data?.appointments ?? []) {
        append("assistant", `${appointment.title} · ${formatPublicDate(appointment.startsAt, locale)} · ${appointment.status}`, "success");
      }
      setMode("idle");
      setInquiry(initialInquiry);
    } catch {
      appendAssistantError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section
      aria-label={copy.title}
      className={darkSurfaceClasses}
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="booking-stepper"
    >
      <div className="relative z-10 flex min-h-[42rem] flex-col" data-testid="booking-chat-shell">
        <header className="px-5 pb-4 pt-5 sm:px-8 sm:pt-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <KmtBrandLogo label={copy.assistantName} shape="circle" size="lg" variant="mark" />
              <div className="min-w-0">
                <p className="truncate font-serif text-[1.9rem] font-semibold leading-tight text-white max-sm:text-xl">{copy.assistantName}</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#7ad36a]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#7ad36a] shadow-[0_0_16px_rgba(122,211,106,0.85)]" aria-hidden="true" />
                  {copy.onlineNow}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-1.5 text-amber-50">
            <TrustRailItem icon="person_check" label={copy.humanReviewOnly} />
            <TrustRailItem icon="shield" label={copy.noLegalAdvice} />
            <TrustRailItem icon="lock" label={copy.secureConfidential} />
            <TrustRailItem icon="supervisor_account" label={copy.humanReviewBadge} />
            <TrustRailItem icon="bolt" label={copy.fastResponse} />
          </div>
        </header>

        <div
          aria-busy={isBusy ? "true" : "false"}
          className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-8"
          data-testid="booking-chat-log"
          role="log"
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {isBusy ? <TypingIndicator label={copy.typing} /> : null}
          {mode !== "idle" ? (
            <div className="flex justify-start">
              <div className="w-full max-w-2xl">
                {mode === "booking" && bookingStep === "contact" ? renderContactStep() : null}
                {mode === "booking" && bookingStep === "details" ? renderDetailsStep() : null}
                {mode === "booking" && bookingStep === "review" ? renderReviewStep() : null}
                {mode === "inquiry" ? renderInquiryStep() : null}
              </div>
            </div>
          ) : null}
          <div ref={logEndRef} />
        </div>

        <div className="px-5 pb-5 sm:px-8 sm:pb-8">
          {mode === "idle" ? (
            <div className="mb-5 flex flex-wrap gap-3">
              <Button className={chipButtonClasses} data-testid="booking-quick-book" size="sm" type="button" variant="secondary" onClick={startBooking}>
                <MaterialSymbol className="text-xl" name="event_available" />
                {copy.book}
              </Button>
              <Button className={chipButtonClasses} data-testid="booking-quick-inquiry" size="sm" type="button" variant="secondary" onClick={startInquiry}>
                <MaterialSymbol className="text-xl" name="search" />
                {copy.inquire}
              </Button>
              <Button className={chipButtonClasses} size="sm" type="button" variant="secondary" onClick={() => startBookingWithCategory(copy.corporateLaw, "corporate")}>
                <MaterialSymbol className="text-xl" name="account_balance" />
                {copy.corporateLaw}
              </Button>
              <Button className={chipButtonClasses} size="sm" type="button" variant="secondary" onClick={() => startBookingWithCategory(copy.litigation, "disputes")}>
                <MaterialSymbol className="text-xl" name="gavel" />
                {copy.litigation}
              </Button>
            </div>
          ) : null}

          <form className="flex min-w-0 items-end gap-3" data-testid="booking-chat-composer" noValidate onSubmit={submitFreeMessage}>
            <div className="min-w-0 flex-1 [&_label]:sr-only">
              <TextInput
                className={cn(darkControlClasses, "!min-h-16 !rounded-full !border-kmt-gold/55 !bg-black/42 !px-6 !text-base")}
                disabled={isBusy}
                label={copy.messageLabel}
                name="chatMessage"
                placeholder={copy.messagePlaceholder}
                value={freeMessage}
                onChange={(event) => setFreeMessage(event.target.value)}
              />
            </div>
            <Button
              aria-label={copy.send}
              className={cn(publicMotionButton, publicMotionCta, "mb-0 h-16 w-16 shrink-0 rounded-full !px-0 shadow-[0_16px_45px_-24px_rgba(183,134,64,1)]")}
              disabled={isBusy || !freeMessage.trim()}
              type="submit"
            >
              <MaterialSymbol className="text-xl" name="send" />
              <span className="sr-only">{copy.send}</span>
            </Button>
          </form>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-amber-100/65">
            <MaterialSymbol className="text-lg" name="lock" />
            {copy.privacyNote}
          </p>
        </div>
      </div>
    </section>
  );

  function renderContactStep() {
    return (
      <StepCard icon="person" prompt={copy.contactPrompt} title={copy.contactTitle}>
        <form className="grid gap-3 md:grid-cols-2" noValidate onSubmit={continueContact}>
          <TextInput className={darkControlClasses} label={bookingCopy.fullName} name="fullName" value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} required />
          <TextInput className={darkControlClasses} label={bookingCopy.phone} name="phone" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} required />
          <TextInput className={darkControlClasses} label={bookingCopy.email} name="email" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} />
          <TextInput className={darkControlClasses} label={bookingCopy.city} name="city" value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />
          <div className="md:col-span-2">
            <Button className={cn(publicMotionButton, publicMotionCta)} disabled={isBusy} type="submit">
              {copy.continue}
            </Button>
          </div>
        </form>
      </StepCard>
    );
  }

  function renderDetailsStep() {
    return (
      <StepCard icon="edit_note" prompt={copy.detailsPrompt} title={copy.detailsTitle}>
        <form className="grid gap-3" noValidate onSubmit={continueDetails}>
          <div className="grid gap-3 md:grid-cols-3">
            <Select className={darkControlClasses} label={bookingCopy.serviceCategory} name="serviceCategory" value={draft.serviceCategory} onChange={(event) => updateDraft("serviceCategory", event.target.value)}>
              {categoryOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select className={darkControlClasses} label={bookingCopy.urgency} name="urgency" value={draft.urgency} onChange={(event) => updateDraft("urgency", event.target.value as BookingDraft["urgency"])}>
              {Object.entries(bookingCopy.urgencyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Select className={darkControlClasses} label={bookingCopy.preferredMode} name="preferredMode" value={draft.preferredMode} onChange={(event) => updateDraft("preferredMode", event.target.value as BookingDraft["preferredMode"])}>
              {Object.entries(bookingCopy.preferredModeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            className={darkControlClasses}
            hint={draft.summary.length < MIN_SUMMARY_LENGTH ? bookingCopy.summaryHintShort.replace("{count}", String(Math.max(0, MIN_SUMMARY_LENGTH - draft.summary.length))) : bookingCopy.summaryHintReady}
            label={bookingCopy.summary}
            name="summary"
            value={draft.summary}
            onChange={(event) => updateDraft("summary", event.target.value)}
            required
          />
          <TextInput
            className={darkControlClasses}
            hint={copy.preferredSlotHint}
            label={copy.preferredSlot}
            name="preferredSlot"
            type="datetime-local"
            value={draft.preferredSlot}
            onChange={(event) => updateDraft("preferredSlot", event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button className={cn(publicMotionButton, publicMotionCta)} disabled={isBusy} type="submit">
              {copy.continue}
            </Button>
            <Button className={secondaryButtonClasses} disabled={isBusy} type="button" variant="secondary" onClick={() => setBookingStep("contact")}>
              {copy.back}
            </Button>
          </div>
        </form>
      </StepCard>
    );
  }

  function renderReviewStep() {
    return (
      <StepCard icon="task_alt" prompt={copy.reviewPrompt} title={copy.reviewTitle}>
        <form className="space-y-4" noValidate onSubmit={submitBooking}>
          <div className="grid gap-2 rounded border border-white/10 bg-black/25 p-3 text-sm leading-7 text-slate-200 sm:grid-cols-2">
            <ReviewRow label={bookingCopy.reviewLabels.name} value={draft.fullName} />
            <ReviewRow label={bookingCopy.reviewLabels.phone} value={draft.phone} />
            <ReviewRow label={bookingCopy.reviewLabels.category} value={categoryLabel(bookingCopy, draft.serviceCategory)} />
            <ReviewRow label={bookingCopy.reviewLabels.mode} value={bookingCopy.preferredModeLabels[draft.preferredMode]} />
            <ReviewRow label={copy.preferredSlot} value={draft.preferredSlot ? formatPublicDate(draft.preferredSlot, locale) : copy.noSlot} />
            <ReviewRow label={bookingCopy.reviewLabels.summary} value={draft.summary} />
          </div>
          <label className="flex items-start gap-3 rounded border border-white/10 bg-white/[0.03] p-3 text-sm leading-7 text-slate-200">
            <input
              checked={draft.consent}
              className="mt-2 h-4 w-4 rounded border-kmt-gold/40 bg-black text-kmt-gold focus:ring-kmt-gold"
              id="booking-consent"
              type="checkbox"
              onChange={(event) => updateDraft("consent", event.target.checked)}
            />
            <span>{copy.consent}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button className={cn(publicMotionButton, publicMotionCta)} loading={isBusy} type="submit">
              {draft.preferredSlot ? copy.submitBooking : copy.submitRequest}
            </Button>
            <Button className={secondaryButtonClasses} disabled={isBusy} type="button" variant="secondary" onClick={() => setBookingStep("details")}>
              {copy.back}
            </Button>
          </div>
        </form>
      </StepCard>
    );
  }

  function renderInquiryStep() {
    return (
      <StepCard icon="manage_search" prompt={copy.inquiryPrompt} title={copy.inquiryTitle}>
        <form className="grid gap-3 md:grid-cols-3" noValidate onSubmit={submitInquiry}>
          <TextInput className={darkControlClasses} dir="ltr" label={copy.reference} name="reference" placeholder="CONS-XXXXXXXX" value={inquiry.reference} onChange={(event) => updateInquiry("reference", event.target.value)} required />
          <TextInput className={darkControlClasses} label={bookingCopy.phone} name="phone" value={inquiry.phone} onChange={(event) => updateInquiry("phone", event.target.value)} />
          <TextInput className={darkControlClasses} label={bookingCopy.email} name="email" type="email" value={inquiry.email} onChange={(event) => updateInquiry("email", event.target.value)} />
          <div className="flex flex-wrap gap-2 md:col-span-3">
            <Button className={cn(publicMotionButton, publicMotionCta)} loading={isBusy} type="submit">
              {copy.submitInquiry}
            </Button>
            <Button className={secondaryButtonClasses} disabled={isBusy} type="button" variant="secondary" onClick={() => setMode("idle")}>
              {copy.back}
            </Button>
          </div>
        </form>
      </StepCard>
    );
  }
}

function TrustRailItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex min-h-8 max-w-full items-center justify-center gap-1 rounded-full border border-kmt-gold/25 bg-[#12100c]/72 px-2 text-center shadow-[0_12px_26px_-24px_rgba(183,134,64,0.9)] transition-colors hover:border-kmt-gold/40 hover:bg-[#17130d]/82">
      <MaterialSymbol className="shrink-0 text-sm text-kmt-gold drop-shadow-[0_0_10px_rgba(183,134,64,0.26)]" name={icon} />
      <span className="min-w-0 truncate text-[0.68rem] font-medium leading-4 text-amber-50/90">{label}</span>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-end gap-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        message.tone === "error" || message.tone === "success" ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-kmt-gold/40 bg-[linear-gradient(145deg,rgba(183,134,64,0.18),rgba(0,0,0,0.35))] text-kmt-gold shadow-[0_14px_35px_-28px_rgba(183,134,64,1)] max-sm:h-9 max-sm:w-9">
            <MaterialSymbol className="text-2xl max-sm:text-lg" name={message.tone === "error" ? "error" : "check_circle"} />
          </span>
        ) : (
          <KmtBrandLogo className="max-sm:[&_span]:h-9 max-sm:[&_span]:w-9" label="" shape="circle" size="md" variant="mark" />
        )
      ) : null}
      <p
        className={cn(
          "max-w-[78%] break-words rounded-[1.45rem] px-6 py-4 text-base leading-8 shadow-[0_22px_60px_-42px_rgba(0,0,0,0.95)] max-sm:max-w-[86%] max-sm:px-4 max-sm:py-3 max-sm:text-sm",
          isUser
            ? "rounded-ee-md border border-kmt-gold/45 bg-[linear-gradient(135deg,#c79a4b,#a87429)] text-white"
            : "rounded-es-md border border-white/12 bg-white/[0.075] text-slate-100",
          message.tone === "error" ? "border-red-300/35 bg-red-950/55 text-red-100" : undefined,
          message.tone === "success" ? "border-emerald-300/35 bg-emerald-950/40 text-emerald-50" : undefined
        )}
        role={message.tone === "error" ? "alert" : undefined}
      >
        {message.text}
      </p>
    </div>
  );
}

function StepCard({ children, icon, prompt, title }: { children: ReactNode; icon: string; prompt: string; title: string }) {
  return (
    <section
      className={cn(
        publicMotionStatus,
        "rounded-[1.35rem] rounded-es-md border border-kmt-gold/28 bg-[#090806]/92 p-5 shadow-[0_22px_70px_-46px_rgba(0,0,0,0.95)]"
      )}
      data-testid="booking-chat-step-card"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kmt-gold/35 bg-kmt-gold/12 text-kmt-gold">
          <MaterialSymbol className="text-xl" name={icon} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-7 text-slate-300">{prompt}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 text-slate-300">
      <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" />
      <div className="flex items-center gap-2 rounded-2xl rounded-es-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-xs">
        <span>{label}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-kmt-gold [animation-delay:240ms]" />
        </span>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-amber-100">{label}</p>
      <p className="mt-1 break-words text-slate-100">{value}</p>
    </div>
  );
}

function categoryLabel(copy: BookingFormCopy, value: string) {
  return copy.categories[value as keyof typeof copy.categories] ?? value;
}

function looksLikeBooking(value: string) {
  return /book|consultation|appointment|حجز|احجز|استشارة|موعد/.test(normalizeText(value));
}

function looksLikeInquiry(value: string) {
  return /reference|inquiry|check|cons-|مرجع|استعلام|رقم/.test(normalizeText(value));
}

function looksLikeLegalAdvice(value: string) {
  return /legal advice|will i win|what should i do|case outcome|interpret|رأيك|رايك|هكسب|اكسب|اعمل ايه|اعمل إيه|فسر|تفسير/.test(normalizeText(value));
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function formatPublicDate(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function errorMessage(body: ApiBody, copy: BookingChatCopy) {
  const message = body.error?.message ?? copy.fallbackError;
  return body.error?.requestId ? `${message} · ${copy.requestId}: ${body.error.requestId}` : message;
}
