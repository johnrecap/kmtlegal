import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans-arabic/300.css";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "material-symbols/outlined.css";
import { headers } from "next/headers";
import { shouldBypassReadinessGate } from "@/lib/readiness-routing";
import { getApplicationReadiness } from "@/server/health/runtime-readiness";
import "./globals.css";

export const metadata: Metadata = {
  title: "KMT Legal Platform",
  description: "KMT Legal planning and Stitch clone foundation",
  icons: {
    icon: "/favicon.ico"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = headers();
  const pathname = requestHeaders.get("x-kmt-pathname") ?? "/";
  const readiness = shouldBypassReadinessGate(pathname) ? null : await getApplicationReadiness();
  const page = readiness && !readiness.ready ? <ReadinessBlockedPage checks={readiness.checks} /> : children;

  return (
    <html lang="ar" dir="rtl">
      <body>{page}</body>
    </html>
  );
}

function ReadinessBlockedPage({ checks }: { checks: Array<{ id: string; ok: boolean; blocking: boolean; label: string; message: string }> }) {
  const failedChecks = checks.filter((check) => !check.ok && check.blocking);

  return (
    <main className="min-h-screen bg-kmt-canvas px-4 py-10 text-kmt-ink sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-kmt-gold">KMT Legal Readiness</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">النظام لم يكتمل تشغيله بعد</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-kmt-muted">
          تم إيقاف فتح التطبيق لأن فحوصات التشغيل الأساسية لم تكتمل. راجع الداتابيز والتهيئة والـ installer ثم أعد تشغيل الخدمة.
        </p>
        <div className="mt-8 overflow-hidden rounded border border-kmt-border bg-white">
          {failedChecks.length === 0 ? (
            <div className="px-5 py-4 text-sm text-kmt-muted">فحوصات الجاهزية لم ترجع سببًا محددًا. افحص سجل السيرفر و `/api/health`.</div>
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
