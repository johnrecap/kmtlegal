"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, Select, Textarea, TextInput } from "@/components/ui";
import { getPublicContent } from "@/content/public-content";
import { publicMotionButton, publicMotionControl, publicMotionForm, publicMotionStatus } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";

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

const darkFormClasses =
  cn(
    publicMotionForm,
    "relative overflow-hidden rounded-lg border border-kmt-gold/25 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_50%,#050505_100%)] p-5 shadow-[0_28px_90px_-56px_rgba(0,0,0,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-l before:from-transparent before:via-kmt-gold/70 before:to-transparent [&_label]:text-amber-100 [&_p[id$='-hint']]:text-slate-300 [&_p[id$='-error']]:text-red-200 [&_select+span]:text-kmt-gold"
  );

const darkControlClasses =
  cn(
    publicMotionControl,
    "!border-kmt-gold/25 !bg-black/30 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!border-white/10 disabled:!bg-black/40 disabled:!text-slate-500"
  );

const darkSecondaryButtonClasses =
  cn(publicMotionButton, "!border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white");

export function ContactForm({ locale = "en" }: { locale?: PublicLocale }) {
  const copy = getPublicContent(locale).contactForm;
  const [isHydrated, setIsHydrated] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<ContactStatus>({ type: "idle" });
  const isSubmitting = status.type === "submitting";
  const isLockedAfterSuccess = status.type === "success";
  const fieldsDisabled = isSubmitting || isLockedAfterSuccess;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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

    const response = await fetch(`/api/public/contact?locale=${locale}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, locale })
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus({
        type: "error",
        message: body?.error?.message ?? copy.fallbackError,
        requestId: body?.error?.requestId
      });
      return;
    }

    setStatus({ type: "success", message: copy.success, requestId: body?.requestId });
    setValues(initialValues);
  }

  return (
    <form aria-busy={isSubmitting} className={darkFormClasses} data-hydrated={isHydrated ? "true" : "false"} data-testid="contact-form" method="post" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput className={darkControlClasses} disabled={fieldsDisabled} label={copy.fullName} name="fullName" required value={values.fullName} onChange={(event) => updateValue("fullName", event.target.value)} />
        <TextInput className={darkControlClasses} disabled={fieldsDisabled} label={copy.email} name="email" required type="email" value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
        <TextInput className={darkControlClasses} disabled={fieldsDisabled} label={copy.phone} name="phone" value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} />
        <Select className={darkControlClasses} disabled={fieldsDisabled} label={copy.topic} name="topic" value={values.topic} onChange={(event) => updateValue("topic", event.target.value)}>
          <option value="consultation">{copy.topics.consultation}</option>
          <option value="documents">{copy.topics.documents}</option>
          <option value="media">{copy.topics.media}</option>
          <option value="other">{copy.topics.other}</option>
        </Select>
      </div>
      <div className="mt-4">
        <Textarea
          className={darkControlClasses}
          label={copy.message}
          name="message"
          required
          disabled={fieldsDisabled}
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          hint={copy.hint}
        />
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm leading-7 !text-slate-300">
        <input
          checked={values.consent}
          className="mt-1 rounded border-kmt-gold/40 bg-black/30 text-kmt-gold focus:ring-kmt-gold disabled:opacity-50"
          disabled={fieldsDisabled}
          required
          type="checkbox"
          onChange={(event) => updateValue("consent", event.target.checked)}
        />
        {copy.consent}
      </label>
      {status.type === "success" ? (
        <p className={cn("mt-4 rounded border border-emerald-300/35 bg-emerald-950/45 p-3 text-sm leading-6 text-emerald-100", publicMotionStatus)} role="status">
          {status.message}
        </p>
      ) : null}
      {status.type === "error" ? (
        <p className={cn("mt-4 rounded border border-red-300/35 bg-red-950/50 p-3 text-sm leading-6 text-red-100", publicMotionStatus)} role="alert">
          {status.message} {status.requestId ? <span className="ltr inline-block">({status.requestId})</span> : null}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button className={publicMotionButton} disabled={isLockedAfterSuccess} loading={isSubmitting} type="submit">
          {copy.submit}
        </Button>
        {isLockedAfterSuccess ? (
          <Button
            className={darkSecondaryButtonClasses}
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(initialValues);
              setStatus({ type: "idle" });
            }}
          >
            {copy.newMessage}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
