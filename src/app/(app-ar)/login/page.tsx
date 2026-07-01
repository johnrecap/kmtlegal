import type { Metadata } from "next";
import { Suspense } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول | KMT Legal",
  description: "تسجيل الدخول إلى بوابة العميل أو لوحة مكتب KMT Legal."
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-kmt-canvas">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-10">
        <section className="max-w-xl">
          <KmtBrandLogo className="max-w-[13rem]" href="/" size="sm" variant="full" />
          <h1 className="mt-8 text-4xl font-semibold leading-tight text-kmt-ink">وصول آمن للعميل وفريق المكتب.</h1>
          <p className="mt-4 text-base leading-8 text-kmt-muted">
            جلسات العمل تعتمد على كوكي آمن، وحسابات فريق المكتب محمية بصلاحيات واضحة ومراجعة داخلية لإجراءات الدخول.
          </p>
          <div className="mt-8 rounded-lg border border-kmt-border bg-white p-5 text-sm leading-7 text-kmt-muted">
            استخدم بيانات الحساب التي أرسلها لك فريق KMT Legal فقط. إذا تعذر الدخول، تواصل مع المكتب لإعادة التحقق من الحساب بدل تجربة بيانات غير موثوقة.
          </div>
        </section>
        <Suspense fallback={<div className="min-h-64 rounded-lg border border-kmt-border bg-white" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
