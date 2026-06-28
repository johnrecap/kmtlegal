"use client";

import { type FormEvent, useState } from "react";
import { Badge, Button, Select, TextInput, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/legal-format";
import type { PublicLocale } from "@/lib/public-locale";
import { cn } from "@/lib/cn";
import { publicMotionButton, publicMotionControl, publicMotionCta, publicMotionForm, publicMotionStatus } from "./public-motion";

type AssistantAppointment = {
  id: string;
  title: string;
  startsAt: string;
  status: string;
  mode: string;
};

type AssistantResult = {
  action?: string;
  message?: string;
  reference?: string;
  appointment?: AssistantAppointment;
  appointments?: AssistantAppointment[];
};

type ApiBody = {
  data?: AssistantResult;
  error?: {
    message?: string;
  };
};

const darkControlClasses = cn(
  publicMotionControl,
  "!border-kmt-gold/25 !bg-black/30 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25"
);

const panelClasses = cn(
  publicMotionForm,
  "rounded-lg border border-kmt-gold/25 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_50%,#050505_100%)] p-5 [&_label]:text-amber-100 [&_p[id$='-hint']]:text-slate-300"
);

export function ConsultationAssistantPanel({ locale }: { locale: PublicLocale }) {
  const isArabic = locale === "ar";
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function postAssistant(payload: Record<string, unknown>) {
    setError(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/public/consultations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json().catch(() => ({}))) as ApiBody;
      if (!response.ok) {
        setError(body.error?.message ?? (isArabic ? "تعذر تنفيذ الطلب الآن." : "Request failed."));
        return;
      }
      setResult(body.data ?? null);
    } catch {
      setError(isArabic ? "لا يمكن الوصول إلى الخادم الآن." : "The server cannot be reached right now.");
    } finally {
      setIsBusy(false);
    }
  }

  function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsAt = String(formData.get("startsAt") ?? "");
    postAssistant({
      locale,
      intent: "book_consultation_appointment",
      message: formData.get("message"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      city: formData.get("city"),
      serviceCategory: formData.get("serviceCategory"),
      summary: formData.get("summary"),
      urgency: formData.get("urgency"),
      preferredMode: formData.get("preferredMode"),
      startsAt: startsAt ? `${startsAt}:00+03:00` : "",
      consent: true
    });
  }

  function inquire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    postAssistant({
      locale,
      intent: "appointment_inquiry",
      message: formData.get("message") || "appointment inquiry",
      reference: formData.get("reference"),
      phone: formData.get("phone"),
      email: formData.get("email")
    });
  }

  return (
    <section className={panelClasses}>
      <h2 className="text-xl font-semibold text-white">{isArabic ? "مساعد الحجز" : "Booking assistant"}</h2>
      <form className="mt-4 grid gap-3" onSubmit={book}>
        <Textarea className={darkControlClasses} label={isArabic ? "رسالتك" : "Message"} name="message" defaultValue={isArabic ? "أريد حجز استشارة" : "I want to book a consultation"} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput className={darkControlClasses} label={isArabic ? "الاسم" : "Name"} name="fullName" required />
          <TextInput className={darkControlClasses} label={isArabic ? "الهاتف" : "Phone"} name="phone" required />
          <TextInput className={darkControlClasses} label={isArabic ? "البريد" : "Email"} name="email" type="email" />
          <TextInput className={darkControlClasses} label={isArabic ? "المدينة" : "City"} name="city" />
        </div>
        <Select className={darkControlClasses} label={isArabic ? "مجال الخدمة" : "Service area"} name="serviceCategory" defaultValue="corporate">
          <option value="corporate">{isArabic ? "الشركات والعقود" : "Corporate and contracts"}</option>
          <option value="real-estate">{isArabic ? "العقارات" : "Real estate"}</option>
          <option value="employment">{isArabic ? "العمل" : "Employment"}</option>
          <option value="disputes">{isArabic ? "المنازعات" : "Disputes"}</option>
        </Select>
        <Textarea className={darkControlClasses} label={isArabic ? "ملخص الطلب" : "Summary"} name="summary" required />
        <div className="grid gap-3 sm:grid-cols-3">
          <Select className={darkControlClasses} label={isArabic ? "الأولوية" : "Urgency"} name="urgency" defaultValue="NORMAL">
            <option value="NORMAL">{isArabic ? "عادية" : "Normal"}</option>
            <option value="HIGH">{isArabic ? "مرتفعة" : "High"}</option>
            <option value="URGENT">{isArabic ? "عاجلة" : "Urgent"}</option>
          </Select>
          <Select className={darkControlClasses} label={isArabic ? "الطريقة" : "Mode"} name="preferredMode" defaultValue="ONLINE">
            <option value="ONLINE">{isArabic ? "أونلاين" : "Online"}</option>
            <option value="PHONE">{isArabic ? "هاتف" : "Phone"}</option>
            <option value="OFFICE">{isArabic ? "في المكتب" : "Office"}</option>
          </Select>
          <TextInput className={darkControlClasses} label={isArabic ? "الموعد" : "Slot"} name="startsAt" type="datetime-local" required />
        </div>
        <Button className={cn(publicMotionButton, publicMotionCta)} loading={isBusy} type="submit">
          {isArabic ? "حجز عبر المساعد" : "Book with assistant"}
        </Button>
      </form>

      <form className="mt-5 grid gap-3 border-t border-white/10 pt-4" onSubmit={inquire}>
        <TextInput className={darkControlClasses} label={isArabic ? "رقم المرجع" : "Reference"} name="reference" placeholder="CONS-XXXXXXXX" required dir="ltr" />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput className={darkControlClasses} label={isArabic ? "الهاتف" : "Phone"} name="phone" />
          <TextInput className={darkControlClasses} label={isArabic ? "البريد" : "Email"} name="email" type="email" />
        </div>
        <Button className={cn(publicMotionButton, "!border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white")} loading={isBusy} type="submit" variant="secondary">
          {isArabic ? "استعلام" : "Inquire"}
        </Button>
      </form>

      {error ? <p className="mt-4 rounded border border-red-300/35 bg-red-950/35 p-3 text-sm leading-7 text-red-100">{error}</p> : null}
      {result ? (
        <div className={cn("mt-4 rounded border border-emerald-300/30 bg-emerald-950/25 p-3 text-sm leading-7 text-emerald-100", publicMotionStatus)} role="status">
          <p>{result.message}</p>
          {result.reference ? <p className="mt-1 font-semibold">Reference: {result.reference}</p> : null}
          {result.appointment ? <AppointmentSummary appointment={result.appointment} /> : null}
          {result.appointments?.map((appointment) => <AppointmentSummary key={appointment.id} appointment={appointment} />)}
        </div>
      ) : null}
    </section>
  );
}

function AppointmentSummary({ appointment }: { appointment: AssistantAppointment }) {
  return (
    <div className="mt-2 rounded border border-emerald-300/20 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>{appointment.title}</span>
        <Badge tone="active">{appointment.status}</Badge>
      </div>
      <p className="text-xs text-emerald-100/80">{formatDateTime(appointment.startsAt)}</p>
    </div>
  );
}
