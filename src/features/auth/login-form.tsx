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

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as LoginResponse;
  return {
    data,
    message: data.error?.message ?? "تعذر تنفيذ الطلب الآن. حاول مرة أخرى."
  };
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const { data, message } = await readApiMessage(response);

      if (!response.ok) {
        setError(message);
        return;
      }

      if (data.status === "two_factor_required") {
        setError("Staff 2FA is disabled in this release. Set STAFF_2FA_MODE=disabled and try again.");
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
        <form className="space-y-5" onSubmit={onSubmit}>
          {notice ? (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800" role="status">
              {notice}
            </div>
          ) : null}
          <TextInput
            autoComplete="email"
            inputMode="email"
            label="البريد الإلكتروني"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
          <TextInput
            autoComplete="current-password"
            label="كلمة المرور"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
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
