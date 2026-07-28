import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { getAuthContent } from "@/content/auth-content";
import { normalizeClientLocale, type ClientLocale } from "@/content/client-content";
import { LoginForm } from "@/features/auth/login-form";
import { getApplicationReadiness } from "@/server/health/runtime-readiness";

type LoginSearchParams = {
  locale?: string;
  next?: string;
  reason?: string;
};

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<LoginSearchParams>;
}): Promise<Metadata> {
  const locale = normalizeClientLocale((await searchParams)?.locale);
  const content = getAuthContent(locale);

  return {
    title: content.metadata.title,
    description: content.metadata.description
  };
}
export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const locale = normalizeClientLocale(params?.locale);
  const content = getAuthContent(locale);
  const readiness = isNextBuildPhase() ? null : await getApplicationReadiness();

  if (readiness && !readiness.ready) {
    return <LoginReadinessBlocked locale={locale} checks={readiness.checks} />;
  }

  return (
    <main className="min-h-screen bg-kmt-canvas" dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-10">
        <section className="max-w-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <KmtBrandLogo
              className="max-w-[13rem]"
              href={locale === "ar" ? "/ar" : "/"}
              size="sm"
              variant="full"
            />
            <Link
              className="inline-flex min-h-11 items-center rounded-full border border-kmt-border bg-white px-4 text-sm font-semibold text-kmt-navy transition-colors hover:border-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
              href={loginLanguageHref(locale === "ar" ? "en" : "ar", params)}
              hrefLang={locale === "ar" ? "en" : "ar"}
            >
              {content.login.languageSwitch}
              <span className="sr-only"> — {content.login.languageSwitchLabel}</span>
            </Link>
          </div>
          <p className="mt-10 text-sm font-semibold text-kmt-gold">{content.login.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-kmt-ink">{content.login.title}</h1>
          <p className="mt-4 text-base leading-8 text-kmt-muted">{content.login.description}</p>
          <div className="mt-8 rounded-lg border border-kmt-border bg-white p-5 text-sm leading-7 text-kmt-muted">
            {content.login.securityNote}
          </div>
          <Link
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-kmt-navy underline decoration-kmt-gold/60 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
            href={locale === "ar" ? "/ar" : "/"}
          >
            {content.login.backHome}
          </Link>
        </section>
        <Suspense fallback={<div className="min-h-64 rounded-lg border border-kmt-border bg-white" />}>
          <LoginForm locale={locale} />
        </Suspense>
      </div>
    </main>
  );
}

function loginLanguageHref(locale: ClientLocale, params?: LoginSearchParams) {
  const search = new URLSearchParams();
  search.set("locale", locale);

  if (params?.next) {
    search.set("next", params.next);
  }

  if (params?.reason) {
    search.set("reason", params.reason);
  }

  return `/login?${search.toString()}`;
}

function LoginReadinessBlocked({
  locale,
  checks
}: {
  locale: ClientLocale;
  checks: Array<{ id: string; ok: boolean; blocking: boolean; label: string; message: string }>;
}) {
  const copy = getAuthContent(locale).readiness;
  const failedChecks = checks.filter((check) => !check.ok && check.blocking);

  return (
    <main
      className="min-h-screen bg-kmt-canvas px-4 py-10 text-kmt-ink sm:px-6 lg:px-8"
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
    >
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-kmt-gold">{copy.eyebrow}</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-kmt-muted">{copy.description}</p>
        <div className="mt-8 overflow-hidden rounded border border-kmt-border bg-white">
          {failedChecks.length === 0 ? (
            <div className="px-5 py-4 text-sm text-kmt-muted">{copy.unknown}</div>
          ) : (
            failedChecks.map((check) => (
              <div key={check.id} className="border-b border-kmt-border px-5 py-4 last:border-b-0">
                <p className="text-sm font-semibold text-kmt-danger">{check.label}</p>
                <p className="mt-1 text-sm leading-6 text-kmt-muted">{check.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function isNextBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
}
