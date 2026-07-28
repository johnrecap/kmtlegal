"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, MaterialSymbol, TextInput } from "@/components/ui";
import { getAuthContent } from "@/content/auth-content";
import type { ClientLocale } from "@/content/client-content";
import { signedInRedirectPath } from "@/lib/auth-routing";

type LoginResponse = {
  status?: "authenticated" | "two_factor_required";
  user?: {
    role: string;
  };
  error?: {
    code?: string;
  };
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

async function readApiResult(response: Response) {
  return (await response.json().catch(() => ({}))) as LoginResponse;
}
function validateLoginFields(
  email: string,
  password: string,
  copy: ReturnType<typeof getAuthContent>["login"]
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = copy.emailRequired;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = copy.emailInvalid;
  }

  if (!password) {
    errors.password = copy.passwordRequired;
  }

  return errors;
}

export function LoginForm({ locale }: { locale: ClientLocale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = getAuthContent(locale).login;
  const requestedNext = searchParams.get("next");
  const notice =
    searchParams.get("reason") === "2fa_expired"
      ? copy.twoFactorExpired
      : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateEmail(value: string) {
    setEmail(value);
    setFieldErrors((current) => ({ ...current, email: undefined }));
    setError(null);
  }

  function updatePassword(value: string) {
    setPassword(value);
    setFieldErrors((current) => ({ ...current, password: undefined }));
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextFieldErrors = validateLoginFields(email, password, copy);
    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await readApiResult(response);

      if (!response.ok) {
        setError(loginErrorMessage(data.error?.code, copy));
        return;
      }

      if (data.status === "two_factor_required") {
        setError(copy.twoFactorUnavailable);
        return;
      }

      if (data.status === "authenticated" && data.user?.role) {
        router.push(signedInRedirectPath(data.user.role, requestedNext));
        router.refresh();
        return;
      }

      setError(copy.incompleteResponse);
    } catch {
      setError(copy.serverUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle>{copy.formTitle}</CardTitle>
        <CardDescription>{copy.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={onSubmit}>
          {notice ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800" role="status">
              {notice}
            </div>
          ) : null}
          <TextInput
            autoComplete="email"
            dir="ltr"
            error={fieldErrors.email}
            inputMode="email"
            label={copy.email}
            name="email"
            onChange={(event) => updateEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
          <TextInput
            autoComplete="current-password"
            error={fieldErrors.password}
            label={copy.password}
            name="password"
            onChange={(event) => updatePassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error ? (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-kmt-danger" role="alert">
              {error}
            </div>
          ) : null}
          <Button
            className="w-full"
            loading={isSubmitting}
            trailingIcon={<MaterialSymbol className="text-[18px] rtl:rotate-180" name="arrow_forward" />}
            type="submit"
          >
            {copy.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function loginErrorMessage(
  code: string | undefined,
  copy: ReturnType<typeof getAuthContent>["login"]
) {
  switch (code) {
    case "AUTH_REQUIRED":
    case "INVALID_CREDENTIALS":
      return copy.invalidCredentials;
    case "RATE_LIMITED":
    case "TOO_MANY_REQUESTS":
      return copy.tooManyRequests;
    case "BAD_REQUEST":
    case "VALIDATION_ERROR":
      return copy.invalidRequest;
    case "SERVICE_UNAVAILABLE":
      return copy.serverUnavailable;
    default:
      return copy.requestFailed;
  }
}
