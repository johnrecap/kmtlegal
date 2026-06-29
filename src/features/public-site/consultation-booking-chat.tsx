"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
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
};

type ChatMode = "idle" | "booking" | "inquiry";
type BookingStep = "contact" | "details" | "review";
type BookingFormCopy = PublicContent["bookingForm"];

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
  "relative overflow-hidden rounded-lg border border-kmt-gold/25 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_50%,#050505_100%)] p-4 shadow-[0_28px_90px_-56px_rgba(0,0,0,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-kmt-gold/70 before:to-transparent sm:p-5 [&_label]:text-amber-100 [&_p[id$='-hint']]:text-slate-300 [&_p[id$='-error']]:text-red-200 [&_select+span]:text-kmt-gold"
);

const darkControlClasses = cn(
  publicMotionControl,
  "!border-kmt-gold/25 !bg-black/30 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!border-white/10 disabled:!bg-black/40 disabled:!text-slate-500"
);

const secondaryButtonClasses = cn(publicMotionButton, "!border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white");

const chatCopy = {
  en: {
    title: "Consultation booking chat",
    scope: "I can only book a consultation or check an existing booking reference. I do not provide legal advice.",
    greeting: "Hello. I can help you book a consultation or check a previous booking reference. I will collect only the details needed for the team to review your request.",
    book: "Book a consultation",
    inquire: "Check a reference",
    messageLabel: "Message",
    messagePlaceholder: "Ask to book a consultation or check a reference",
    send: "Send",
    contactPrompt: "Please add your contact details so the team can identify the request.",
    detailsPrompt: "Now add the consultation area and a short summary for human review.",
    reviewPrompt: "Review the details, confirm consent, then send the request.",
    inquiryPrompt: "Add the booking reference and the phone or email used in the request.",
    legalRefusal: "I cannot provide a legal opinion, interpret documents, or predict outcomes here. I can book a consultation so the office team can review your request.",
    scopeReply: "I can help with booking a consultation or checking a booking reference only.",
    continue: "Continue",
    back: "Back",
    submitRequest: "Send request",
    submitBooking: "Book appointment",
    submitInquiry: "Check reference",
    preferredSlot: "Preferred appointment time",
    preferredSlotHint: "Optional. Office booking slots are reviewed by the team.",
    consent: "I agree to use this data to review the request and contact me. I understand this chat does not provide legal advice.",
    successTitle: "Request saved",
    reference: "Reference",
    inquiryResult: "Verified booking details",
    noSlot: "No specific appointment time",
    requiredContact: "Name and phone are required before continuing.",
    requiredDetails: "Choose an area and write at least 20 characters for the summary.",
    requiredConsent: "Consent is required before sending the request.",
    fallbackError: "The request could not be completed. Review the details and try again.",
    requestId: "Request id"
  },
  ar: {
    title: "شات حجز الاستشارة",
    scope: "أستطيع فقط حجز استشارة أو الاستعلام عن رقم مرجع سابق. لا أقدم أي رأي قانوني.",
    greeting: "مرحبًا. أستطيع مساعدتك في حجز استشارة أو الاستعلام عن رقم مرجع سابق. سأجمع البيانات اللازمة فقط ليراجعها فريق المكتب.",
    book: "حجز استشارة",
    inquire: "استعلام برقم مرجع",
    messageLabel: "رسالتك",
    messagePlaceholder: "اكتب حجز استشارة أو استعلام عن مرجع",
    send: "إرسال",
    contactPrompt: "أضف بيانات التواصل حتى يستطيع الفريق تحديد صاحب الطلب.",
    detailsPrompt: "أضف مجال الاستشارة وملخصًا قصيرًا لمراجعة الفريق.",
    reviewPrompt: "راجع البيانات، وافق على الاستخدام، ثم أرسل الطلب.",
    inquiryPrompt: "أضف رقم المرجع والهاتف أو البريد المستخدم في الطلب.",
    legalRefusal: "لا أستطيع تقديم رأي قانوني أو تفسير مستندات أو توقع نتيجة هنا. أستطيع حجز استشارة ليراجع فريق المكتب طلبك.",
    scopeReply: "أستطيع مساعدتك في حجز استشارة أو الاستعلام عن رقم مرجع فقط.",
    continue: "متابعة",
    back: "رجوع",
    submitRequest: "إرسال الطلب",
    submitBooking: "حجز الموعد",
    submitInquiry: "استعلام",
    preferredSlot: "الموعد المفضل",
    preferredSlotHint: "اختياري. مواعيد المكتب تخضع لمراجعة الفريق.",
    consent: "أوافق على استخدام البيانات لمراجعة الطلب والتواصل معي، وأفهم أن هذا الشات لا يقدم استشارة قانونية.",
    successTitle: "تم حفظ الطلب",
    reference: "رقم المرجع",
    inquiryResult: "بيانات الحجز المتحقق منها",
    noSlot: "بدون موعد محدد",
    requiredContact: "الاسم والهاتف مطلوبان قبل المتابعة.",
    requiredDetails: "اختر المجال واكتب ملخصًا لا يقل عن 20 حرفًا.",
    requiredConsent: "الموافقة مطلوبة قبل إرسال الطلب.",
    fallbackError: "تعذر تنفيذ الطلب. راجع البيانات وحاول مرة أخرى.",
    requestId: "رقم الطلب"
  }
} as const;

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
  const copy = chatCopy[locale];
  const content = getPublicContent(locale);
  const bookingCopy = content.bookingForm;
  const [isHydrated, setIsHydrated] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ id: "greeting", role: "assistant", text: copy.greeting }]);
  const [mode, setMode] = useState<ChatMode>("idle");
  const [bookingStep, setBookingStep] = useState<BookingStep>("contact");
  const [draft, setDraft] = useState<BookingDraft>(() => ({ ...initialDraft, serviceCategory: initialService || initialDraft.serviceCategory }));
  const [inquiry, setInquiry] = useState<InquiryDraft>(initialInquiry);
  const [freeMessage, setFreeMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const categoryOptions = useMemo(() => Object.entries(bookingCopy.categories), [bookingCopy.categories]);

  function append(role: ChatMessage["role"], text: string) {
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${current.length}`, role, text }]);
  }

  function startBooking() {
    setError(null);
    setMode("booking");
    setBookingStep("contact");
    append("user", copy.book);
    append("assistant", copy.contactPrompt);
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_contact", locale });
  }

  function startInquiry() {
    setError(null);
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
    setError(null);
    if (draft.fullName.trim().length < 2 || draft.phone.trim().length < 6) {
      setError(copy.requiredContact);
      return;
    }
    append("user", `${draft.fullName} · ${draft.phone}`);
    append("assistant", copy.detailsPrompt);
    setBookingStep("details");
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_details", locale });
  }

  function continueDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!draft.serviceCategory || draft.summary.trim().length < MIN_SUMMARY_LENGTH) {
      setError(copy.requiredDetails);
      return;
    }
    append("user", `${categoryLabel(bookingCopy, draft.serviceCategory)} · ${draft.summary}`);
    append("assistant", copy.reviewPrompt);
    setBookingStep("review");
    trackClientAnalyticsEvent("booking.step_viewed", { step: "chat_review", locale });
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!draft.consent) {
      setError(copy.requiredConsent);
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
        setError(errorMessage(body, copy));
        return;
      }
      const reference = body.data?.reference ?? "";
      append("assistant", `${copy.successTitle}${reference ? ` · ${copy.reference}: ${reference}` : ""}`);
      if (body.data?.appointment) {
        append("assistant", `${body.data.appointment.title} · ${formatPublicDate(body.data.appointment.startsAt, locale)}`);
      }
      setMode("idle");
      setDraft({ ...initialDraft, serviceCategory: initialService || initialDraft.serviceCategory });
    } catch {
      trackClientAnalyticsEvent("booking.submit_failed", { locale, status: "network" });
      setError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
        setError(errorMessage(body, copy));
        return;
      }
      append("assistant", body.data?.message ?? copy.inquiryResult);
      for (const appointment of body.data?.appointments ?? []) {
        append("assistant", `${appointment.title} · ${formatPublicDate(appointment.startsAt, locale)} · ${appointment.status}`);
      }
      setMode("idle");
      setInquiry(initialInquiry);
    } catch {
      setError(copy.fallbackError);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section aria-label={copy.title} className={darkSurfaceClasses} data-hydrated={isHydrated ? "true" : "false"} data-testid="booking-stepper">
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-kmt-gold">{copy.title}</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{copy.scope}</p>
          </div>
          <MaterialSymbol className="text-3xl text-kmt-gold" name="forum" />
        </div>

        <div className="max-h-[30rem] space-y-3 overflow-y-auto rounded border border-white/10 bg-black/20 p-3" role="log">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[88%] rounded px-3 py-2 text-sm leading-7 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.9)]",
                  message.role === "user" ? "bg-kmt-gold text-white" : "border border-white/10 bg-white/[0.04] text-slate-100"
                )}
              >
                {message.text}
              </p>
            </div>
          ))}
        </div>

        {mode === "idle" ? (
          <div className="grid gap-3 md:grid-cols-[auto_auto_1fr]">
            <Button className={cn(publicMotionButton, publicMotionCta)} type="button" onClick={startBooking}>
              <MaterialSymbol className="text-base" name="event_available" />
              {copy.book}
            </Button>
            <Button className={secondaryButtonClasses} type="button" variant="secondary" onClick={startInquiry}>
              <MaterialSymbol className="text-base" name="search" />
              {copy.inquire}
            </Button>
            <form className="flex min-w-0 gap-2" noValidate onSubmit={submitFreeMessage}>
              <TextInput
                className={darkControlClasses}
                label={copy.messageLabel}
                name="chatMessage"
                placeholder={copy.messagePlaceholder}
                value={freeMessage}
                onChange={(event) => setFreeMessage(event.target.value)}
              />
              <Button className={secondaryButtonClasses} type="submit" variant="secondary">
                {copy.send}
              </Button>
            </form>
          </div>
        ) : null}

        {mode === "booking" && bookingStep === "contact" ? (
          <form className="grid gap-3 md:grid-cols-2" noValidate onSubmit={continueContact}>
            <TextInput className={darkControlClasses} label={bookingCopy.fullName} name="fullName" value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} required />
            <TextInput className={darkControlClasses} label={bookingCopy.phone} name="phone" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} required />
            <TextInput className={darkControlClasses} label={bookingCopy.email} name="email" type="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} />
            <TextInput className={darkControlClasses} label={bookingCopy.city} name="city" value={draft.city} onChange={(event) => updateDraft("city", event.target.value)} />
            <div className="md:col-span-2">
              <Button className={cn(publicMotionButton, publicMotionCta)} type="submit">
                {copy.continue}
              </Button>
            </div>
          </form>
        ) : null}

        {mode === "booking" && bookingStep === "details" ? (
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
              <Button className={cn(publicMotionButton, publicMotionCta)} type="submit">
                {copy.continue}
              </Button>
              <Button className={secondaryButtonClasses} type="button" variant="secondary" onClick={() => setBookingStep("contact")}>
                {copy.back}
              </Button>
            </div>
          </form>
        ) : null}

        {mode === "booking" && bookingStep === "review" ? (
          <form className="space-y-4" noValidate onSubmit={submitBooking}>
            <div className="grid gap-2 rounded border border-white/10 bg-black/20 p-3 text-sm leading-7 text-slate-200 sm:grid-cols-2">
              <ReviewRow label={bookingCopy.reviewLabels.name} value={draft.fullName} />
              <ReviewRow label={bookingCopy.reviewLabels.phone} value={draft.phone} />
              <ReviewRow label={bookingCopy.reviewLabels.category} value={categoryLabel(bookingCopy, draft.serviceCategory)} />
              <ReviewRow label={bookingCopy.reviewLabels.mode} value={bookingCopy.preferredModeLabels[draft.preferredMode]} />
              <ReviewRow label={copy.preferredSlot} value={draft.preferredSlot ? formatPublicDate(draft.preferredSlot, locale) : copy.noSlot} />
              <ReviewRow label={bookingCopy.reviewLabels.summary} value={draft.summary} />
            </div>
            <label className="flex items-start gap-3 text-sm leading-7 text-slate-200">
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
              <Button className={secondaryButtonClasses} type="button" variant="secondary" onClick={() => setBookingStep("details")}>
                {copy.back}
              </Button>
            </div>
          </form>
        ) : null}

        {mode === "inquiry" ? (
          <form className="grid gap-3 md:grid-cols-3" noValidate onSubmit={submitInquiry}>
            <TextInput className={darkControlClasses} dir="ltr" label={copy.reference} name="reference" placeholder="CONS-XXXXXXXX" value={inquiry.reference} onChange={(event) => updateInquiry("reference", event.target.value)} required />
            <TextInput className={darkControlClasses} label={bookingCopy.phone} name="phone" value={inquiry.phone} onChange={(event) => updateInquiry("phone", event.target.value)} />
            <TextInput className={darkControlClasses} label={bookingCopy.email} name="email" type="email" value={inquiry.email} onChange={(event) => updateInquiry("email", event.target.value)} />
            <div className="flex flex-wrap gap-2 md:col-span-3">
              <Button className={cn(publicMotionButton, publicMotionCta)} loading={isBusy} type="submit">
                {copy.submitInquiry}
              </Button>
              <Button className={secondaryButtonClasses} type="button" variant="secondary" onClick={() => setMode("idle")}>
                {copy.back}
              </Button>
            </div>
          </form>
        ) : null}

        {error ? (
          <p className={cn("rounded border border-red-300/35 bg-red-950/35 p-3 text-sm leading-7 text-red-100", publicMotionStatus)} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
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

function errorMessage(body: ApiBody, copy: (typeof chatCopy)["en" | "ar"]) {
  const message = body.error?.message ?? copy.fallbackError;
  return body.error?.requestId ? `${message} · ${copy.requestId}: ${body.error.requestId}` : message;
}
