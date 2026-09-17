"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { CountingNumber } from "@/components/animate-ui";
import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface HeroMatter {
  title: string;
  slug: string;
  summary: string;
  icon: string;
}

export interface HeroStat {
  value: number;
  suffix: string;
  label: string;
}

export interface HeroDocketCopy {
  title: string;
  matter: string;
  next: string;
  empty: string;
}

interface HeroParallaxLayersProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  pickerLabel: string;
  matters: ReadonlyArray<HeroMatter>;
  docket: HeroDocketCopy;
  stats?: ReadonlyArray<HeroStat>;
  nextStep: string;
  bookLabel: string;
  browseLabel: string;
  browseHref?: string;
  actions?: ReactNode;
  locale?: PublicLocale;
}

// NOTE: surfaces and text resolve to --kmt-public-* theme vars so a future
// day/night [data-theme] override flips this hero without touching this file.
export function HeroParallaxLayers({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "object-center",
  pickerLabel,
  matters,
  docket,
  stats,
  nextStep,
  bookLabel,
  browseLabel,
  browseHref = "/services",
  actions,
  locale = "en",
}: HeroParallaxLayersProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  const selected = matters.find((matter) => matter.slug === selectedSlug) ?? null;
  const bookingHref = selected
    ? localizedPublicHref(`/book-consultation?service=${encodeURIComponent(selected.slug)}`, locale)
    : localizedPublicHref("/book-consultation", locale);

  useEffect(() => {
    setMounted(true);
  }, []);

  const animateEntrance = mounted && !reducedMotion;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero='eyebrow']", { y: 22, autoAlpha: 0, duration: 0.7 })
          .from("[data-hero='rule']", { scaleX: 0, autoAlpha: 0, duration: 0.6 }, "-=0.3")
          .from("[data-hero='description']", { y: 26, autoAlpha: 0, duration: 0.75 }, "-=0.5")
          .from("[data-hero='picker']", { y: 30, autoAlpha: 0, duration: 0.75 }, "-=0.5")
          .from("[data-hero='chip']", { y: 18, autoAlpha: 0, duration: 0.55, stagger: 0.08 }, "-=0.55")
          .from("[data-hero='docket']", { y: 48, autoAlpha: 0, duration: 0.9 }, "-=0.7");

        gsap.to("[data-drift='motif']", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to("[data-drift='photo']", {
          yPercent: 10,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 1 },
        });
      });
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        gsap.to("[data-drift='docket']", {
          y: -220,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "+=700", scrub: 0.4 },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} className="relative isolate overflow-hidden bg-[var(--kmt-public-surface)] text-[var(--kmt-public-text)]" data-testid="public-hero-parallax">
      <div className="absolute -inset-y-[10%] inset-x-0" aria-hidden="true" data-drift="photo">
        <Image
          alt=""
          aria-hidden="true"
          className={cn("object-cover opacity-60", imagePosition)}
          data-testid="public-page-hero-image"
          fill
          priority
          sizes="100vw"
          src={image}
          onLoad={() => ScrollTrigger.refresh()}
        />
        <div className="absolute inset-0 bg-[rgb(var(--kmt-public-scrim)/0.7)]" aria-hidden="true" />
      </div>
      {animateEntrance ? (
        <GradientBackground
          aria-hidden="true"
          className="absolute inset-0 from-kmt-gold/20 via-transparent to-kmt-navy/25 opacity-60 rtl:bg-gradient-to-bl"
          transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-kmt-gold/20 via-transparent to-kmt-navy/25 opacity-60 rtl:bg-gradient-to-bl" aria-hidden="true" />
      )}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgb(var(--kmt-public-scrim)/0.7)] to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent via-[rgb(var(--kmt-public-scrim)/0.55)] to-[var(--kmt-public-surface)]" aria-hidden="true" />
      <div className="absolute inset-0 text-[var(--kmt-public-gold)] opacity-[0.07] [mask-image:radial-gradient(ellipse_80%_70%_at_70%_20%,black,transparent)]" aria-hidden="true" data-drift="motif">
        <svg className="h-full w-full" aria-hidden="true">
          <defs>
            <pattern id="kmt-arabesque" width="96" height="96" patternUnits="userSpaceOnUse">
              <g fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="28" y="28" width="40" height="40" />
                <rect x="28" y="28" width="40" height="40" transform="rotate(45 48 48)" />
                <circle cx="48" cy="48" r="5" />
                <circle cx="0" cy="0" r="11" />
                <circle cx="96" cy="0" r="11" />
                <circle cx="0" cy="96" r="11" />
                <circle cx="96" cy="96" r="11" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kmt-arabesque)" />
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-16 pt-20 sm:px-6 md:pb-24 md:pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-10">
        <div>
          <div data-hero="eyebrow">
            <p className="inline-flex items-center gap-2 rounded-full border border-kmt-gold/35 bg-kmt-gold/10 px-4 py-1.5 text-sm font-semibold text-[var(--kmt-public-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--kmt-public-gold)]" aria-hidden="true" />
              {eyebrow}
            </p>
          </div>
          <h1 data-hero="title" className="mt-6 max-w-xl text-4xl font-semibold leading-tight drop-shadow-[var(--kmt-public-text-shadow)] md:text-5xl" aria-label={title}>
            {animateEntrance ? (
              <GradientText
                text={title}
                gradient="linear-gradient(90deg, #755a26 0%, #997b44 20%, #f4cf88 50%, #997b44 80%, #755a26 100%)"
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <span>{title}</span>
            )}
          </h1>
          <span data-hero="rule" className="mt-6 block h-px w-24 origin-center bg-gradient-to-r from-[var(--kmt-public-gold)] to-transparent rtl:bg-gradient-to-l" aria-hidden="true" />
          <p data-hero="description" className="mt-6 max-w-xl text-base leading-9 text-[var(--kmt-public-muted)] md:text-lg">
            {description}
          </p>
          {stats && stats.length > 0 ? (
            <dl data-hero="stats" className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] px-3 py-3">
                  <dd dir="ltr" className="text-2xl font-semibold tabular-nums text-[var(--kmt-public-gold)]">
                    {animateEntrance ? <CountingNumber number={stat.value} /> : <span>{stat.value}</span>}
                    {stat.suffix}
                  </dd>
                  <dt className="mt-1 text-xs leading-5 text-[var(--kmt-public-muted)]">{stat.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          <div data-hero="picker" className="mt-8 rounded-2xl border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-5 md:p-6">
            <p id="hero-matter-label" className="text-sm font-semibold text-[var(--kmt-public-text)]">
              {pickerLabel}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="hero-matter-label">
              {matters.map((matter) => {
                const active = matter.slug === selectedSlug;
                return (
                  <button
                    key={matter.slug}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    data-hero="chip"
                    onClick={() => setSelectedSlug(active ? null : matter.slug)}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors duration-200",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                    active
                      ? "border-kmt-gold/70 bg-kmt-gold/15 text-[var(--kmt-public-text)]"
                      : "border-[var(--kmt-public-line)] bg-transparent text-[var(--kmt-public-muted)] hover:border-kmt-gold/50 hover:text-[var(--kmt-public-text)]"
                    )}
                  >
                    <MaterialSymbol className={cn("text-2xl", active ? "text-[var(--kmt-public-gold)]" : "text-[var(--kmt-public-muted)]")} name={matter.icon} />
                    <span className="text-sm font-medium leading-6">{matter.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 py-2 text-sm font-semibold text-[var(--kmt-public-gold)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                href={localizedPublicHref(browseHref, locale)}
              >
                {browseLabel}
                <MaterialSymbol className="text-lg rtl:rotate-180" name="arrow_forward" />
              </Link>
              {actions}
            </div>
          </div>
        </div>

        <div data-drift="docket" className="lg:mt-24">
          <div data-hero="docket" className="relative overflow-hidden rounded-2xl border border-kmt-gold/25 bg-[var(--kmt-public-surface-muted)] p-6 md:p-8" aria-live="polite">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)] to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <p className={cn("text-xs font-semibold text-[var(--kmt-public-muted)]", locale === "en" && "uppercase tracking-[0.2em]")}>{docket.title}</p>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border",
                   selected ? "border-kmt-gold/60 bg-kmt-gold/15 text-[var(--kmt-public-gold)]" : "border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] text-[var(--kmt-public-muted)]"
                )}
                aria-hidden="true"
              >
                <MaterialSymbol className="text-xl" name={selected ? "check_circle" : "schedule"} />
              </span>
            </div>

            <div className="mt-6">
              <p className={cn("text-xs font-semibold text-[var(--kmt-public-gold)]", locale === "en" && "uppercase tracking-[0.2em]")}>{docket.matter}</p>
              <p className="mt-2 min-h-8 text-xl font-semibold leading-8 text-[var(--kmt-public-text)]">
                {selected ? selected.title : "—"}
              </p>
              <p className="mt-2 min-h-14 text-sm leading-7 text-[var(--kmt-public-muted)]">
                {selected ? selected.summary : docket.empty}
              </p>
            </div>

            <div className="my-6 border-t border-dashed border-[var(--kmt-public-line)]" aria-hidden="true" />

            <div>
              <p className={cn("text-xs font-semibold text-[var(--kmt-public-gold)]", locale === "en" && "uppercase tracking-[0.2em]")}>{docket.next}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--kmt-public-muted)]">{nextStep}</p>
            </div>

            <LiquidButton
              asChild
              size="lg"
              hoverScale={animateEntrance ? 1.05 : 1}
              tapScale={animateEntrance ? 0.95 : 1}
              className="mt-6 w-full min-h-12 rounded text-base [--liquid-button-background-color:var(--primary)] [--liquid-button-color:var(--primary-foreground)] text-primary-foreground hover:text-primary"
            >
              <Link href={bookingHref}>
                <span className="inline-flex items-center justify-center gap-2">
                  {bookLabel}
                  <MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />
                </span>
              </Link>
            </LiquidButton>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--kmt-public-surface)]" aria-hidden="true" />
      <span className="sr-only">{locale === "ar" ? "مقدمة الموقع" : "Site introduction"}</span>
    </section>
  );
}
