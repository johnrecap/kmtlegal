"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { signedInRedirectPath } from "@/lib/auth-routing";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, MaterialSymbol, TextInput } from "@/components/ui";

type LoginResponse = {
  status?: "authenticated" | "two_factor_required";
  user?: {
    role: string;
  };
  error?: {
    message?: string;
  };
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as LoginResponse;
  return {
    data,
    message: data.error?.message ?? "تعذر تنفيذ الطلب الآن. حاول مرة أخرى."
  };
}

function validateLoginFields(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = "اكتب البريد الإلكتروني.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "اكتب بريدًا إلكترونيًا صحيحًا.";
  }

  if (!password) {
    errors.password = "اكتب كلمة المرور.";
  }

  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const notice =
    searchParams.get("reason") === "2fa_expired"
      ? "انتهت جلسة التحقق الثنائي. سجل الدخول مرة أخرى ثم اطلب كود بريد جديد."
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

    const nextFieldErrors = validateLoginFields(email, password);
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
      const { data, message } = await readApiMessage(response);

      if (!response.ok) {
        setError(message);
        return;
      }

      if (data.status === "two_factor_required") {
        setError("التحقق الثنائي لفريق المكتب غير متاح في هذا الإصدار. تواصل مع مسؤول النظام قبل إعادة المحاولة.");
        return;
      }

      if (data.status === "authenticated" && data.user?.role) {
        router.push(signedInRedirectPath(data.user.role, requestedNext));
        router.refresh();
        return;
      }

      setError("استجابة تسجيل الدخول غير مكتملة.");
    } catch {
      setError("لا يمكن الوصول إلى الخادم الآن. تأكد أن السيرفر وقاعدة البيانات يعملان.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader>
        <CardTitle>تسجيل الدخول</CardTitle>
        <CardDescription>ادخل بيانات حسابك للوصول إلى بوابة العميل أو لوحة المكتب.</CardDescription>
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
            error={fieldErrors.email}
            inputMode="email"
            label="البريد الإلكتروني"
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
            label="كلمة المرور"
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
            دخول
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
