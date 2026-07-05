"use client";

import { type FormEvent, type InputHTMLAttributes, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicContent } from "@/content/public-content";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "@/components/ui";
import { publicMotionButton, publicMotionControl } from "./public-motion";

type ClientAccountSetupCopy = PublicContent["clientAccountSetup"];

type ClientAccountSetupFormProps = {
  token: string;
  initialEmail?: string | null;
  copy: ClientAccountSetupCopy;
};

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type SetupResponse = {
  data?: {
    redirectTo?: string;
  };
  error?: {
    message?: string;
    details?: Array<{ path?: string; message?: string }>;
  };
};

const inputClasses = cn(
  publicMotionControl,
  "w-full rounded-xl border border-kmt-gold/25 bg-black/35 px-3 py-3 text-base text-white placeholder:text-amber-100/45 outline-none transition-colors focus:border-kmt-gold focus:ring-2 focus:ring-kmt-gold/25 disabled:border-white/10 disabled:bg-black/45 disabled:text-stone-400"
);

export function ClientAccountSetupForm({ token, initialEmail, copy }: ClientAccountSetupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const errors = validateFields({ email, password, confirmPassword, copy });
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/client-account/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          email: email.trim(),
          password,
          confirmPassword,
          locale: "ar"
        })
      });
      const payload = (await response.json().catch(() => ({}))) as SetupResponse;

      if (!response.ok) {
        setMessage(payload.error?.message ?? copy.genericError);
        return;
      }

      setMessage(copy.success);
      router.replace(payload.data?.redirectTo ?? "/client");
      router.refresh();
    } catch {
      setMessage(copy.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <Field
        autoComplete="email"
        dir="ltr"
        error={fieldErrors.email}
        hint={copy.emailHint}
        inputMode="email"
        label={copy.emailLabel}
        name="email"
        onChange={(event) => {
          setEmail(event.target.value);
          setFieldErrors((current) => ({ ...current, email: undefined }));
          setMessage(null);
        }}
        placeholder="name@example.com"
        required
        type="email"
        value={email}
      />
      <Field
        autoComplete="new-password"
        error={fieldErrors.password}
        hint={copy.passwordHint}
        label={copy.passwordLabel}
        name="password"
        onChange={(event) => {
          setPassword(event.target.value);
          setFieldErrors((current) => ({ ...current, password: undefined }));
          setMessage(null);
        }}
        required
        type="password"
        value={password}
      />
      <Field
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
        label={copy.confirmPasswordLabel}
        name="confirmPassword"
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          setMessage(null);
        }}
        required
        type="password"
        value={confirmPassword}
      />

      {message ? (
        <div className="rounded-2xl border border-kmt-gold/25 bg-black/25 px-4 py-3 text-sm leading-7 text-amber-50" role="status">
          {message}
        </div>
      ) : null}

      <button
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363] disabled:cursor-not-allowed disabled:opacity-60",
          publicMotionButton
        )}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <MaterialSymbol name="account_circle" />}
        <span>{copy.submit}</span>
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  name,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  name: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-amber-50" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(inputClasses, error ? "border-red-300 focus:border-red-300" : undefined, className)}
        name={name}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs leading-6 text-amber-50/62">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm leading-6 text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateFields({
  email,
  password,
  confirmPassword,
  copy
}: {
  email: string;
  password: string;
  confirmPassword: string;
  copy: ClientAccountSetupCopy;
}) {
  const errors: FieldErrors = {};
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = copy.invalidEmail;
  }
  if (password.length < 10) {
    errors.password = copy.weakPassword;
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = copy.passwordMismatch;
  }

  return errors;
}
