"use client";

import { FormEvent, useRef, useState } from "react";
import { Button, MaterialSymbol, Select, Textarea, TextInput } from "@/components/ui";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { getPublicContent } from "@/content/public-content";
import { publicPanel } from "@/features/public-site/public-components";
import { publicMotionButton, publicMotionForm, publicMotionStatus } from "@/features/public-site/public-motion";
import { cn } from "@/lib/cn";
import type { PublicLocale } from "@/lib/public-locale";
import { useHydrated } from "@/lib/use-hydrated";

type ContactStatus =
  | { type: "idle" }
  | { type: "submitting" }
  | { type: "success"; message: string; requestId?: string }
  | { type: "error"; message: string; requestId?: string };

type ContactFieldKey = "fullName" | "email" | "phone" | "topic" | "message" | "consent";
type ContactFieldErrors = Partial<Record<ContactFieldKey, string>>;

type ContactErrorPayload = {
  error?: {
    message?: string;
    requestId?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

const initialValues = {
  fullName: "",
  email: "",
  phone: "",
  topic: "consultation",
  message: "",
  consent: false
};

const consentInputId = "contact-consent";
const consentErrorId = "contact-consent-error";

export function ContactForm({ locale = "en" }: { locale?: PublicLocale }) {
  const copy = getPublicContent(locale).contactForm;
  const isHydrated = useHydrated();
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState<ContactStatus>({ type: "idle" });
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const submitInFlight = useRef(false);
  const isSubmitting = status.type === "submitting";
  const isLockedAfterSuccess = status.type === "success";
  const fieldsDisabled = !isHydrated || isSubmitting || isLockedAfterSuccess;

  function updateValue<Key extends keyof typeof initialValues>(key: Key, value: (typeof initialValues)[Key]) {
    setValues((current) => ({ ...current, [key]: value }));

    if (fieldErrors[key] !== undefined) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }

    if (status.type === "error") {
      setStatus({ type: "idle" });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isHydrated || isSubmitting || submitInFlight.current || isLockedAfterSuccess) {
      return;
    }

    submitInFlight.current = true;
    setFieldErrors({});
    setStatus({ type: "submitting" });

    try {
      const response = await fetch(`/api/public/contact?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const errorPayload = (body ?? {}) as ContactErrorPayload;
        setFieldErrors(fieldErrorsFromDetails(errorPayload.error?.details, copy.fieldErrors));
        setStatus({
          type: "error",
          message: errorPayload.error?.message ?? copy.fallbackError,
          requestId: errorPayload.error?.requestId
        });
        return;
      }

      setStatus({ type: "success", message: copy.success, requestId: body?.requestId });
      setValues(initialValues);
    } catch {
      setStatus({
        type: "error",
        message: copy.fallbackError
      });
    } finally {
      submitInFlight.current = false;
    }
  }

  return (
    <form
      aria-busy={isSubmitting}
      className={cn(publicPanel, publicMotionForm, "p-5 md:p-6")}
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="contact-form"
      method="post"
      onSubmit={submit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          autoComplete="name"
          disabled={fieldsDisabled}
          error={fieldErrors.fullName}
          label={copy.fullName}
          name="fullName"
          required
          value={values.fullName}
          onChange={(event) => updateValue("fullName", event.target.value)}
        />
        <TextInput
          autoComplete="email"
          disabled={fieldsDisabled}
          error={fieldErrors.email}
          label={copy.email}
          name="email"
          required
          type="email"
          value={values.email}
          onChange={(event) => updateValue("email", event.target.value)}
        />
        <TextInput
          autoComplete="tel"
          dir="ltr"
          disabled={fieldsDisabled}
          error={fieldErrors.phone}
          inputMode="tel"
          label={copy.phone}
          name="phone"
          value={values.phone}
          onChange={(event) => updateValue("phone", event.target.value)}
        />
        <Select disabled={fieldsDisabled} error={fieldErrors.topic} label={copy.topic} name="topic" value={values.topic} onChange={(event) => updateValue("topic", event.target.value)}>
          <option value="consultation">{copy.topics.consultation}</option>
          <option value="documents">{copy.topics.documents}</option>
          <option value="media">{copy.topics.media}</option>
          <option value="other">{copy.topics.other}</option>
        </Select>
      </div>
      <div className="mt-4">
        <Textarea
          disabled={fieldsDisabled}
          error={fieldErrors.message}
          label={copy.message}
          name="message"
          required
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          hint={copy.hint}
        />
      </div>
      <div className="mt-4">
        <label className="flex items-start gap-3 text-sm leading-7 text-foreground" htmlFor={consentInputId}>
          <input
            aria-describedby={fieldErrors.consent ? consentErrorId : undefined}
            aria-invalid={fieldErrors.consent ? true : undefined}
            checked={values.consent}
            className="mt-1.5 h-4 w-4 shrink-0 rounded border-border accent-kmt-gold focus:ring-2 focus:ring-ring/25 disabled:opacity-55"
            disabled={fieldsDisabled}
            id={consentInputId}
            name="consent"
            required
            type="checkbox"
            onChange={(event) => updateValue("consent", event.target.checked)}
          />
          <span>{copy.consent}</span>
        </label>
        {fieldErrors.consent ? (
          <p className="mt-1 ps-7 text-sm leading-6 text-kmt-danger" id={consentErrorId} role="alert">
            {fieldErrors.consent}
          </p>
        ) : null}
      </div>
      {status.type === "success" ? (
        <div
          className={cn("mt-4 flex items-start gap-3 rounded border border-success-border bg-success-surface p-3 text-sm leading-6 text-success-strong", publicMotionStatus)}
          role="status"
        >
          <MaterialSymbol className="kmt-motion-check mt-0.5 text-lg" name="check_circle" />
          <p>{status.message}</p>
        </div>
      ) : null}
      {status.type === "error" ? (
        <p className={cn("mt-4 rounded border border-danger-border bg-danger-surface p-3 text-sm leading-6 text-danger-strong", publicMotionStatus)} role="alert">
          {status.message} {status.requestId ? <span className="ltr inline-block">({status.requestId})</span> : null}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {/*
          Aceternity Stateful Button drives the submit interaction
          (click → loader → success check). The form onSubmit above stays
          the single authority for validation, guards, and outcomes; the
          button carries no onClick so Enter-key submits behave identically.
        */}
        <StatefulButton
          aria-busy={isSubmitting}
          className="bg-kmt-gold font-semibold text-[#120d07] ring-offset-[var(--kmt-public-surface)] hover:ring-2 hover:ring-kmt-gold disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          disabled={!isHydrated || isSubmitting || isLockedAfterSuccess}
          type="submit"
        >
          {copy.submit}
        </StatefulButton>
        {isLockedAfterSuccess ? (
          <Button
            className={publicMotionButton}
            type="button"
            variant="secondary"
            onClick={() => {
              setValues(initialValues);
              setFieldErrors({});
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

function fieldErrorsFromDetails(
  details: Array<{ path?: string; message?: string }> | undefined,
  copy: Record<ContactFieldKey, string>
): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  for (const detail of details ?? []) {
    const key = detail.path as ContactFieldKey | undefined;
    if (key && key in copy && errors[key] === undefined) {
      errors[key] = copy[key];
    }
  }

  return errors;
}
