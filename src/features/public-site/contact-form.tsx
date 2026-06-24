"use client";

import { FormEvent, useState } from "react";
import { Button, Select, Textarea, TextInput } from "@/components/ui";

type ContactStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; message: string; requestId?: string }
  | { type: "error"; message: string; requestId?: string };

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  topic: "consultation",
  message: "",
  consent: false
};

export function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<ContactStatus>({ type: "idle" });
  const isSubmitting = status.type === "submitting";
  const isLockedAfterSuccess = status.type === "success";
  const fieldsDisabled = isSubmitting || isLockedAfterSuccess;

  function updateValue<Key extends keyof typeof initialValues>(key: Key, value: (typeof initialValues)[Key]) {
    setValues((current) => ({ ...current, [key]: value }));

    if (status.type === "error") {
      setStatus({ type: "idle" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLockedAfterSuccess) {
      return;
    }

    setStatus({ type: "submitting" });

    const response = await fetch("/api/public/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus({
        type: "error",
        message: body?.error?.message ?? "تعذر إرسال الرسالة. راجع البيانات وحاول مرة أخرى.",
        requestId: body?.error?.requestId
      });
      return;
    }

    setStatus({ type: "success", message: "تم استلام رسالتك. سيتواصل الفريق معك بعد المراجعة.", requestId: body?.requestId });
    setValues(initialValues);
  }

  return (
    <form className="rounded-lg border border-kmt-border bg-white p-5" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput disabled={fieldsDisabled} label="الاسم الكامل" name="fullName" required value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} />
        <TextInput disabled={fieldsDisabled} label="البريد الإلكتروني" name="email" required type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
        <TextInput disabled={fieldsDisabled} label="رقم الهاتف" name="phone" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} />
        <Select disabled={fieldsDisabled} label="الموضوع" name="topic" value={values.topic} onChange={(event) => updateValue("topic", event.target.value)}>
          <option value="consultation">طلب استشارة</option>
          <option value="documents">استفسار عن مستندات</option>
          <option value="media">إعلام أو محتوى</option>
          <option value="other">موضوع آخر</option>
        </Select>
      </div>
      <div className="mt-4">
        <Textarea
          label="الرسالة"
          name="message"
          required
          disabled={fieldsDisabled}
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          hint="لا ترسل مستندات أو بيانات حساسة عبر نموذج التواصل العام."
        />
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm leading-7 text-kmt-muted">
        <input
          checked={values.consent}
          className="mt-1 rounded border-kmt-border text-kmt-gold focus:ring-kmt-gold"
          disabled={fieldsDisabled}
          required
          type="checkbox"
          onChange={(event) => updateValue("consent", event.target.checked)}
        />
        أوافق على استخدام البيانات للتواصل بخصوص الرسالة وفق سياسة الخصوصية.
      </label>
      {status.type === "success" ? (
        <p className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm leading-6 text-green-800" role="status">
          {status.message}
        </p>
      ) : null}
      {status.type === "error" ? (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800" role="alert">
          {status.message} {status.requestId ? <span className="ltr inline-block">({status.requestId})</span> : null}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={isLockedAfterSuccess} loading={isSubmitting} type="submit">
          إرسال الرسالة
        </Button>
        {isLockedAfterSuccess ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(initialValues);
              setStatus({ type: "idle" });
            }}
          >
            رسالة جديدة
          </Button>
        ) : null}
      </div>
    </form>
  );
}
