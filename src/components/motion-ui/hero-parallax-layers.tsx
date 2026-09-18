"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionConfig } from "motion/react";
import { CountingNumber } from "@/components/animate-ui";
import { KmtGoldUnderline } from "@/components/ui/kmt-gold-underline";
import { KmtUnderlinedText, type KmtTextUnderlineEmphasis } from "@/components/ui/kmt-text-underline";
import { Spotlight } from "@/components/ui/spotlight-new";
import { TextAnimate } from "@/components/ui/text-animate";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerCtaLink } from "@/components/ui/shimmer-cta-link";
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
  /**
   * Optional single meaningful phrase inside `description` to emphasize with
   * the real Magic UI underline (`KmtTextUnderline`). The H1 itself is never
   * underlined.
   */
  descriptionHighlight?: string;
  /** Editorial weight for `descriptionHighlight`. Defaults to "normal". */
  descriptionEmphasis?: KmtTextUnderlineEmphasis;
}

// KMT gold environmental light for the Aceternity Spotlight. The upstream
// defaults are blue/purple; here both sources are restrained warm gold on
// deep black — felt more than noticed.
const SPOTLIGHT_GOLD_FIRST =
  "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgb(208 160 72 / 0.14) 0, rgb(168 120 48 / 0.05) 50%, rgb(168 120 48 / 0) 80%)";
const SPOTLIGHT_GOLD_SECOND =
  "radial-gradient(50% 50% at 50% 50%, rgb(208 160 72 / 0.09) 0, rgb(168 120 48 / 0.03) 80%, transparent 100%)";
const SPOTLIGHT_GOLD_THIRD =
  "radial-gradient(50% 50% at 50% 50%, rgb(234 201 135 / 0.06) 0, rgb(168 120 48 / 0.02) 80%, transparent 100%)";

// NOTE (hydration contract): this component renders ONE visual tree on the
// server and on the client. There are no mounted/reduced-motion branches —
// entrance motion is CSS/variant-based (SSR-safe, first paint already shows
// the final composition) and stats render their final values server-side
// (CountingNumber initiallyStable). GSAP is used ONLY for scroll-driven
// parallax, which never touches the initial state.
//
// NumberTicker note: Magic UI NumberTicker was evaluated and REJECTED (see
// final report). It SSRs its startValue (0), so first paint would show "0"
// before counting up — breaking this hydration contract and shifting the
// tabular width for multi-digit values — and it formats via en-US only.
// The vendored Animate UI CountingNumber renders final values SSR-side.
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
  descriptionHighlight,
  descriptionEmphasis,
}: HeroParallaxLayersProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected = matters.find((matter) => matter.slug === selectedSlug) ?? null;
  // APG radiogroup arrow-key behavior (Phase 03): arrows move selection and
  // focus together. Horizontal direction mirrors in RTL; vertical arrows are
  // direction-agnostic. Home/End jump to first/last. Tab + Enter/Space keep
  // working through the native buttons.
  const onPickerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = locale === "ar";
    let step: 1 | -1 | "first" | "last" | null = null;
    switch (event.key) {
      case "ArrowRight": step = rtl ? -1 : 1; break;
      case "ArrowLeft": step = rtl ? 1 : -1; break;
      case "ArrowDown": step = 1; break;
      case "ArrowUp": step = -1; break;
      case "Home": step = "first"; break;
      case "End": step = "last"; break;
      default: return;
    }
    event.preventDefault();
    if (matters.length === 0) return;
    let next: string;
    if (step === "first") next = matters[0].slug;
    else if (step === "last") next = matters[matters.length - 1].slug;
    else {
      const current = matters.findIndex((matter) => matter.slug === selectedSlug);
      const from = current === -1 ? (step === 1 ? -1 : 0) : current;
      next = matters[(from + step + matters.length) % matters.length].slug;
    }
    setSelectedSlug(next);
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-picker-option="${next}"]`)
      ?.focus();
  };
  const bookingHref = selected
    ? localizedPublicHref(`/book-consultation?service=${encodeURIComponent(selected.slug)}`, locale)
    : localizedPublicHref("/book-consultation", locale);
  // The Aceternity Spotlight runs two permanent full-screen rAF loops. They
  // are only useful while the hero is visible, so the layer unmounts once
  // the section scrolls well out of view (mount fade-in keeps re-entry
  // gentle). Initial state is true so SSR first paint matches hydration.
  const [spotlightLive, setSpotlightLive] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setSpotlightLive(entry.isIntersecting),
      { rootMargin: "25% 0px" }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to("[data-drift='motif']", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 1 },
        });
        gsap.to("[data-drift='photo']", {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 1 },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <MotionConfig reducedMotion="user">
      <section ref={rootRef} className="relative isolate overflow-hidden bg-[var(--kmt-public-canvas)] text-[var(--kmt-public-text)] lg:min-h-[92svh]" data-testid="public-hero-parallax">
        {/* Deep-black base + Aceternity Spotlight (KMT gold) + faint arabesque. */}
        <div className="absolute inset-0 bg-[radial-gradient(65%_45%_at_72%_0%,rgb(208_160_72/0.10),transparent_70%)]" aria-hidden="true" />
        {spotlightLive ? (
          <Spotlight
            gradientFirst={SPOTLIGHT_GOLD_FIRST}
            gradientSecond={SPOTLIGHT_GOLD_SECOND}
            gradientThird={SPOTLIGHT_GOLD_THIRD}
            duration={9}
          />
        ) : null}
        <div className="absolute inset-0 text-[var(--kmt-public-gold)] opacity-[0.05] [mask-image:radial-gradient(ellipse_80%_70%_at_70%_20%,black,transparent)]" aria-hidden="true" data-drift="motif">
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

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-10 lg:pt-24">
          <div className="flex flex-col">
            <div data-hero="eyebrow" className="kmt-hero-enter order-1" style={{ animationDelay: "0ms" }}>
              <p className="inline-flex items-center gap-2 rounded-full border border-kmt-gold/40 bg-kmt-gold/10 px-4 py-1.5 text-sm font-semibold text-[var(--kmt-public-text)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--kmt-public-gold)]" aria-hidden="true" />
                {eyebrow}
              </p>
            </div>
            <TextAnimate
              as="h1"
              by="word"
              animation="blurInUp"
              once
              data-hero="title"
              data-slot="text-animate"
              aria-label={title}
              delay={0.09}
              duration={0.6}
              className="kmt-text-animate order-2 mt-6 max-w-xl text-[2.75rem] font-semibold leading-[1.08] text-[var(--kmt-public-text)] drop-shadow-[var(--kmt-public-text-shadow)] md:text-6xl xl:text-7xl"
            >
              {title}
            </TextAnimate>
            <KmtGoldUnderline variant="medium" animateOnView={false} delay={170} duration={600} className="order-3 mt-6" />
            <p data-hero="description" className="kmt-hero-enter order-4 mt-6 max-w-xl text-base leading-9 text-[var(--kmt-public-muted)] md:text-lg" style={{ animationDelay: "230ms" }}>
              {descriptionHighlight ? (
                <KmtUnderlinedText text={description} highlight={descriptionHighlight} emphasis={descriptionEmphasis} />
              ) : (
                description
              )}
            </p>
            {stats && stats.length > 0 ? (
              <dl data-hero="stats" className="kmt-hero-enter order-6 mt-8 grid max-w-xl grid-cols-3 gap-6 border-t border-[var(--kmt-public-line)] pt-6 lg:order-5" style={{ animationDelay: "310ms" }}>
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dd dir="ltr" className="text-3xl font-semibold tabular-nums text-[var(--kmt-public-gold)]">
                      <CountingNumber initiallyStable number={stat.value} />
                      {stat.suffix}
                    </dd>
                    <dt className="mt-1.5 text-xs leading-5 text-[var(--kmt-public-muted)]">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            ) : null}

            <div data-hero="picker" className="kmt-hero-enter-blur order-5 mt-8 rounded-2xl border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-5 md:p-6 lg:order-6" style={{ animationDelay: "390ms" }}>
              <p id="hero-matter-label" className="text-sm font-semibold text-[var(--kmt-public-text)]">
                {pickerLabel}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="hero-matter-label" onKeyDown={onPickerKeyDown}>
                {matters.map((matter) => {
                  const active = matter.slug === selectedSlug;
                  return (
                    <button
                      key={matter.slug}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-picker-option={matter.slug}
                      onClick={() => setSelectedSlug(active ? null : matter.slug)}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all duration-kmt-fast ease-kmt-out",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                        active
                          ? "border-kmt-gold/70 bg-kmt-gold/15 text-[var(--kmt-public-text)] shadow-[0_0_0_1px_rgb(208_160_72/0.35)]"
                          : "border-[var(--kmt-public-line)] bg-transparent text-[var(--kmt-public-muted)] hover:-translate-y-0.5 hover:border-kmt-gold/50 hover:text-[var(--kmt-public-text)] motion-reduce:transform-none"
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

          <div className="kmt-hero-enter-blur relative" style={{ animationDelay: "300ms" }}>
            <div className="relative overflow-hidden rounded-2xl border border-kmt-gold/20">
              <div className="absolute -inset-y-[10%] inset-x-0" aria-hidden="true" data-drift="photo">
                <Image
                  alt=""
                  aria-hidden="true"
                  className={cn("h-[115%] w-full object-cover opacity-70", imagePosition)}
                  data-testid="public-page-hero-image"
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  src={image}
                  onLoad={() => ScrollTrigger.refresh()}
                />
              </div>
              <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[4/5] lg:min-h-[560px]" aria-hidden="true" />
              <div className="absolute inset-0 bg-[rgb(var(--kmt-public-scrim)/0.45)]" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--kmt-public-canvas)] via-transparent to-[rgb(var(--kmt-public-scrim)/0.35)]" aria-hidden="true" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)]/70 to-transparent" aria-hidden="true" />
            </div>

            <div data-hero="docket" className="relative z-10 mx-4 -mt-24 overflow-hidden rounded-2xl bg-[var(--kmt-public-surface-muted)] p-6 sm:mx-8 md:p-7" aria-live="polite">
              <BorderBeam size={90} duration={7} colorFrom="#eac987" colorTo="#a87830" borderWidth={1} />
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

              <div className="mt-5">
                <p className={cn("text-xs font-semibold text-[var(--kmt-public-gold)]", locale === "en" && "uppercase tracking-[0.2em]")}>{docket.matter}</p>
                <p className="mt-2 min-h-8 text-xl font-semibold leading-8 text-[var(--kmt-public-text)]">
                  {selected ? selected.title : "—"}
                </p>
                <p className="mt-2 min-h-14 text-sm leading-7 text-[var(--kmt-public-muted)]">
                  {selected ? selected.summary : docket.empty}
                </p>
              </div>

              <div className="my-5 border-t border-dashed border-[var(--kmt-public-line)]" aria-hidden="true" />

              <div>
                <p className={cn("text-xs font-semibold text-[var(--kmt-public-gold)]", locale === "en" && "uppercase tracking-[0.2em]")}>{docket.next}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--kmt-public-muted)]">{nextStep}</p>
              </div>

              <ShimmerCtaLink
                href={bookingHref}
                shimmerDuration="3.2s"
                borderRadius="8px"
                className="mt-6 min-h-12 w-full px-5 text-base font-semibold text-primary-foreground"
              >
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  {bookLabel}
                  <MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />
                </span>
              </ShimmerCtaLink>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--kmt-public-surface)]" aria-hidden="true" />
        <span className="sr-only">{locale === "ar" ? "مقدمة الموقع" : "Site introduction"}</span>
      </section>
    </MotionConfig>
  );
}
