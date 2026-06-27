"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AI_REVIEW_DISCLAIMER } from "@/server/ai/copy";
import { Button, MaterialSymbol, Select, Textarea, TextInput } from "@/components/ui";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import { legalServices } from "@/content/public-content";

type BookingValues = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  serviceCategory: string;
  summary: string;
  opposingPartyName: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  preferredMode: "PHONE" | "ONLINE" | "OFFICE";
  consent: boolean;
};

type SubmitState =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; data: BookingSuccess; requestId?: string }
  | { type: "error"; message: string; requestId?: string };

type BookingSuccess = {
  reference: string;
  organizer: {
    status: "ready" | "unavailable";
    classification: { category: string; urgency: string; confidence: number; reasons: string[]; reviewNote: string } | null;
    intakeSummary: { summary: string; keyFacts: string[]; missingInfo: string[]; reviewNote: string } | null;
    disclaimer: string;
  };
};

type FieldErrors = Partial<Record<keyof BookingValues, string>>;

const MIN_SUMMARY_LENGTH = 20;

const initialValues: BookingValues = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  serviceCategory: "corporate",
  summary: "",
  opposingPartyName: "",
  urgency: "NORMAL",
  preferredMode: "PHONE",
  consent: false
};

const serviceCategoryLabels: Record<string, string> = {
  corporate: "الشركات والعقود",
  "real-estate": "العقارات",
  employment: "العمل",
  disputes: "المنازعات"
};

const urgencyLabels: Record<string, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة"
};

const preferredModeLabels: Record<BookingValues["preferredMode"], string> = {
  PHONE: "هاتف",
  ONLINE: "أونلاين",
  OFFICE: "في المكتب"
};

const bookingStepKeys = ["contact", "details", "review"] as const;

const darkFormClasses =
  "relative overflow-hidden rounded-lg border border-kmt-gold/25 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_50%,#050505_100%)] p-5 shadow-[0_28px_90px_-56px_rgba(0,0,0,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-kmt-gold/70 before:to-transparent [&_label]:text-amber-100 [&_p[id$='-hint']]:text-slate-300 [&_p[id$='-error']]:text-red-200 [&_select+span]:text-kmt-gold";

const darkControlClasses =
  "!border-kmt-gold/25 !bg-black/30 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!border-white/10 disabled:!bg-black/40 disabled:!text-slate-500";

const darkSecondaryButtonClasses =
  "!border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white";

const stepItemClasses = (index: number, currentStep: number) => {
  if (index === currentStep) {
    return "rounded border border-kmt-gold bg-kmt-gold px-3 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_-20px_rgba(153,123,68,0.95)]";
  }

  if (index < currentStep) {
    return "rounded border border-kmt-gold/35 bg-kmt-gold/10 px-3 py-2 text-sm font-semibold text-amber-100";
  }

  return "rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300";
};

export function BookingStepper({ initialService }: { initialService?: string }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const trackedSteps = useRef(new Set<number>());
  const [values, setValues] = useState<BookingValues>({
    ...initialValues,
    serviceCategory: categoryFromInitialService(initialService)
  });
  const [state, setState] = useState<SubmitState>({ type: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const steps = ["بيانات التواصل", "تفاصيل الطلب", "مراجعة وإرسال"];
  const summaryLength = values.summary.trim().length;
  const summaryRemaining = Math.max(MIN_SUMMARY_LENGTH - summaryLength, 0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (trackedSteps.current.has(step)) {
      return;
    }
    trackedSteps.current.add(step);
    trackClientAnalyticsEvent("booking.step_viewed", {
      step: bookingStepKeys[step],
      stepIndex: step,
      serviceCategory: values.serviceCategory
    });
  }, [step, values.serviceCategory]);

  function updateValue<Key extends keyof BookingValues>(key: Key, value: BookingValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });

    if (state.type === "error") {
      setState({ type: "idle" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateStep(step, values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }

    setState({ type: "submitting" });
    trackClientAnalyticsEvent("booking.submit_attempted", {
      serviceCategory: values.serviceCategory,
      urgency: values.urgency,
      preferredMode: values.preferredMode
    });

    const response = await fetch("/api/public/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      trackClientAnalyticsEvent("booking.submit_failed", {
        step: "review",
        errorCode: body?.error?.code ?? "UNKNOWN",
        httpStatus: response.status
      });
      setState({
        type: "error",
        message: body?.error?.message ?? "تعذر إرسال طلب الاستشارة. راجع البيانات وحاول مرة أخرى.",
        requestId: body?.error?.requestId
      });
      return;
    }

    setState({ type: "success", data: body.data, requestId: body.requestId });
  }

  if (state.type === "success") {
    return (
      <section
        className="rounded-lg border border-emerald-300/35 bg-[linear-gradient(145deg,#142016_0%,#08100b_48%,#050505_100%)] p-6 shadow-[0_28px_90px_-56px_rgba(0,0,0,0.95)]"
        data-testid="booking-stepper-success"
        role="status"
      >
        <div className="flex items-center gap-3">
          <MaterialSymbol className="text-3xl text-emerald-300" name="check_circle" />
          <div>
            <h2 className="text-2xl font-semibold text-white">تم إرسال طلب الاستشارة</h2>
            <p className="mt-1 text-sm text-emerald-100">
              رقم المتابعة: <span className="ltr inline-block font-semibold">{state.data.reference}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-emerald-300/25 bg-black/25 p-4">
          <h3 className="font-semibold text-white">تنظيم مبدئي للطلب</h3>
          {state.data.organizer.status === "ready" ? (
            <div className="mt-3 grid gap-3 text-sm leading-7 text-slate-300">
              <p>تم حفظ ملخص الطلب وتنظيمه لمساعدة فريق المكتب على المراجعة والتواصل معك.</p>
              <p>
                المجال المبدئي: {labelForServiceCategory(state.data.organizer.classification?.category)} · درجة الاستعجال:{" "}
                {labelForUrgency(state.data.organizer.classification?.urgency)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-300">تم حفظ الطلب، وسيتم تنظيمه يدويًا إذا تعذر تشغيل المساعد الآن.</p>
          )}
          <p className="mt-4 rounded border border-amber-300/35 bg-amber-950/35 p-3 text-sm leading-7 text-amber-100">{state.data.organizer.disclaimer}</p>
        </div>
      </section>
    );
  }

  return (
    <form aria-busy={state.type === "submitting"} className={darkFormClasses} data-hydrated={isHydrated ? "true" : "false"} data-testid="booking-stepper" method="post" noValidate onSubmit={submit}>
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => (
          <li key={label} className={stepItemClasses(index, step)}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TextInput className={darkControlClasses} error={errors.fullName} label="الاسم الكامل" name="fullName" required value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} />
          <TextInput className={darkControlClasses} error={errors.phone} label="رقم الهاتف" name="phone" required value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} />
          <TextInput className={darkControlClasses} error={errors.email} label="البريد الإلكتروني" name="email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
          <TextInput className={darkControlClasses} label="المدينة" name="city" value={values.city} onChange={(event) => updateValue("city", event.target.value)} />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select className={darkControlClasses} label="مجال الطلب" name="serviceCategory" value={values.serviceCategory} onChange={(event) => updateValue("serviceCategory", event.target.value)}>
              <option value="corporate">الشركات والعقود</option>
              <option value="real-estate">العقارات</option>
              <option value="employment">العمل</option>
              <option value="disputes">المنازعات</option>
            </Select>
            <Select className={darkControlClasses} label="درجة الاستعجال" name="urgency" value={values.urgency} onChange={(event) => updateValue("urgency", event.target.value as BookingValues["urgency"])}>
              <option value="LOW">منخفضة</option>
              <option value="NORMAL">عادية</option>
              <option value="HIGH">مرتفعة</option>
              <option value="URGENT">عاجلة</option>
            </Select>
            <Select className={darkControlClasses} label="طريقة التواصل" name="preferredMode" value={values.preferredMode} onChange={(event) => updateValue("preferredMode", event.target.value as BookingValues["preferredMode"])}>
              <option value="PHONE">هاتف</option>
              <option value="ONLINE">أونلاين</option>
              <option value="OFFICE">في المكتب</option>
            </Select>
          </div>
          <TextInput className={darkControlClasses} label="اسم الطرف الآخر إن وجد" name="opposingPartyName" value={values.opposingPartyName} onChange={(event) => updateValue("opposingPartyName", event.target.value)} />
          <Textarea
            className={darkControlClasses}
            error={errors.summary}
            label="ملخص الطلب"
            minLength={MIN_SUMMARY_LENGTH}
            name="summary"
            required
            value={values.summary}
            onChange={(event) => updateValue("summary", event.target.value)}
            hint={
              summaryRemaining > 0
                ? `اكتب ${summaryRemaining} حرفًا إضافيًا على الأقل. اذكر الواقعة الأساسية والتاريخ أو المطلوب من المكتب بدون إرفاق مستندات.`
                : "الملخص كافٍ للانتقال. لا ترسل مستندات أو بيانات شديدة الحساسية في هذه المرحلة."
            }
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-kmt-gold/20 bg-black/25 p-4 text-sm leading-7 text-slate-300">
            <p>
              <strong className="text-amber-100">الاسم:</strong> {values.fullName || "غير مكتمل"}
            </p>
            <p>
              <strong className="text-amber-100">الهاتف:</strong> {values.phone || "غير مكتمل"}
            </p>
            <p>
              <strong className="text-amber-100">المجال:</strong> {labelForServiceCategory(values.serviceCategory)}
            </p>
            <p>
              <strong className="text-amber-100">درجة الاستعجال:</strong> {labelForUrgency(values.urgency)}
            </p>
            <p>
              <strong className="text-amber-100">طريقة التواصل:</strong> {preferredModeLabels[values.preferredMode]}
            </p>
            <p>
              <strong className="text-amber-100">الملخص:</strong> {values.summary || "غير مكتمل"}
            </p>
          </div>
          <p className="rounded border border-amber-300/35 bg-amber-950/35 p-3 text-sm leading-7 text-amber-100">{AI_REVIEW_DISCLAIMER.ar}</p>
          <label className="flex items-start gap-3 text-sm leading-7 !text-slate-300" htmlFor="booking-consent">
            <input
              aria-describedby={errors.consent ? "booking-consent-error" : undefined}
              aria-invalid={errors.consent ? true : undefined}
              checked={values.consent}
              className="mt-1 rounded border-kmt-gold/40 bg-black/30 text-kmt-gold focus:ring-kmt-gold disabled:opacity-50"
              id="booking-consent"
              required
              type="checkbox"
              onChange={(event) => updateValue("consent", event.target.checked)}
            />
            أوافق على استخدام البيانات لمراجعة الطلب والتواصل بخصوصه، وأفهم أن النموذج لا يقدم استشارة قانونية نهائية.
          </label>
          {errors.consent ? (
            <p id="booking-consent-error" className="text-sm leading-6 text-kmt-danger">
              {errors.consent}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.type === "error" ? (
        <p className="mt-5 rounded border border-red-300/35 bg-red-950/50 p-3 text-sm leading-6 text-red-100" role="alert">
          {state.message} {state.requestId ? <span className="ltr inline-block">({state.requestId})</span> : null}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button className={darkSecondaryButtonClasses} disabled={state.type === "submitting"} type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>
            رجوع
          </Button>
        ) : null}
        <Button disabled={state.type === "submitting"} loading={state.type === "submitting"} type="submit">
          {step === 2 ? "إرسال الطلب" : "متابعة"}
        </Button>
      </div>
    </form>
  );
}

function validateStep(step: number, values: BookingValues): FieldErrors {
  if (step === 0) {
    const errors: FieldErrors = {};

    if (values.fullName.trim().length < 2) {
      errors.fullName = "اكتب الاسم الكامل حتى نعرف صاحب الطلب.";
    }

    if (values.phone.trim().length < 6) {
      errors.phone = "اكتب رقم هاتف صحيح للتواصل معك.";
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      errors.email = "اكتب بريدًا إلكترونيًا صحيحًا أو اترك الحقل فارغًا.";
    }

    return errors;
  }

  if (step === 1 && values.summary.trim().length < MIN_SUMMARY_LENGTH) {
    return {
      summary: `الملخص قصير. اكتب ${MIN_SUMMARY_LENGTH} حرفًا على الأقل حتى يقدر الفريق مراجعة الطلب.`
    };
  }

  if (step === 2 && !values.consent) {
    return {
      consent: "يجب الموافقة على استخدام البيانات قبل إرسال الطلب."
    };
  }

  return {};
}

function labelForServiceCategory(category?: string | null) {
  if (!category) return "غير محدد";
  return serviceCategoryLabels[category] ?? category;
}

function labelForUrgency(urgency?: string | null) {
  if (!urgency) return "غير محددة";
  return urgencyLabels[urgency.toUpperCase()] ?? urgency;
}

function categoryFromInitialService(initialService?: string) {
  if (!initialService) return initialValues.serviceCategory;
  const service = legalServices.find((item) => item.title === initialService || item.slug === initialService);
  return service?.category ?? initialValues.serviceCategory;
}
