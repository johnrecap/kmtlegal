"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MotionConfig } from "motion/react";
import { KmtBrandLogo } from "@/components/brand";
import { Button, MaterialSymbol } from "@/components/ui";
import { AnimatedList } from "@/components/ui/animated-list";
import { BorderBeam } from "@/components/ui/border-beam";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { findPublicService, getPublicContent, type PublicContent } from "@/content/public-content";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
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

type AssistantInfoCard = {
  title: string;
  items: ReadonlyArray<{ icon?: string; label: string; description?: string }>;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "error" | "success";
  actionHref?: string;
  actionLabel?: string;
  /** "info" renders the title + numbered/icon rows card (what-next, after-submit). */
  kind?: "text" | "info";
  info?: AssistantInfoCard;
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
type LatestBookingResult = { kind: "booking"; reference: string; appointments: Array<{ title: string; startsAt: string; status: string }> }
  | { kind: "inquiry"; message: string; appointments: Array<{ title: string; startsAt: string; status: string }> };
type LanguageTransfer = {
  destination: string; createdAt: number; freeMessage: string; draft: BookingDraft;
  flow: "booking" | "inquiry" | null; selectedSlot: string; result: LatestBookingResult | null;
};
const languageTransferKey = "kmt.booking.language-transfer";
const languageTransferLimit = 20_000;

const assistantShellClasses = cn(
  publicMotionForm,
  "relative isolate overflow-hidden rounded-[1.75rem] border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-shell)] text-[var(--kmt-assistant-text)] before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-kmt-gold/60 before:to-transparent"
);

const chipButtonClasses = cn(
  publicMotionButton,
  "min-h-10 rounded-full border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-chip)] px-4 text-sm text-[var(--kmt-assistant-text)] hover:border-kmt-gold/60 hover:bg-kmt-gold hover:text-[#120d07]"
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialCopy = getPublicContent(locale).bookingChat;
    return [
      { id: "assistant-greeting", role: "assistant", text: initialCopy.greeting },
      { id: "language-prompt", role: "assistant", text: initialCopy.languagePrompt }
    ];
  });
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
  // Contextual action step: intent (book/inquire) right after language, then
  // matter chips only while the booking still misses a service category.
  // Previous option groups collapse as soon as the flow moves on.
  const [actionStep, setActionStep] = useState<"intent" | "matter" | null>(null);
  const [latestResult, setLatestResult] = useState<LatestBookingResult | null>(null);
  const reduceMotionStage = usePrefersReducedMotion();
  const restoredSelection = useRef<BookingDraft | null>(null);
  const searchParams = useSearchParams();
  const requestedLawyer = searchParams.get("lawyer");
  const pageCopy = content.bookingPage;
  const matterKnown = Boolean(draft.serviceCategory.trim());
  const flowIdle = !availableSlots.length && !readyToConfirm && !readyToCheckout;
  const showIntentActions = Boolean(chatLocale) && actionStep === "intent" && !flow && flowIdle && !latestResult;
  const showMatterActions = Boolean(chatLocale) && (actionStep === "matter" || (flow === "booking" && !matterKnown && !latestResult)) && flowIdle;
  const showNewRequest = Boolean(latestResult) && !flow && !isBusy;
  const showQuickActions = showIntentActions || showMatterActions || showNewRequest;
  // Stage-aware composer placeholders: real copy matched to the current step.
  const composerPlaceholders = !chatLocale
    ? [copy.languagePendingPlaceholder]
    : flow === "inquiry"
      ? [copy.inquiryPrompt]
      : readyToCheckout
        ? [copy.paymentReviewTitle, copy.cancellationPolicy]
        : readyToConfirm
          ? [copy.reviewPrompt]
          : availableSlots.length
            ? [copy.preferredSlotHint]
            : !(draft.fullName.trim() && draft.phone.trim())
              ? [copy.contactPrompt, copy.messagePlaceholder]
              : !(draft.serviceCategory.trim() && draft.summary.trim().length >= 20)
                ? [copy.detailsPrompt, copy.messagePlaceholder]
                : [copy.messagePlaceholder, copy.preferredSlotHint];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // One-use, same-tab handoff for the existing full-page language link only.
    // Preserve current answers/result, never history, price or confirmation authority.
    try {
      const raw = sessionStorage.getItem(languageTransferKey);
      sessionStorage.removeItem(languageTransferKey);
      const saved = parseLanguageTransfer(raw, window.location.pathname);
      if (!saved) return;
      const restored = normalizeDraft(saved.draft);
      setDraft(restored);
      setFreeMessage(saved.freeMessage);
      setChatLocale(locale);
      setFlow(saved.flow);
      setLatestResult(saved.result);
      setSelectedSlot(saved.selectedSlot);
      const nextCopy = getPublicContent(locale).bookingChat;
      const restoredMessages: ChatMessage[] = [{ id: `language-resume-${locale}`, role: "assistant", text: nextCopy.greeting }];
      if (saved.result) {
        restoredMessages.push({ id: "language-result", role: "assistant", tone: "success", text: saved.result.kind === "booking"
          ? `${nextCopy.successTitle} · ${nextCopy.reference}: ${saved.result.reference}` : saved.result.message });
        for (const [index, appointment] of saved.result.appointments.entries()) restoredMessages.push({
          id: `language-appointment-${index}`, role: "assistant", tone: "success", text: `${appointment.title} · ${formatPublicDate(appointment.startsAt, locale)}`
        });
      } else if (saved.flow === "inquiry") {
        restoredMessages.push({ id: "language-inquiry", role: "assistant", text: nextCopy.inquiryPrompt });
      }
      setMessages(restoredMessages);
      if (saved.flow === "booking" && saved.selectedSlot) restoredSelection.current = { ...restored, startsAt: saved.selectedSlot };
    } catch {
      // Storage may be unavailable; ordinary booking remains usable.
    }
  }, [locale]);

  useEffect(() => {
    if (!chatLocale || !restoredSelection.current) return;
    const restored = restoredSelection.current;
    restoredSelection.current = null;
    // Re-enter the existing review flow, never send confirmBooking/consent or a cached price.
    void sendBookingMessage(copy.book, { draftPatch: restored, selectedSlot: restored.startsAt });
  });

  useEffect(() => {
    function transferLanguage(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-testid="public-language-switch"]') : null;
      if (!link || !chatLocale || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin || !["/book-consultation", "/ar/book-consultation"].includes(destination.pathname)) return;
      if (isBusy) { event.preventDefault(); return; }
      try {
        const raw = JSON.stringify({
          destination: destination.pathname, createdAt: Date.now(), freeMessage,
          draft, flow, selectedSlot, result: latestResult
        } satisfies LanguageTransfer);
        if (raw.length > languageTransferLimit) {
          event.preventDefault();
          appendRecoverableError(copy.languageTransferTooLarge);
          return;
        }
        if (!parseLanguageTransfer(raw, destination.pathname)) throw new Error("Invalid language transfer");
        sessionStorage.setItem(languageTransferKey, raw);
      } catch {
        event.preventDefault();
        appendRecoverableError(copy.fallbackError);
      }
    }
    document.addEventListener("click", transferLanguage);
    return () => document.removeEventListener("click", transferLanguage);
  });

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
    const restoredLocale = params.get("locale") === "ar" || params.get("locale") === "en" ? (params.get("locale") as PublicLocale) : locale;
    const restoredCopy = getPublicContent(restoredLocale).bookingChat;
    const restore = async () => {
      const statusParams = new URLSearchParams({ attemptId: resumeAttemptId, token });
      const response = await fetch(`/api/public/payments/status?${statusParams.toString()}`, { cache: "no-store" });
      if (stopped) return;
      if (!response.ok) throw new Error("Payment resume request failed");
      const body = (await response.json()) as {
        data?: { status?: string; access?: { verified?: boolean }; resumeDraft?: Partial<BookingDraft> | null }
      } | null;
      if (stopped) return;
      const data = body?.data;
      const statuses = ["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "REFUNDED", "DISPUTED", "CANCELLED"];
      if (!data || !statuses.includes(data.status ?? "") || typeof data.access?.verified !== "boolean") {
        throw new Error("Invalid payment resume response");
      }
      // The public DTO intentionally withholds drafts without verified access and
      // for attempts that cannot be resumed. A null draft is valid in those cases.
      if (!data.access.verified || !["FAILED", "EXPIRED", "CANCELLED"].includes(data.status!)) return;
      const resumeDraft = data.resumeDraft;
      if (!resumeDraft || typeof resumeDraft !== "object" || Array.isArray(resumeDraft)) {
        throw new Error("Missing payment resume draft");
      }

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
      setActionStep(null);
      setMessages([
        { id: `assistant-greeting-${restoredLocale}`, role: "assistant", text: restoredCopy.greeting },
        { id: `assistant-payment-resume-${restoredLocale}`, role: "assistant", text: restoredCopy.resumePaymentDraft, tone: "success" }
      ]);
    };

    void restore().catch(() => {
      if (stopped) return;
      setMessages((current) => [...current, {
        id: "payment-resume-error",
        role: "assistant",
        text: restoredCopy.fallbackError,
        tone: "error",
        actionHref: restoredLocale === "ar" ? "/ar/contact" : "/contact",
        actionLabel: restoredCopy.whatsappFallbackLabel
      }]);
    });
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
    // New turns reveal through the sequenced list after the state lands;
    // trailing pins keep the latest interaction in view. Native scrollTop
    // only — no smooth scrolling, no conflict with page scrollers.
    const firstPin = window.setTimeout(() => {
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 320);
    const secondPin = window.setTimeout(() => {
      chatLog.scrollTop = chatLog.scrollHeight;
    }, 780);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(firstPin);
      window.clearTimeout(secondPin);
    };
  }, [messages, availableSlots, readyToConfirm, readyToCheckout, isBusy]);

  function append(role: ChatMessage["role"], text: string, tone: ChatMessage["tone"] = "default", action?: Pick<ChatMessage, "actionHref" | "actionLabel">, info?: AssistantInfoCard) {
    setMessages((current) => [...current, {
      id: `${role}-${Date.now()}-${current.length}`,
      role,
      text,
      tone,
      ...action,
      ...(info ? { kind: "info" as const, info } : null)
    }]);
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
    setLatestResult(null);
    setActionStep("intent");
    // The choice becomes chat history; the assistant continues in that
    // language with the intent question plus the what-next info card.
    setMessages((current) => [
      ...current,
      { id: `user-language-${nextLocale}`, role: "user", text: nextLocale === "ar" ? nextCopy.languageArabic : nextCopy.languageEnglish },
      { id: `assistant-intent-${nextLocale}`, role: "assistant", text: nextCopy.intentPrompt },
      {
        id: `assistant-what-next-${nextLocale}`,
        role: "assistant",
        text: nextCopy.trustTitle,
        kind: "info",
        info: { title: nextCopy.trustTitle, items: nextCopy.trustItems }
      }
    ]);
  }

  function startBooking() {
    if (!chatLocale) return;
    const needsMatter = !draft.serviceCategory.trim();
    // Matter chips appear only while the category is still missing; the
    // assistant question names what they are for.
    setActionStep(needsMatter ? "matter" : null);
    if (needsMatter) append("assistant", copy.matterPrompt);
    void sendBookingMessage(copy.book, { userText: copy.book, flow: "booking" });
  }

  function startBookingWithCategory(label: string, category: string) {
    if (!chatLocale) return;
    setActionStep(null);
    void sendBookingMessage(label, { userText: label, flow: "booking", draftPatch: { serviceCategory: category } });
  }

  function startInquiry() {
    if (!chatLocale) return;
    setActionStep(null);
    setFlow("inquiry");
    setLatestResult(null);
    setAvailableSlots([]);
    setSlotWindow(null);
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);
    append("user", copy.inquire);
    append("assistant", copy.inquiryPrompt);
  }

  function startNewRequest() {
    if (!chatLocale || isBusy) return;
    const nextCopy = getPublicContent(chatLocale).bookingChat;
    setFlow(null);
    setAvailableSlots([]);
    setSlotWindow(null);
    setSelectedSlot("");
    setReadyToConfirm(false);
    setReadyToCheckout(false);
    setPaymentReview(null);
    setLatestResult(null);
    setFreeMessage("");
    setFreeTextTurnsAfterLanguage(0);
    setFailureCount(0);
    setActionStep("intent");
    setDraft({ ...initialDraft, serviceCategory: initialServiceCategory });
    // One clear action after submit restarts the guided flow in the same
    // console — the user never leaves the assistant.
    setMessages([
      { id: `assistant-greeting-restart-${Date.now()}`, role: "assistant", text: nextCopy.greeting },
      { id: `assistant-intent-restart-${Date.now()}`, role: "assistant", text: nextCopy.intentPrompt }
    ]);
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
      setActionStep(null);
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
      setLatestResult({ kind: "inquiry", message: body.data?.message ?? copy.inquiryResult, appointments: body.data?.appointments ?? [] });
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
    const restoreUnprocessedMessage = () => {
      if (!options.confirmBooking && options.selectedSlot === undefined) setFreeMessage(message);
    };

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
        restoreUnprocessedMessage();
        appendRecoverableError(errorMessage(body, copy));
        return;
      }

      const data = body.data;
      if (!data) {
        restoreUnprocessedMessage();
        appendRecoverableError(copy.fallbackError);
        return;
      }

      setFailureCount(0);
      const updatedDraft = normalizeDraft({ ...nextDraft, ...data.draft });
      setDraft(updatedDraft);
      setAvailableSlots(data.availableSlots ?? []);
      setSlotWindow(data.slotWindow ?? null);
      // The server may explicitly clear a stale or unavailable appointment.
      setSelectedSlot(updatedDraft.startsAt);
      setReadyToConfirm(Boolean(data.readyToConfirm));
      setReadyToCheckout(Boolean(data.readyToCheckout));
      setPaymentReview(data.paymentReview ?? null);
      append("assistant", data.message ?? copy.scopeReply, data.reference ? "success" : "default");

      if (data.reference) {
        setLatestResult({ kind: "booking", reference: data.reference, appointments: data.appointment ? [data.appointment] : [] });
        append("assistant", `${copy.successTitle} · ${copy.reference}: ${data.reference}`, "success");
        // After-submit continuity lives in the same console: confirmation,
        // the office next steps as an info card, then one clear action
        // (the new-request chip) instead of an external panel.
        append("assistant", pageCopy.afterSubmitTitle, "success", undefined, {
          title: pageCopy.afterSubmitTitle,
          items: pageCopy.afterSubmitSteps.map((step) => ({ label: step }))
        });
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
        setActionStep(null);
        setDraft({ ...initialDraft, serviceCategory: initialServiceCategory });
      }
    } catch {
      trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: "network" });
      restoreUnprocessedMessage();
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
          expectedPrice: paymentReview,
          confirmPayment: true
        })
      });
      const body = (await response.json().catch(() => ({}))) as AssistantApiBody;
      if (!response.ok) {
        trackClientAnalyticsEvent("booking.submit_failed", { locale: activeLocale, status: response.status, step: "checkout" });
        appendRecoverableError(errorMessage(body, copy));
        if (response.status === 409) {
          setReadyToCheckout(false);
          setPaymentReview(null);
          // Refresh the summary without confirming or starting another checkout.
          await sendBookingMessage(copy.payBooking, { flow: "booking", selectedSlot, draftPatch: checkoutDraft });
        }
        return;
      }

      const attempt = body.data?.paymentAttempt;
      if (!attempt?.checkoutUrl) {
        appendRecoverableError(copy.fallbackError);
        return;
      }
      setFailureCount(0);
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
      className={assistantShellClasses}
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="booking-stepper"
      dir={activeLocale === "ar" ? "rtl" : "ltr"}
    >
      {/*
        Single restrained beam on the hero object: KMT gold only, slow,
        1px feel. Reduced motion keeps a static gold hairline instead —
        the travelling light never runs. The global footer CTA keeps its
        own existing beam.
      */}
      {reduceMotionStage ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] border border-kmt-gold/25" />
      ) : (
        <BorderBeam size={90} duration={9} colorFrom="#eac987" colorTo="#a87830" borderWidth={1} />
      )}
      <MotionConfig reducedMotion="user">
      {/*
        Fixed shell height: new turns must never move the composer or the
        window (no layout jumping, input never pushed out of view). Growth
        is absorbed by the internal log scroll, not the page.
      */}
      <div className="relative z-10 flex h-[min(72vh,38rem)] min-h-[30rem] min-w-0 flex-col max-sm:h-[min(84svh,38rem)] max-sm:min-h-[28rem]" data-testid="booking-chat-shell">
        {/*
          Simplified header: mark + name + live status + one-line scope.
          Trust content moved into the conversation as the what-next info
          card (Phase 9). No visual progress: the conversation itself
          communicates booking progress; stage state stays internal.
        */}
        <header className="shrink-0 px-4 pb-2 pt-4 sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <KmtBrandLogo label={copy.assistantName} shape="circle" size="md" variant="mark" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight sm:text-xl">{copy.assistantName}</p>
              <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[#2f7a3d] dark:text-[#7ad36a]">
                <span className="h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden="true" />
                {copy.onlineNow}
              </p>
              <p className="mt-1 truncate text-xs leading-5 text-[var(--kmt-assistant-muted)]">{copy.scope}</p>
            </div>
          </div>

        </header>

        <div
          ref={logScrollRef}
          aria-busy={isBusy ? "true" : "false"}
          className="kmt-chat-scrollbar mx-4 mb-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl bg-[var(--kmt-assistant-log)] px-3 py-4 sm:mx-6 sm:px-4"
          data-testid="booking-chat-log"
          role="log"
        >
          {/*
            Real Animated List over the whole conversation: assistant turns,
            user confirmations, follow-ups, option panels, confirmations and
            the final success state all arrive sequentially through the same
            sequenced list. Reduced motion renders everything settled.
          */}
          <AnimatedList className="items-stretch gap-5" delay={160}>
            {requestedLawyer ? <LawyerNoticeRow key="lawyer-notice" label={pageCopy.requestedLawyer} value={requestedLawyer} /> : null}
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {!chatLocale ? <LanguageChoicePanel key="language-choice" copy={copy} onSelect={chooseLanguage} /> : null}
            {availableSlots.length ? <SlotChoicePanel key="slot-choice" locale={activeLocale} slotWindow={slotWindow ?? undefined} slots={availableSlots} onChoose={chooseSlot} /> : null}
            {readyToConfirm ? (
              <div key="confirm-row" className="flex flex-wrap justify-end gap-2">
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
                key="payment-review"
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
          </AnimatedList>
          {isBusy ? <TypingIndicator label={copy.typing} /> : null}
        </div>

        <div className="shrink-0 px-4 pb-4 sm:px-6 sm:pb-5">
          {showQuickActions ? (
            <div className="mb-3 flex flex-wrap gap-2" data-testid="booking-quick-actions">
              {showIntentActions ? (
                <>
                  <Button className={chipButtonClasses} data-testid="booking-quick-book" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={startBooking}>
                    <MaterialSymbol className="text-xl" name="event_available" />
                    {copy.book}
                  </Button>
                  <Button className={chipButtonClasses} data-testid="booking-quick-inquiry" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={startInquiry}>
                    <MaterialSymbol className="text-xl" name="search" />
                    {copy.inquire}
                  </Button>
                </>
              ) : null}
              {showMatterActions ? (
                <>
                  {content.legalServices.map((service) => (
                    <Button key={service.slug} className={chipButtonClasses} data-testid="booking-matter-chip" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={() => startBookingWithCategory(service.title, service.category)}>
                      <MaterialSymbol className="text-xl" name={service.icon} />
                      {service.title}
                    </Button>
                  ))}
                </>
              ) : null}
              {showNewRequest ? (
                <Button className={chipButtonClasses} data-testid="booking-new-request" disabled={isBusy} size="sm" type="button" variant="secondary" onClick={startNewRequest}>
                  <MaterialSymbol className="text-xl" name="restart_alt" />
                  {copy.startNew}
                </Button>
              ) : null}
            </div>
          ) : null}

          <PlaceholdersAndVanishInput
            formTestId="booking-chat-composer"
            formClassName="flex min-w-0 items-center gap-2 rounded-full border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-input)] py-1 pe-1.5 ps-4 transition-colors focus-within:border-kmt-gold"
            placeholders={composerPlaceholders}
            value={freeMessage}
            onValueChange={setFreeMessage}
            onSubmit={submitMessage}
            disabled={!chatLocale || isBusy}
            inputName="chatMessage"
            ariaLabel={copy.messageLabel}
            inputClassName="kmt-vanish-input min-h-10 w-full min-w-0 flex-1 border-0 !p-0 bg-transparent text-[0.95rem] leading-6 text-[var(--kmt-assistant-text)] outline-none disabled:text-[var(--kmt-assistant-muted)] focus-visible:!outline-none focus:!ring-0"
            placeholderClassName="w-full truncate pe-20 ps-4 text-[0.95rem] leading-6 text-[var(--kmt-assistant-muted)]"
            trailing={
              <Button
                aria-label={copy.send}
                className={cn(publicMotionButton, publicMotionCta, "h-10 w-10 shrink-0 rounded-full !min-h-0 !px-0")}
                disabled={!chatLocale || isBusy || !freeMessage.trim()}
                type="submit"
              >
                {/* Forward = reading direction: mirrored in RTL. */}
                <MaterialSymbol className="text-lg rtl:-scale-x-100" name="send" />
                <span className="sr-only">{copy.send}</span>
              </Button>
            }
          />
          <p className="mt-2.5 flex items-center justify-center gap-2 text-center text-xs text-[var(--kmt-assistant-muted)]">
            <MaterialSymbol className="text-lg" name="lock" />
            {copy.privacyNote}
          </p>
        </div>
      </div>
      </MotionConfig>
    </section>
  );
}

/**
 * System/helper row: small neutral line with icon + short text, never a
 * bubble (lawyer pre-selection notice, etc.).
 */
function LawyerNoticeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-center text-xs text-[var(--kmt-assistant-muted)]">
      <MaterialSymbol className="text-base text-[var(--kmt-public-gold)]" name="person_search" />
      <span>
        {label}: <bdi className="font-semibold text-[var(--kmt-assistant-text)]">{value}</bdi>
      </span>
    </div>
  );
}

function LanguageChoicePanel({ copy, onSelect }: { copy: BookingChatCopy; onSelect: (locale: PublicLocale) => void }) {
  const hydrated = useHydrated();
  return (
    <div className="flex flex-wrap justify-start gap-2 ps-12 max-sm:ps-0" data-testid="booking-language-choice">
      <Button className={chipButtonClasses} data-testid="booking-language-ar" disabled={!hydrated} type="button" variant="secondary" onClick={() => onSelect("ar")}>
        <MaterialSymbol className="text-xl" name="translate" />
        {copy.languageArabic}
      </Button>
      <Button className={chipButtonClasses} data-testid="booking-language-en" disabled={!hydrated} type="button" variant="secondary" onClick={() => onSelect("en")}>
        <MaterialSymbol className="text-xl" name="translate" />
        {copy.languageEnglish}
      </Button>
    </div>
  );
}

/**
 * Role-coded bubbles. Assistant = theme bubble surface with avatar;
 * user = warm gold-tinted surface; info = the assistant info card
 * (what-next / after-submit: icon-or-numbered rows, subtle boundary).
 */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (message.kind === "info" && message.info) {
    const info = message.info;
    return (
      <div className="kmt-chat-enter flex items-end gap-3">
        <KmtBrandLogo className="shrink-0" label="" shape="circle" size="sm" variant="mark" />
        <div className="max-w-[76%] rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] px-4 py-3 max-sm:max-w-[88%] max-sm:px-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--kmt-assistant-text)]">
            <MaterialSymbol className="text-lg text-[var(--kmt-public-gold)]" name="info" />
            {info.title}
          </p>
          <ol className="mt-3 space-y-2.5">
            {info.items.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex gap-2.5 text-sm leading-6">
                {item.icon ? (
                  <MaterialSymbol className="mt-0.5 shrink-0 text-lg text-[var(--kmt-public-gold)]" name={item.icon} />
                ) : (
                  <span aria-hidden="true" className="shrink-0 text-xs font-semibold tabular-nums text-[var(--kmt-public-gold)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="min-w-0 text-[var(--kmt-assistant-muted)]">
                  <span className="font-semibold text-[var(--kmt-assistant-text)]">{item.label}</span>
                  {item.description ? <span> · {item.description}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("kmt-chat-enter flex items-end gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        message.tone === "error" || message.tone === "success" ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] text-[var(--kmt-public-gold)]">
            <MaterialSymbol className="text-lg" name={message.tone === "error" ? "error" : "check_circle"} />
          </span>
        ) : (
          <KmtBrandLogo className="shrink-0" label="" shape="circle" size="sm" variant="mark" />
        )
      ) : null}
      <div
        className={cn(
          "max-w-[72%] break-words rounded-[1.25rem] px-4 py-3 text-[0.95rem] leading-7 max-sm:max-w-[85%] max-sm:px-3.5 max-sm:py-2.5 max-sm:text-sm",
          isUser
            ? "rounded-ee-md border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-user)] text-[var(--kmt-assistant-text)]"
            : "rounded-es-md border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] text-[var(--kmt-assistant-text)]",
          message.tone === "error" ? "border-red-500/40 bg-red-500/10" : undefined,
          message.tone === "success" ? "border-kmt-gold/40 bg-kmt-gold/10" : undefined
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
    <div className="space-y-3" data-testid="booking-slot-choice-panel">
      {slotWindow?.alternatives ? (
        <p className="max-w-[36rem] rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] px-4 py-3 text-sm leading-6 text-[var(--kmt-assistant-muted)]">
          {locale === "ar" ? "أقرب بدائل متاحة الآن" : "Nearest visible alternatives"}
        </p>
      ) : null}
      {groups.map((group) => (
        <div key={group.key} className="max-w-[36rem] rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] p-3">
          <div className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--kmt-assistant-muted)]">
            <MaterialSymbol className="text-base text-[var(--kmt-public-gold)]" name="event" />
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
    <div className="ms-auto max-w-[36rem] rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] p-4" data-testid="booking-payment-review">
      <div className="mb-3 flex items-center gap-2 text-[var(--kmt-assistant-text)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--kmt-assistant-line)] bg-kmt-gold/15 text-[var(--kmt-public-gold)]">
          <MaterialSymbol name="payments" />
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">{copy.paymentReviewTitle}</p>
          <p className="mt-1 text-sm text-[var(--kmt-assistant-muted)]">{copy.cancellationPolicy}</p>
        </div>
      </div>
      <dl className="grid gap-3 text-sm text-[var(--kmt-assistant-muted)] sm:grid-cols-2">
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
    <div className={cn("rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-log)] px-4 py-3", className)}>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kmt-assistant-muted)]">
        <MaterialSymbol className="text-base text-[var(--kmt-public-gold)]" name={icon} />
        {label}
      </dt>
      <dd className="mt-2 break-words text-base font-semibold leading-7 text-[var(--kmt-assistant-text)]">
        <bdi dir="auto">{value}</bdi>
      </dd>
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-end gap-2 pt-1 text-[var(--kmt-assistant-muted)]">
      <KmtBrandLogo label="" shape="circle" size="sm" variant="mark" />
      <div className="flex items-center gap-2 rounded-2xl rounded-es-sm border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] px-4 py-3 text-xs">
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

function parseLanguageTransfer(raw: string | null, destination: string): LanguageTransfer | null {
  if (!raw || raw.length > languageTransferLimit) return null;
  try {
    const saved = JSON.parse(raw);
    if (!saved || saved.destination !== destination || !Number.isFinite(saved.createdAt) ||
        Date.now() - saved.createdAt < 0 || Date.now() - saved.createdAt > 5 * 60_000 ||
        ![null, "booking", "inquiry"].includes(saved.flow) || typeof saved.selectedSlot !== "string" ||
        typeof saved.freeMessage !== "string" || !saved.draft || typeof saved.draft !== "object" || Array.isArray(saved.draft) ||
        Object.entries(saved.draft).some(([field, value]) => field !== "availabilityPreference" && typeof value !== "string") ||
        !["PHONE", "ONLINE", "OFFICE"].includes(saved.draft.preferredMode) ||
        !["LOW", "NORMAL", "HIGH", "URGENT"].includes(saved.draft.urgency) ||
        !saved.draft.availabilityPreference || typeof saved.draft.availabilityPreference !== "object" ||
        Object.values(saved.draft.availabilityPreference).some(value => typeof value !== "string")) return null;
    if (saved.result !== null) {
      const result = saved.result;
      if (!result || !["booking", "inquiry"].includes(result.kind) ||
          (result.kind === "booking" ? typeof result.reference !== "string" : typeof result.message !== "string") ||
          !Array.isArray(result.appointments) || result.appointments.some((appointment: { title?: unknown; startsAt?: unknown; status?: unknown } | null) =>
            !appointment || typeof appointment.title !== "string" || typeof appointment.startsAt !== "string" ||
            !Number.isFinite(new Date(appointment.startsAt).getTime()) || typeof appointment.status !== "string")) return null;
    }
    return saved as LanguageTransfer;
  } catch { return null; }
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
