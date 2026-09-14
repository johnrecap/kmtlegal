"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ParallaxLayer, ParallaxScene } from "@/components/motion-ui/parallax-layers";

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

const INSIGHT_SPEEDS = [1.15, 0.9, 1.05];

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const style = { animationDelay: `${delay}s` } as CSSProperties;

  return (
    <div className={cn("kmt-motion-reveal", className)} style={style}>
      {children}
    </div>
  );
}

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
  return (
    <ParallaxScene className="isolate overflow-hidden bg-[#07090b] text-white" data-testid="public-hero-parallax">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgb(199_154_82/0.16),transparent_65%)]" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_35%,black,transparent)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 pt-20 text-center sm:px-6 md:pt-28 lg:px-10">
        <ParallaxLayer speed={1}>
          <Reveal>
            <p className="inline-flex items-center rounded-full border border-kmt-gold/35 bg-kmt-gold/10 px-4 py-1.5 text-sm font-semibold text-amber-100">
              {eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold leading-tight drop-shadow-[0_4px_22px_rgba(0,0,0,0.88)] md:text-6xl">
              {title}
            </h1>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-9 text-slate-200 md:text-lg">{description}</p>
          </Reveal>
          {actions ? (
            <Reveal delay={0.36}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>
            </Reveal>
          ) : null}
        </ParallaxLayer>

        <ParallaxLayer speed={0.35} scaleDrift={0.05} className="relative mx-auto mt-12 max-w-5xl md:mt-16">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_40px_120px_-40px_rgb(153_123_68/0.45)] backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-kmt-gold/60" />
              <span className="ms-3 hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400 sm:block">
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
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#07090b]/30 via-transparent to-[#07090b]" aria-hidden="true" />
            </div>
          </div>
        </ParallaxLayer>

        <div className="relative mx-auto max-w-5xl pb-16 md:pb-24">
          <div className="relative -mt-10 grid gap-3 text-start sm:grid-cols-3">
            {insights.map((insight, index) => (
              <ParallaxLayer key={insight.label} speed={INSIGHT_SPEEDS[index % INSIGHT_SPEEDS.length]}>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0c1116]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-kmt-gold/25 bg-kmt-gold/10 text-kmt-gold">
                    <MaterialSymbol className="text-xl" name={insight.icon} />
                  </span>
                  <p className="text-sm font-medium leading-6 text-slate-200">{insight.label}</p>
                </div>
              </ParallaxLayer>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#07090b]" aria-hidden="true" />
      <span className="sr-only">{locale === "ar" ? "مقدمة الموقع" : "Site introduction"}</span>
    </ParallaxScene>
  );
}
