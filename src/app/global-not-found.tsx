import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFoundContent as copy } from "@/content/not-found-content";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 | KMT Legal",
  description: "The requested KMT Legal page could not be found.",
  robots: { index: false, follow: false }
};

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[var(--kmt-public-canvas)] text-[var(--kmt-public-text)]">
        <main
          className="relative isolate flex min-h-screen items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8"
          data-testid="global-not-found"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_12%,rgba(199,154,82,0.18),transparent_32%),radial-gradient(circle_at_82%_82%,rgba(153,123,68,0.12),transparent_30%),linear-gradient(145deg,#060504,#0b0f13_58%,#060504)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]"
          />

          <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[rgba(199,154,82,0.25)] bg-black/25 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-10 lg:p-14">
            <div className="flex items-center gap-3">
              <Image
                alt=""
                aria-hidden="true"
                className="h-12 w-12 rounded-xl object-cover"
                height={48}
                priority
                src="/brand/kmt-logo-icon.png"
                width={48}
              />
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--kmt-public-gold)]" dir="ltr">
                {copy.brand}
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="font-sans text-[clamp(5rem,18vw,11rem)] font-semibold leading-none text-[var(--kmt-public-gold)]" dir="ltr">
                  {copy.code}
                </p>
                <p className="mt-3 text-sm font-semibold text-[var(--kmt-public-gold)]">{copy.ar.eyebrow}</p>
              </div>

              <div>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
                  {copy.ar.title}
                  <span className="mt-3 block font-sans text-xl font-medium text-[var(--kmt-public-muted)] sm:text-2xl" dir="ltr">
                    {copy.en.title}
                  </span>
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--kmt-public-muted)]">
                  {copy.ar.description}
                </p>
                <p className="mt-2 max-w-2xl font-sans text-sm leading-7 text-[var(--kmt-public-muted)]" dir="ltr">
                  {copy.en.description}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--kmt-public-gold)] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e0b66f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--kmt-public-gold)]"
                    href="/ar"
                  >
                    {copy.ar.home}
                  </Link>
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(199,154,82,0.45)] bg-[rgba(199,154,82,0.08)] px-6 py-3 font-sans text-sm font-semibold text-[var(--kmt-public-gold)] transition hover:border-[rgba(199,154,82,0.75)] hover:bg-[rgba(199,154,82,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--kmt-public-gold)]"
                    dir="ltr"
                    href="/"
                  >
                    {copy.en.home}
                  </Link>
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-[rgba(199,154,82,0.6)] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--kmt-public-gold)]"
                    href="/login?next=/client"
                  >
                    {copy.ar.clientLogin}
                    <span className="ms-2 font-sans" dir="ltr">/ {copy.en.clientLogin}</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
