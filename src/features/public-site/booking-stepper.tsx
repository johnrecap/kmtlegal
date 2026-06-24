"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

const bookingStepKeys = ["contact", "details", "review"] as const;

export function BookingStepper({ initialService }: { initialService?: string }) {
  const [step, setStep] = useState(0);
  const trackedSteps = useRef(new Set<number>());
  const [values, setValues] = useState<BookingValues>({
    ...initialValues,
    serviceCategory: categoryFromInitialService(initialService)
  });
  const [state, setState] = useState<SubmitState>({ type: "idle" });
  const steps = ["بيانات التواصل", "تفاصيل الطلب", "مراجعة وإرسال"];

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

  const canContinue = useMemo(() => {
    if (step === 0) return values.fullName.trim().length >= 2 && values.phone.trim().length >= 6;
    if (step === 1) return values.summary.trim().length >= 20;
    return values.consent;
  }, [step, values]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
              <p>{state.data.organizer.intakeSummary?.summary}</p>
              <p>التصنيف المبدئي: {state.data.organizer.classification?.category}</p>
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
    <form className="rounded-lg border border-kmt-border bg-white p-5" onSubmit={submit}>
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "rounded bg-kmt-navy px-3 py-2 text-sm font-medium text-white" : "rounded bg-slate-100 px-3 py-2 text-sm font-medium text-kmt-muted"}>
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TextInput label="الاسم الكامل" name="fullName" required value={values.fullName} onChange={(event) => setValues({ ...values, fullName: event.target.value })} />
          <TextInput label="رقم الهاتف" name="phone" required value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
          <TextInput label="البريد الإلكتروني" name="email" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
          <TextInput label="المدينة" name="city" value={values.city} onChange={(event) => setValues({ ...values, city: event.target.value })} />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="مجال الطلب" name="serviceCategory" value={values.serviceCategory} onChange={(event) => setValues({ ...values, serviceCategory: event.target.value })}>
              <option value="corporate">الشركات والعقود</option>
              <option value="real-estate">العقارات</option>
              <option value="employment">العمل</option>
              <option value="disputes">المنازعات</option>
            </Select>
            <Select label="درجة الاستعجال" name="urgency" value={values.urgency} onChange={(event) => setValues({ ...values, urgency: event.target.value as BookingValues["urgency"] })}>
              <option value="LOW">منخفضة</option>
              <option value="NORMAL">عادية</option>
              <option value="HIGH">مرتفعة</option>
              <option value="URGENT">عاجلة</option>
            </Select>
            <Select label="طريقة التواصل" name="preferredMode" value={values.preferredMode} onChange={(event) => setValues({ ...values, preferredMode: event.target.value as BookingValues["preferredMode"] })}>
              <option value="PHONE">هاتف</option>
              <option value="ONLINE">أونلاين</option>
              <option value="OFFICE">في المكتب</option>
            </Select>
          </div>
          <TextInput label="اسم الطرف الآخر إن وجد" name="opposingPartyName" value={values.opposingPartyName} onChange={(event) => setValues({ ...values, opposingPartyName: event.target.value })} />
          <Textarea
            label="ملخص الطلب"
            name="summary"
            required
            value={values.summary}
            onChange={(event) => setValues({ ...values, summary: event.target.value })}
            hint="اكتب الوقائع الأساسية والتواريخ المهمة بدون إرفاق مستندات أو بيانات شديدة الحساسية في هذه المرحلة."
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
              <strong className="text-kmt-ink">المجال:</strong> {values.serviceCategory}
            </p>
            <p>
              <strong className="text-kmt-ink">الملخص:</strong> {values.summary || "غير مكتمل"}
            </p>
          </div>
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-900">{AI_REVIEW_DISCLAIMER.ar}</p>
          <label className="flex items-start gap-3 text-sm leading-7 text-kmt-muted">
            <input
              checked={values.consent}
              className="mt-1 rounded border-kmt-border text-kmt-gold focus:ring-kmt-gold"
              required
              type="checkbox"
              onChange={(event) => setValues({ ...values, consent: event.target.checked })}
            />
            أوافق على استخدام البيانات لمراجعة الطلب والتواصل بخصوصه، وأفهم أن النموذج لا يقدم استشارة قانونية نهائية.
          </label>
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
        <Button disabled={!canContinue} loading={state.type === "submitting"} type="submit">
          {step === 2 ? "إرسال الطلب" : "متابعة"}
        </Button>
      </div>
    </form>
  );
}

function categoryFromInitialService(initialService?: string) {
  if (!initialService) return initialValues.serviceCategory;
  const service = legalServices.find((item) => item.title === initialService || item.slug === initialService);
  return service?.category ?? initialValues.serviceCategory;
}
