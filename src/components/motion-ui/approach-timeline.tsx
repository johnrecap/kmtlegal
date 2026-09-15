"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaterialSymbol } from "@/components/ui";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface ApproachStep {
  number: string;
  title: string;
  summary: string;
  icon: string;
}

export function ApproachTimeline({ steps }: { steps: ReadonlyArray<ApproachStep> }) {
  const rootRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-timeline='progress']",
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top 72%", end: "bottom 55%", scrub: 0.6 },
          }
        );

        gsap.utils.toArray<HTMLElement>("[data-timeline='step']").forEach((step) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top 70%",
            end: "bottom 35%",
            toggleClass: { targets: step, className: "tl-active" },
          });
        });

        gsap.from("[data-timeline='card']", {
          y: 36,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root, start: "top 78%", toggleActions: "play none none reverse" },
        });
      });
    },
    { scope: rootRef }
  );

  return (
    <ol ref={rootRef} className="relative mx-auto max-w-3xl">
      <span aria-hidden="true" className="absolute inset-y-2 start-[27px] w-px bg-white/10" />
      <span
        aria-hidden="true"
        data-timeline="progress"
        className="absolute inset-y-2 start-[27px] w-px origin-top bg-gradient-to-b from-[var(--kmt-public-gold)] via-[var(--kmt-public-gold)] to-transparent"
      />
      <div className="space-y-6">
        {steps.map((step) => (
          <li key={step.number} data-timeline="step" className="relative ps-16">
            <span
              aria-hidden="true"
              className="absolute start-[13px] top-7 flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#0c1116] transition-all duration-500 [.tl-active_&]:border-kmt-gold [.tl-active_&]:bg-kmt-gold [.tl-active_&]:shadow-[0_0_24px_rgb(199_154_82/0.55)]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--kmt-public-muted)] transition-colors duration-500 [.tl-active_&]:bg-[#120d07]" />
            </span>
            <div
              data-timeline="card"
              className="rounded-xl border border-white/10 bg-white/[0.025] p-5 transition-all duration-500 [.tl-active_&]:border-kmt-gold/60 [.tl-active_&]:bg-kmt-gold/[0.06] [.tl-active_&]:shadow-[0_24px_70px_-30px_rgb(153_123_68/0.6)] md:p-6"
            >
              <div className="flex items-center gap-3">
                <MaterialSymbol className="text-3xl text-[var(--kmt-public-gold)]" name={step.icon} />
                <p className="text-xs font-semibold tracking-[0.2em] text-[var(--kmt-public-muted)]">{step.number}</p>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--kmt-public-text)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--kmt-public-muted)]">{step.summary}</p>
            </div>
          </li>
        ))}
      </div>
    </ol>
  );
}
