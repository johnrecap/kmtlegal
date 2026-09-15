import { rootMetadata } from "../root-metadata";
import { getClientContent, normalizeClientLocale } from "@/content/client-content";
import { getAuthContextForPage } from "@/server/auth/page-guards";
import { getApplicationReadiness } from "@/server/health/runtime-readiness";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "../globals.css";

export const metadata = rootMetadata;
export const dynamic = "force-dynamic";

export default async function ClientRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const readiness = isNextBuildPhase() ? null : await getApplicationReadiness();
  const context = readiness && !readiness.ready ? null : await getAuthContextForPage();
  const locale = normalizeClientLocale(context?.user.locale);
  const page = readiness && !readiness.ready
    ? <ClientReadinessBlocked locale={locale} checks={readiness.checks} />
    : children;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark">{page}</ThemeProvider>
      </body>
    </html>
  );
}

function isNextBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build";
}

function ClientReadinessBlocked({
  checks,
  locale
}: {
  checks: Array<{ id: string; ok: boolean; blocking: boolean; label: string; message: string }>;
  locale: "ar" | "en";
}) {
  const copy = getClientContent(locale).shell;
  const failedChecks = checks.filter((check) => !check.ok && check.blocking);

  return (
    <main className="min-h-screen bg-[#060504] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-kmt-gold" dir="ltr">KMT Legal</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">{copy.readinessTitle}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">{copy.readinessDescription}</p>
        <div className="mt-8 overflow-hidden border border-white/15 bg-white/5">
          {failedChecks.length === 0 ? (
            <div className="px-5 py-4 text-sm text-slate-300">{copy.readinessUnknown}</div>
          ) : (
            failedChecks.map((check) => (
              <div key={check.id} className="border-b border-white/10 px-5 py-4 last:border-b-0">
                <p className="text-sm font-semibold text-amber-200">{check.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{check.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
