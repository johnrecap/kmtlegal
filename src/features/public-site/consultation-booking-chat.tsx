"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { Button, MaterialSymbol, TextInput } from "@/components/ui";
import { findPublicService, getPublicContent, type PublicContent } from "@/content/public-content";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";
import {
  bookingModeLabel as modeLabel,
  formatPublicDate,
  formatPublicMoney,
  formatPublicTime,
  formatServiceCategory,
  groupSlotsByDay
} from "@/features/public-site/booking-chat-formatters";
import {
  publicMotionButton,
  publicMotionControl,
  publicMotionCta,
  publicMotionForm
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
  startsAt: string;
  availabilityPreference: AvailabilityPreference;
};

type AvailabilityPreference = {
  date: string;
  label: string;
  timeWindow: "MORNING" | "AFTERNOON" | "EVENING" | "ANYTIME" | "";
  fromTime: string;
  toTime: string;
};

type SlotWindow = AvailabilityPreference & { alternatives?: boolean };

type PublicSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  mode: BookingDraft["preferredMode"];
};

type PaymentReview = {
  amount: string;
  currency: string;
  pricingRuleId: string;
  priceVersion: number;
  serviceCategory: string;
  mode: BookingDraft["preferredMode"];
  label: string | null;
};

type PublicPaymentAttempt = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  checkoutUrl: string | null;
  expiresAt: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "error" | "success";
  actionHref?: string;
  actionLabel?: string;
};

type ClientAccountSetupAction = {
  status: "setup_available" | "existing_account";
  setupUrl?: string;
  loginUrl?: string;
  expiresAt?: string;
  email?: string | null;
};

type AssistantApiBody = {
  data?: {
    action?: string;
    message?: string;
    draft?: Partial<BookingDraft>;
    missingFields?: string[];
    availableSlots?: PublicSlot[];
    needsAvailabilityPreference?: boolean;
    slotWindow?: SlotWindow;
    readyToConfirm?: boolean;
    readyToCheckout?: boolean;
    paymentReview?: PaymentReview;
    paymentAttempt?: PublicPaymentAttempt;
    reference?: string;
    appointment?: { title: string; startsAt: string; status: string };
    appointments?: Array<{ title: string; startsAt: string; status: string }>;
    clientAccountSetup?: ClientAccountSetupAction | null;
  };
  error?: {
    message?: string;
    requestId?: string;
  };
};

type BookingChatCopy = PublicContent["bookingChat"];

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

const initialDraft: BookingDraft = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  serviceCategory: "",
  urgency: "NORMAL",
  preferredMode: "ONLINE",
  summary: "",
  startsAt: "",
  availabilityPreference: {
    date: "",
    label: "",
    timeWindow: "",
    fromTime: "",
    toTime: ""
  }
};

export function ConsultationBookingChat({ initialService, locale = "en" }: { initialService?: string; locale?: PublicLocale }) {
  const [chatLocale, setChatLocale] = useState<PublicLocale | null>(null);
  const activeLocale = chatLocale ?? locale;
  const content = getPublicContent(activeLocale);
  const copy = content.bookingChat;
  const logScrollRef = useRef<HTMLDivElement | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "language-prompt", role: "assistant", text: getPublicContent(locale).bookingChat.languagePrompt }
  ]);
  const initialServiceCategory = categoryFromInitialService(initialService, locale);
  const [draft, setDraft] = useState<BookingDraft>(() => ({ ...initialDraft, serviceCategory: initialServiceCategory }));
  const [freeMessage, setFreeMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [flow, setFlow] = useState<"booking" | "inquiry" | null>(null);
  const [availableSlots, setAvailableSlots] = useState<PublicSlot[]>([]);
  const [slotWindow, setSlotWindow] = useState<SlotWindow | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  const [readyToCheckout, setReadyToCheckout] = useState(false);
  const [paymentReview, setPaymentReview] = useState<PaymentReview | null>(null);
  const [freeTextTurnsAfterLanguage, setFreeTextTurnsAfterLanguage] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [quickActionsDismissed, setQuickActionsDismissed] = useState(false);
  const showTrustRail = !chatLocale;
  const showQuickActions = Boolean(chatLocale) && !quickActionsDismissed && !flow && !availableSlots.length && !readyToConfirm && !readyToCheckout;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const resumeAttemptId = params.get("resumeAttemptId");
    const token = params.get("token");
    if (!resumeAttemptId || !token) {
      return;
    }

    let stopped = false;
    const restore = async () => {
      const statusParams = new URLSearchParams({ attemptId: resumeAttemptId, token });
      const response = await fetch(`/api/public/payments/status?${statusParams.toString()}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as { data?: { resumeDraft?: Partial<BookingDraft> | null } } | null;
      const resumeDraft = body?.data?.resumeDraft;
      if (stopped || !response.ok || !resumeDraft) {
        return;
      }

      const restoredLocale = params.get("locale") === "ar" || params.get("locale") === "en" ? (params.get("locale") as PublicLocale) : locale;
      const restoredCopy = getPublicContent(restoredLocale).bookingChat;
      const restoredDraft = normalizeDraft({
        ...initialDraft,
        serviceCategory: initialServiceCategory,
        ...resumeDraft,
        startsAt: ""
      });

      setChatLocale(restoredLocale);
      setDraft(restoredDraft);
      setFlow("booking");
      setAvailableSlots([]);
      setSlotWindow(null);
      setSelectedSlot("");
      setReadyToConfirm(false);
      setReadyToCheckout(false);
      setPaymentReview(null);
      setQuickActionsDismissed(true);
      setMessages([
        { id: `assistant-greeting-${restoredLocale}`, role: "assistant", text: restoredCopy.greeting },
        { id: `assistant-payment-resume-${restoredLocale}`, role: "assistant", text: restoredCopy.resumePaymentDraft, tone: "success" }
      ]);
    };

    void restore();
    return () => {
      stopped = true;
    };
  }, [initialServiceCategory, isHydrated, locale]);

  useEffect(() => {
    const chatLog = logScrollRef.current;
    if (!chatLog) return undefined;

    const frame = window.requestAnimationFrame(() => {
      chatLog.scrollTop = chatLog.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, availableSlots, readyToConfirm, readyToCheckout, isBusy]);

  function append(role: ChatMessage["role"], text: string, tone: ChatMessage["tone"] = "default", action?: Pick<ChatMessage, "actionHref" | "actionLabel">) {
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${current.length}`, role, text, tone, ...action }]);
  }

  function appendRecoverableError(message: string) {
    append("assistant", message, "error");
    const nextFailureCount = failureCount + 1;
    setFailureCount(nextFailureCount);
    if (nextFailureCount >= 2) {
      append("assistant", copy.whatsappFallback, "default", {
        actionHref: process.env.NEXT_PUBLIC_KMT_WHATSAPP_URL || "/contact",
        actionLabel: copy.whatsappFallbackLabel
      });
    }
  }

  function appendClientAccountSetupMessage(action: ClientAccountSetupAction | null) {
    if (!action) {
      return;
    }

    if (action.status === "setup_available" && action.setupUrl) {
      append("assistant", content.clientAccountSetup.chatSetupPrompt, "success", {
        actionHref: action.setupUrl,
        actionLabel: content.clientAccountSetup.submit
      });
      return;
    }

    if (action.status === "existing_account" && action.loginUrl) {
      append("assistant", content.clientAccountSetup.chatExistingPrompt, "success", {
        actionHref: action.loginUrl,
        actionLabel: content.clientAccountSetup.login
      });
    }
  }

  function chooseLanguage(nextLocale: PublicLocale) {
    const nextCopy = getPublicContent(nextLocale).bookingChat;
    setChatLocale(nextLocale);
    setFlow(null);
    setAvailableSlots([]);
    setSlotWindow(null);
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);
    setSelectedSlot("");
    setFreeTextTurnsAfterLanguage(0);
    setQuickActionsDismissed(false);
    setMessages((current) => [
      ...current,
      { id: `user-language-${nextLocale}`, role: "user", text: nextLocale === "ar" ? nextCopy.languageArabic : nextCopy.languageEnglish },
      { id: `assistant-greeting-${nextLocale}`, role: "assistant", text: nextCopy.greeting }
    ]);
  }

  function startBooking() {
    if (!chatLocale) return;
    setQuickActionsDismissed(true);
    void sendBookingMessage(copy.book, { userText: copy.book, flow: "booking" });
  }

  function startBookingWithCategory(label: string, category: string) {
    if (!chatLocale) return;
    setQuickActionsDismissed(true);
    void sendBookingMessage(label, { userText: label, flow: "booking", draftPatch: { serviceCategory: category } });
  }

  function startInquiry() {
    if (!chatLocale) return;
    setQuickActionsDismissed(true);
    setFlow("inquiry");
    setAvailableSlots([]);
    setSlotWindow(null);
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);
    append("user", copy.inquire);
    append("assistant", copy.inquiryPrompt);
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = freeMessage.trim();
    if (!text || isBusy) return;
    if (!chatLocale) return;
    setFreeMessage("");
    const nextFreeTextTurns = freeTextTurnsAfterLanguage + 1;
    setFreeTextTurnsAfterLanguage(nextFreeTextTurns);
    if (nextFreeTextTurns >= 2) {
      setQuickActionsDismissed(true);
    }

    if (looksLikeLegalAdvice(text)) {
      append("user", text);
      append("assistant", copy.legalRefusal);
      return;
    }

    if (flow === "inquiry" || looksLikeInquiry(text)) {
      await submitInquiryMessage(text);
      return;
    }

    await sendBookingMessage(text, { userText: text, flow: "booking" });
  }

  async function submitInquiryMessage(text: string) {
    append("user", text);
    const inquiry = inquiryFromMessage(text);
    if (!inquiry.reference || (!inquiry.phone && !inquiry.email)) {
      setFlow("inquiry");
      append("assistant", copy.inquiryPrompt);
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/public/consultations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: activeLocale,
          intent: "appointment_inquiry",
          message: text,
          reference: inquiry.reference,
          phone: inquiry.phone,
          email: inquiry.email
        })
      });
      const body = (await response.json().catch(() => ({}))) as AssistantApiBody;
      if (!response.ok) {
        appendRecoverableError(errorMessage(body, copy));
        return;
      }
      setFailureCount(0);
      append("assistant", body.data?.message ?? copy.inquiryResult, "success");
      for (const appointment of body.data?.appointments ?? []) {
        append("assistant", `${appointment.title} · ${formatPublicDate(appointment.startsAt, activeLocale)} · ${appointment.status}`, "success");
      }
      setFlow(null);
    } catch {
      appendRecoverableError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  async function sendBookingMessage(
    message: string,
    options: {
      userText?: string;
      flow?: "booking";
      draftPatch?: Partial<BookingDraft>;
      selectedSlot?: string;
      confirmBooking?: boolean;
    } = {}
  ) {
    if (options.userText) {
      append("user", options.userText);
    }
    setFlow(options.flow ?? "booking");
    setIsBusy(true);
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);

    const nextDraft = normalizeDraft({ ...draft, ...options.draftPatch });
    const nextSlot = options.selectedSlot ?? selectedSlot ?? nextDraft.startsAt;

    try {
      const response = await fetch("/api/public/consultations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: activeLocale,
          message,
          draft: nextDraft,
          selectedSlot: nextSlot,
          confirmBooking: options.confirmBooking
        })
      });
      const body = (await response.json().catch(() => ({}))) as AssistantApiBody;
      if (!response.ok) {
        trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: response.status });
        appendRecoverableError(errorMessage(body, copy));
        return;
      }

      const data = body.data;
      if (!data) {
        appendRecoverableError(copy.fallbackError);
        return;
      }

      setFailureCount(0);
      const updatedDraft = normalizeDraft({ ...nextDraft, ...data.draft });
      setDraft(updatedDraft);
      setAvailableSlots(data.availableSlots ?? []);
      setSlotWindow(data.slotWindow ?? null);
      setSelectedSlot(updatedDraft.startsAt || nextSlot || "");
      setReadyToConfirm(Boolean(data.readyToConfirm));
      setReadyToCheckout(Boolean(data.readyToCheckout));
      setPaymentReview(data.paymentReview ?? null);
      append("assistant", data.message ?? copy.scopeReply, data.reference ? "success" : "default");

      if (data.reference) {
        append("assistant", `${copy.successTitle} · ${copy.reference}: ${data.reference}`, "success");
        append("assistant", copy.nextStepsAfterBooking, "success");
        if (data.appointment) {
          append("assistant", `${data.appointment.title} · ${formatPublicDate(data.appointment.startsAt, activeLocale)}`, "success");
        }
        appendClientAccountSetupMessage(data.clientAccountSetup ?? null);
        setFlow(null);
        setAvailableSlots([]);
        setSlotWindow(null);
        setSelectedSlot("");
        setReadyToConfirm(false);
        setReadyToCheckout(false);
        setPaymentReview(null);
        setQuickActionsDismissed(true);
        setDraft({ ...initialDraft, serviceCategory: initialServiceCategory });
      }
    } catch {
      trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: "network" });
      appendRecoverableError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  function chooseSlot(slot: PublicSlot) {
    const label = formatPublicDate(slot.startsAt, activeLocale);
    setSelectedSlot(slot.startsAt);
    setAvailableSlots([]);
    setSlotWindow(null);
    void sendBookingMessage(label, {
      userText: label,
      flow: "booking",
      selectedSlot: slot.startsAt,
      draftPatch: { startsAt: slot.startsAt, preferredMode: slot.mode }
    });
  }

  function confirmBooking() {
    if (!selectedSlot || isBusy) return;
    void sendBookingMessage(copy.submitBooking, {
      userText: copy.submitBooking,
      flow: "booking",
      selectedSlot,
      confirmBooking: true
    });
  }

  async function payBooking() {
    if (!selectedSlot || !paymentReview || isBusy) return;
    setIsBusy(true);
    append("user", copy.payBooking);
    const checkoutDraft = normalizeDraft({ ...draft, startsAt: selectedSlot });

    try {
      const response = await fetch("/api/public/consultations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: activeLocale,
          message: copy.payBooking,
          draft: checkoutDraft,
          selectedSlot,
          consent: true,
          confirmPayment: true
        })
      });
      const body = (await response.json().catch(() => ({}))) as AssistantApiBody;
      if (!response.ok) {
        trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: response.status, step: "checkout" });
        appendRecoverableError(errorMessage(body, copy));
        return;
      }

      setFailureCount(0);
      const attempt = body.data?.paymentAttempt;
      append("assistant", body.data?.message ?? copy.checkoutCreated, "success");
      if (body.data?.reference) {
        append("assistant", `${copy.reference}: ${body.data.reference}`, "success");
      }

      if (attempt?.checkoutUrl) {
        window.location.assign(attempt.checkoutUrl);
        return;
      }

      setReadyToCheckout(false);
      setPaymentReview(null);
    } catch {
      trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: "network", step: "checkout" });
      appendRecoverableError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  function editDetails() {
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);
    setSelectedSlot("");
    setDraft((current) => ({ ...current, startsAt: "" }));
    setSlotWindow(null);
    append("assistant", copy.scopeReply);
  }

  return (
    <section
      aria-label={copy.title}
      className={darkSurfaceClasses}
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="booking-stepper"
      dir={activeLocale === "ar" ? "rtl" : "ltr"}
    >
      <div className="relative z-10 flex h-[min(78vh,46rem)] min-h-[36rem] min-w-0 flex-col max-sm:h-[min(82svh,44rem)] max-sm:min-h-[34rem]" data-testid="booking-chat-shell">
        <header className="shrink-0 px-5 pb-4 pt-5 sm:px-8 sm:pt-8">
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

          {showTrustRail ? (
            <div className="mt-5 flex flex-wrap items-center gap-1.5 text-amber-50" data-testid="booking-trust-rail">
              <TrustRailItem icon="person_check" label={copy.humanReviewOnly} />
              <TrustRailItem icon="shield" label={copy.noLegalAdvice} />
              <TrustRailItem icon="lock" label={copy.secureConfidential} />
              <TrustRailItem icon="supervisor_account" label={copy.humanReviewBadge} />
              <TrustRailItem icon="bolt" label={copy.fastResponse} />
            </div>
          ) : null}
          {chatLocale ? <BookingProgress copy={copy} draft={draft} readyToCheckout={readyToCheckout} selectedSlot={selectedSlot} /> : null}
        </header>

        <div
          ref={logScrollRef}
          aria-busy={isBusy ? "true" : "false"}
          className="kmt-chat-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8"
          data-testid="booking-chat-log"
          role="log"
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          {!chatLocale ? <LanguageChoicePanel copy={copy} onSelect={chooseLanguage} /> : null}
          {availableSlots.length ? <SlotChoicePanel locale={activeLocale} slotWindow={slotWindow ?? undefined} slots={availableSlots} onChoose={chooseSlot} /> : null}
          {readyToConfirm ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button className={cn(publicMotionButton, publicMotionCta, "rounded-full")} data-testid="booking-confirm-booking" loading={isBusy} type="button" onClick={confirmBooking}>
                <MaterialSymbol name="check_circle" />
                {copy.submitBooking}
              </Button>
              <Button className={chipButtonClasses} disabled={isBusy} type="button" variant="secondary" onClick={editDetails}>
                <MaterialSymbol name="edit" />
                {copy.back}
              </Button>
            </div>
          ) : null}
          {readyToCheckout && paymentReview ? (
            <PaymentReviewPanel
              copy={copy}
              draft={draft}
              locale={activeLocale}
              paymentReview={paymentReview}
              selectedSlot={selectedSlot}
              isBusy={isBusy}
              onBack={editDetails}
              onPay={payBooking}
            />
          ) : null}
          {isBusy ? <TypingIndicator label={copy.typing} /> : null}
        </div>

        <div className="shrink-0 px-5 pb-5 sm:px-8 sm:pb-8">
          {showQuickActions ? (
            <div className="mb-5 flex flex-wrap gap-3" data-testid="booking-quick-actions">
              <Button className={chipButtonClasses} data-testid="booking-quick-book" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={startBooking}>
                <MaterialSymbol className="text-xl" name="event_available" />
                {copy.book}
              </Button>
              <Button className={chipButtonClasses} data-testid="booking-quick-inquiry" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={startInquiry}>
                <MaterialSymbol className="text-xl" name="search" />
                {copy.inquire}
              </Button>
              {content.legalServices.map((service) => (
                <Button key={service.slug} className={chipButtonClasses} disabled={isBusy} size="sm" type="button" variant="secondary" onClick={() => startBookingWithCategory(service.title, service.category)}>
                  <MaterialSymbol className="text-xl" name={service.icon} />
                  {service.title}
                </Button>
              ))}
            </div>
          ) : null}

          <form className="flex min-w-0 items-end gap-3" data-testid="booking-chat-composer" noValidate onSubmit={submitMessage}>
            <div className="min-w-0 flex-1 [&_label]:sr-only">
              <TextInput
                autoComplete="off"
                className={cn(darkControlClasses, "!min-h-16 !rounded-full !border-kmt-gold/55 !bg-black/42 !px-6 !text-base")}
                disabled={!chatLocale || isBusy}
                label={copy.messageLabel}
                name="chatMessage"
                placeholder={chatLocale ? copy.messagePlaceholder : copy.languagePendingPlaceholder}
                value={freeMessage}
                onChange={(event) => setFreeMessage(event.target.value)}
              />
            </div>
            <Button
              aria-label={copy.send}
              className={cn(publicMotionButton, publicMotionCta, "mb-0 h-16 w-16 shrink-0 rounded-full !px-0 shadow-[0_16px_45px_-24px_rgba(183,134,64,1)]")}
              disabled={!chatLocale || isBusy || !freeMessage.trim()}
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
}

function TrustRailItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="inline-flex min-h-8 max-w-full items-center justify-center gap-1 rounded-full border border-kmt-gold/25 bg-[#12100c]/72 px-2 text-center shadow-[0_12px_26px_-24px_rgba(183,134,64,0.9)] transition-colors hover:border-kmt-gold/40 hover:bg-[#17130d]/82">
      <MaterialSymbol className="shrink-0 text-sm text-kmt-gold drop-shadow-[0_0_10px_rgba(183,134,64,0.26)]" name={icon} />
      <span className="min-w-0 truncate text-[0.68rem] font-medium leading-4 text-amber-50/90">{label}</span>
    </div>
  );
}

function BookingProgress({
  copy,
  draft,
  readyToCheckout,
  selectedSlot
}: {
  copy: BookingChatCopy;
  draft: BookingDraft;
  readyToCheckout: boolean;
  selectedSlot: string;
}) {
  const steps = [
    { label: copy.progressContact, done: Boolean(draft.fullName.trim() && draft.phone.trim()) },
    { label: copy.progressDetails, done: Boolean(draft.serviceCategory.trim() && draft.summary.trim().length >= 20) },
    { label: copy.progressSlot, done: Boolean(selectedSlot || draft.startsAt) },
    { label: copy.progressPayment, done: readyToCheckout }
  ];

  return (
    <div className="mt-5 grid grid-cols-4 gap-2" aria-label={copy.paymentStatus}>
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={cn(
            "flex min-h-9 items-center justify-center gap-1 rounded-full border px-2 text-center text-[0.68rem] font-semibold leading-4 transition-colors",
            step.done ? "border-kmt-gold bg-kmt-gold text-[#120d07]" : "border-white/12 bg-white/[0.04] text-amber-50/68"
          )}
        >
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[0.6rem]" aria-hidden="true">
            {step.done ? <MaterialSymbol className="text-[0.8rem]" name="check_circle" /> : index + 1}
          </span>
          <span className="min-w-0 truncate">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function LanguageChoicePanel({ copy, onSelect }: { copy: BookingChatCopy; onSelect: (locale: PublicLocale) => void }) {
  return (
    <div className="flex flex-wrap justify-start gap-3 ps-16 max-sm:ps-0" data-testid="booking-language-choice">
      <Button className={chipButtonClasses} data-testid="booking-language-ar" type="button" variant="secondary" onClick={() => onSelect("ar")}>
        <MaterialSymbol className="text-xl" name="translate" />
        {copy.languageArabic}
      </Button>
      <Button className={chipButtonClasses} data-testid="booking-language-en" type="button" variant="secondary" onClick={() => onSelect("en")}>
        <MaterialSymbol className="text-xl" name="translate" />
        {copy.languageEnglish}
      </Button>
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
      <div
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
        {message.actionHref && message.actionLabel ? (
          <a
            className="mt-3 flex w-fit items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-4 py-2 text-sm font-semibold leading-5 text-[#120d07] transition-colors hover:bg-[#c7a363]"
            href={message.actionHref}
          >
            <MaterialSymbol className="text-lg" name="account_circle" />
            {message.actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function SlotChoicePanel({
  locale,
  slots,
  slotWindow,
  onChoose
}: {
  locale: PublicLocale;
  slots: PublicSlot[];
  slotWindow?: SlotWindow;
  onChoose: (slot: PublicSlot) => void;
}) {
  const groups = groupSlotsByDay(slots, locale);
  return (
    <div className="space-y-3 ps-14 max-sm:ps-0" data-testid="booking-slot-choice-panel">
      {slotWindow?.alternatives ? (
        <p className="max-w-[42rem] rounded-2xl border border-kmt-gold/20 bg-kmt-gold/10 px-4 py-3 text-sm leading-6 text-amber-50/85">
          {locale === "ar" ? "أقرب بدائل متاحة الآن" : "Nearest visible alternatives"}
        </p>
      ) : null}
      {groups.map((group) => (
        <div key={group.key} className="max-w-[42rem] rounded-3xl border border-kmt-gold/20 bg-black/20 p-3 shadow-[0_18px_48px_-38px_rgba(183,134,64,0.85)]">
          <div className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/70">
            <MaterialSymbol className="text-base text-kmt-gold" name="event" />
            <span>{group.label}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <Button key={slot.id} className={cn(chipButtonClasses, "!min-h-10 !px-3")} data-testid="booking-slot-chip" type="button" variant="secondary" onClick={() => onChoose(slot)}>
                <MaterialSymbol name="schedule" />
                {formatPublicTime(slot.startsAt, locale)}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentReviewPanel({
  copy,
  draft,
  locale,
  paymentReview,
  selectedSlot,
  isBusy,
  onBack,
  onPay
}: {
  copy: BookingChatCopy;
  draft: BookingDraft;
  locale: PublicLocale;
  paymentReview: PaymentReview;
  selectedSlot: string;
  isBusy: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const amount = formatPublicMoney(paymentReview.amount, paymentReview.currency, locale);
  const bookingFormCopy = getPublicContent(locale).bookingForm;
  const requestText = draft.summary?.trim() || formatServiceCategory(draft.serviceCategory || paymentReview.serviceCategory, locale);
  const requestArea = formatServiceCategory(draft.serviceCategory || paymentReview.serviceCategory, locale);
  const emailText = draft.email?.trim() || bookingFormCopy.unknown;

  return (
    <div className="ms-auto max-w-[42rem] rounded-3xl border border-kmt-gold/35 bg-black/30 p-4 shadow-[0_18px_58px_-42px_rgba(183,134,64,0.95)]" data-testid="booking-payment-review">
      <div className="mb-4 flex items-center gap-2 text-amber-50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kmt-gold/45 bg-kmt-gold/15 text-kmt-gold">
          <MaterialSymbol name="payments" />
        </span>
        <div>
          <p className="font-serif text-xl font-semibold leading-tight">{copy.paymentReviewTitle}</p>
          <p className="mt-1 text-sm text-amber-100/70">{copy.cancellationPolicy}</p>
        </div>
      </div>
      <dl className="grid gap-3 text-sm text-amber-50/85 sm:grid-cols-2">
        <PaymentReviewItem icon="category" label={bookingFormCopy.serviceCategory} value={requestArea} />
        <PaymentReviewItem icon="mail" label={bookingFormCopy.email} value={emailText} />
        <PaymentReviewItem className="sm:col-span-2" icon="description" label={copy.detailsTitle} value={requestText} />
        <PaymentReviewItem icon="video_chat" label={copy.preferredSlot} value={`${modeLabel(paymentReview.mode, locale)} - ${formatPublicDate(selectedSlot, locale)}`} />
        <PaymentReviewItem icon="receipt_long" label={copy.bookingFee} value={amount} />
      </dl>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button className={cn(publicMotionButton, publicMotionCta, "rounded-full")} data-testid="booking-pay-booking" loading={isBusy} type="button" onClick={onPay}>
          <MaterialSymbol name="lock" />
          {copy.payBooking}
        </Button>
        <Button className={chipButtonClasses} disabled={isBusy} type="button" variant="secondary" onClick={onBack}>
          <MaterialSymbol name="edit" />
          {copy.back}
        </Button>
      </div>
    </div>
  );
}

function PaymentReviewItem({ icon, label, value, className }: { icon: string; label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3", className)}>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-100/55">
        <MaterialSymbol className="text-base text-kmt-gold" name={icon} />
        {label}
      </dt>
      <dd className="mt-2 break-words text-base font-semibold leading-7 text-white">
        <bdi dir="auto">{value}</bdi>
      </dd>
    </div>
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

function normalizeDraft(value: Partial<BookingDraft>): BookingDraft {
  return {
    fullName: value.fullName ?? "",
    phone: value.phone ?? "",
    email: value.email ?? "",
    city: value.city ?? "",
    serviceCategory: value.serviceCategory ?? "",
    urgency: value.urgency ?? "NORMAL",
    preferredMode: value.preferredMode ?? "ONLINE",
    summary: value.summary ?? "",
    startsAt: value.startsAt ?? "",
    availabilityPreference: {
      date: value.availabilityPreference?.date ?? "",
      label: value.availabilityPreference?.label ?? "",
      timeWindow: value.availabilityPreference?.timeWindow ?? "",
      fromTime: value.availabilityPreference?.fromTime ?? "",
      toTime: value.availabilityPreference?.toTime ?? ""
    }
  };
}

function categoryFromInitialService(initialService: string | undefined, locale: PublicLocale) {
  if (!initialService) return "";
  const content = getPublicContent(locale);
  const service =
    content.legalServices.find((item) => item.title === initialService || item.slug === initialService) ??
    findPublicService(locale, initialService);
  return service?.category ?? "";
}

function inquiryFromMessage(value: string) {
  return {
    reference: value.match(/CONS-[0-9A-F]{8}/i)?.[0] ?? "",
    phone: value.match(/(?:\+|00)?\d[\d\s().-]{6,}\d/)?.[0]?.replace(/[^\d+]/g, "") ?? "",
    email: value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() ?? ""
  };
}

function looksLikeInquiry(value: string) {
  const text = normalizeText(value);
  if (/cons-[0-9a-f]{8}/i.test(value)) {
    return true;
  }
  return /booking reference|check reference|reference number|previous reference|cons-|مرجع|استعلام|رقم الطلب|رقم الحجز/.test(text);
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

function errorMessage(body: AssistantApiBody, copy: BookingChatCopy) {
  const message = body.error?.message ?? copy.fallbackError;
  return body.error?.requestId ? `${message} · ${copy.requestId}: ${body.error.requestId}` : message;
}
