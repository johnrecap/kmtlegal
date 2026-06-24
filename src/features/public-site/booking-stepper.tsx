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

export function BookingStepper({ initialService }: { initialService?: string }) {
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
      <section className="rounded-lg border border-green-200 bg-green-50 p-6" role="status">
        <div className="flex items-center gap-3">
          <MaterialSymbol className="text-3xl text-green-700" name="check_circle" />
          <div>
            <h2 className="text-2xl font-semibold text-green-950">تم إرسال طلب الاستشارة</h2>
            <p className="mt-1 text-sm text-green-900">
              رقم المتابعة: <span className="ltr inline-block font-semibold">{state.data.reference}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-green-200 bg-white p-4">
          <h3 className="font-semibold text-kmt-ink">تنظيم مبدئي للطلب</h3>
          {state.data.organizer.status === "ready" ? (
            <div className="mt-3 grid gap-3 text-sm leading-7 text-kmt-muted">
              <p>تم حفظ ملخص الطلب وتنظيمه لمساعدة فريق المكتب على المراجعة والتواصل معك.</p>
              <p>
                المجال المبدئي: {labelForServiceCategory(state.data.organizer.classification?.category)} · درجة الاستعجال:{" "}
                {labelForUrgency(state.data.organizer.classification?.urgency)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-kmt-muted">تم حفظ الطلب، وسيتم تنظيمه يدويًا إذا تعذر تشغيل المساعد الآن.</p>
          )}
          <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900">{state.data.organizer.disclaimer}</p>
        </div>
      </section>
    );
  }

  return (
    <form className="rounded-lg border border-kmt-border bg-white p-5" noValidate onSubmit={submit}>
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "rounded bg-kmt-navy px-3 py-2 text-sm font-medium text-white" : "rounded bg-slate-100 px-3 py-2 text-sm font-medium text-kmt-muted"}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TextInput error={errors.fullName} label="الاسم الكامل" name="fullName" required value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} />
          <TextInput error={errors.phone} label="رقم الهاتف" name="phone" required value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} />
          <TextInput error={errors.email} label="البريد الإلكتروني" name="email" type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
          <TextInput label="المدينة" name="city" value={values.city} onChange={(event) => updateValue("city", event.target.value)} />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="مجال الطلب" name="serviceCategory" value={values.serviceCategory} onChange={(event) => updateValue("serviceCategory", event.target.value)}>
              <option value="corporate">الشركات والعقود</option>
              <option value="real-estate">العقارات</option>
              <option value="employment">العمل</option>
              <option value="disputes">المنازعات</option>
            </Select>
            <Select label="درجة الاستعجال" name="urgency" value={values.urgency} onChange={(event) => updateValue("urgency", event.target.value as BookingValues["urgency"])}>
              <option value="LOW">منخفضة</option>
              <option value="NORMAL">عادية</option>
              <option value="HIGH">مرتفعة</option>
              <option value="URGENT">عاجلة</option>
            </Select>
            <Select label="طريقة التواصل" name="preferredMode" value={values.preferredMode} onChange={(event) => updateValue("preferredMode", event.target.value as BookingValues["preferredMode"])}>
              <option value="PHONE">هاتف</option>
              <option value="ONLINE">أونلاين</option>
              <option value="OFFICE">في المكتب</option>
            </Select>
          </div>
          <TextInput label="اسم الطرف الآخر إن وجد" name="opposingPartyName" value={values.opposingPartyName} onChange={(event) => updateValue("opposingPartyName", event.target.value)} />
          <Textarea
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
          <div className="rounded-lg border border-kmt-border bg-kmt-canvas p-4 text-sm leading-7 text-kmt-muted">
            <p>
              <strong className="text-kmt-ink">الاسم:</strong> {values.fullName || "غير مكتمل"}
            </p>
            <p>
              <strong className="text-kmt-ink">الهاتف:</strong> {values.phone || "غير مكتمل"}
            </p>
            <p>
              <strong className="text-kmt-ink">المجال:</strong> {labelForServiceCategory(values.serviceCategory)}
            </p>
            <p>
              <strong className="text-kmt-ink">درجة الاستعجال:</strong> {labelForUrgency(values.urgency)}
            </p>
            <p>
              <strong className="text-kmt-ink">طريقة التواصل:</strong> {preferredModeLabels[values.preferredMode]}
            </p>
            <p>
              <strong className="text-kmt-ink">الملخص:</strong> {values.summary || "غير مكتمل"}
            </p>
          </div>
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900">{AI_REVIEW_DISCLAIMER.ar}</p>
          <label className="flex items-start gap-3 text-sm leading-7 text-kmt-muted" htmlFor="booking-consent">
            <input
              aria-describedby={errors.consent ? "booking-consent-error" : undefined}
              aria-invalid={errors.consent ? true : undefined}
              checked={values.consent}
              className="mt-1 rounded border-kmt-border text-kmt-gold focus:ring-kmt-gold"
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
        <p className="mt-5 rounded border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800" role="alert">
          {state.message} {state.requestId ? <span className="ltr inline-block">({state.requestId})</span> : null}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <Button disabled={state.type === "submitting"} type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>
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
