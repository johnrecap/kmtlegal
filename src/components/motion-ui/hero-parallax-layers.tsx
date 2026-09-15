"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface HeroParallaxInsight {
  icon: string;
  label: string;
}

interface HeroParallaxLayersProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imagePosition?: string;
  actions?: ReactNode;
  insights: ReadonlyArray<HeroParallaxInsight>;
  locale?: "en" | "ar";
}

const LAYER_TRAVEL_PX = 220;

// NOTE: surfaces and text resolve to --kmt-public-* theme vars so a future
// day/night [data-theme] override flips this hero without touching this file.
export function HeroParallaxLayers({
  eyebrow,
  title,
  description,
  image,
  imagePosition = "object-center",
  actions,
  insights,
  locale = "en",
}: HeroParallaxLayersProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero='eyebrow']", { y: 22, autoAlpha: 0, duration: 0.7 })
          .from("[data-hero='title']", { y: 34, autoAlpha: 0, duration: 0.85 }, "-=0.5")
          .from("[data-hero='rule']", { scaleX: 0, autoAlpha: 0, duration: 0.6 }, "-=0.55")
          .from("[data-hero='description']", { y: 26, autoAlpha: 0, duration: 0.75 }, "-=0.5")
          .from("[data-hero='actions']", { y: 22, autoAlpha: 0, duration: 0.65 }, "-=0.55")
          .from("[data-hero='window']", { y: 56, autoAlpha: 0, duration: 0.95 }, "-=0.5")
          .from("[data-hero='card']", { y: 36, autoAlpha: 0, duration: 0.7, stagger: 0.14 }, "-=0.6");

        const drift = (target: string, distance: number) => {
          gsap.to(target, {
            y: () => distance,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
        };

        drift("[data-drift='headline']", -LAYER_TRAVEL_PX);
        drift("[data-drift='window']", -LAYER_TRAVEL_PX * 0.35);
        drift("[data-drift='cards']", -LAYER_TRAVEL_PX * 0.55);

        gsap.to("[data-hero='window-scale']", {
          scale: 1.05,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} className="relative isolate overflow-hidden bg-[var(--kmt-public-surface)] text-[var(--kmt-public-text)]" data-testid="public-hero-parallax">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgb(199_154_82/0.16),transparent_65%)]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 pt-20 text-center sm:px-6 md:pt-28 lg:px-10">
        <div data-drift="headline">
          <div data-hero="eyebrow">
            <p className="inline-flex items-center gap-2 rounded-full border border-kmt-gold/35 bg-kmt-gold/10 px-4 py-1.5 text-sm font-semibold text-[var(--kmt-public-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--kmt-public-gold)]" aria-hidden="true" />
              {eyebrow}
            </p>
          </div>
          <h1 data-hero="title" className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight drop-shadow-[0_4px_22px_rgba(0,0,0,0.88)] md:text-6xl">
            {title}
          </h1>
          <span data-hero="rule" className="mx-auto mt-6 block h-px w-24 origin-center bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)] to-transparent" aria-hidden="true" />
          <p data-hero="description" className="mx-auto mt-6 max-w-2xl text-base leading-9 text-[var(--kmt-public-muted)] md:text-lg">
            {description}
          </p>
          {actions ? (
            <div data-hero="actions" className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>

        <div data-drift="window" className="relative mx-auto mt-14 max-w-5xl md:mt-20">
          <div data-hero="window">
            <div data-hero="window-scale" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_40px_120px_-40px_rgb(153_123_68/0.45)]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-kmt-gold/60" />
                <span className="ms-3 hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[var(--kmt-public-muted)] opacity-70 sm:block">
                  kmtlegal.org
                </span>
              </div>
              <div className="relative h-[300px] w-full md:h-[440px]">
                <Image
                  alt=""
                  aria-hidden="true"
                  className={cn("object-cover opacity-95", imagePosition)}
                  data-testid="public-page-hero-image"
                  fill
                  priority
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  src={image}
                  onLoad={() => ScrollTrigger.refresh()}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#07090b]/30 via-transparent to-[#07090b]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div data-drift="cards" className="relative mx-auto mt-8 max-w-5xl pb-16 md:mt-10 md:pb-24">
          <div className="grid gap-4 text-start sm:grid-cols-3">
            {insights.map((insight, index) => (
              <div
                key={insight.label}
                data-hero="card"
                className="group rounded-xl border border-white/10 bg-[var(--kmt-public-surface-muted)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-[var(--kmt-public-gold)] transition-transform duration-300 ease-out group-hover:scale-110">
                    <MaterialSymbol className="text-xl" name={insight.icon} />
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-[var(--kmt-public-muted)] opacity-60" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium leading-7 text-[var(--kmt-public-text)]">{insight.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#07090b]" aria-hidden="true" />
      <span className="sr-only">{locale === "ar" ? "مقدمة الموقع" : "Site introduction"}</span>
    </section>
  );
}
