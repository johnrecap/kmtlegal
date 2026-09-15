"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";
import { publicMotionCardBeam, publicMotionIcon, publicMotionIconHalo } from "@/features/public-site/public-motion";
import { publicGoldText, publicMutedText } from "@/features/public-site/public-components";
import { Reveal } from "@/components/motion-ui/reveal";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type ProcessStep = {
  number: string;
  title: string;
  summary: string;
  icon: string;
};

/**
 * Process section with scroll-linked progress. The gold hairline fills as the
 * section scrolls through the viewport (desktop only, motion-allowed only);
 * steps reveal with a stagger on all breakpoints. Reduced motion / no-JS:
 * static, fully visible grid with the plain hairline.
 */
export function ProcessSteps({ steps }: { steps: ReadonlyArray<ProcessStep> }) {
  const rootRef = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        gsap.fromTo(
          "[data-process='progress']",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top 70%",
              end: "bottom 45%",
              scrub: 0.6
            }
          }
        );
        gsap.fromTo(
          "[data-process='step']",
          { opacity: 0.35 },
          {
            opacity: 1,
            stagger: 0.25,
            ease: "power2.out",
            scrollTrigger: {
              trigger: root,
              start: "top 65%",
              end: "bottom 50%",
              scrub: 0.6
            }
          }
        );
      });
    },
    { scope: rootRef }
  );

  return (
    <ol ref={rootRef} className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <span aria-hidden="true" className="absolute inset-x-10 top-9 hidden h-px bg-[var(--kmt-public-line)] lg:block" />
      <span
        aria-hidden="true"
        data-process="progress"
        className="absolute inset-x-10 top-9 hidden h-px origin-left bg-gradient-to-r from-[var(--kmt-public-gold)] via-[var(--kmt-public-gold)] to-transparent ltr:origin-left rtl:origin-right rtl:bg-gradient-to-l lg:block"
      />
      {steps.map((step, index) => (
        <li key={step.number} className="relative" data-process="step">
          <Reveal delay={index * 100} className="h-full">
            <div className={cn(publicMotionCardBeam, "group relative h-full overflow-hidden rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-5")}>
              <div className="flex items-center justify-between gap-4">
                <MaterialSymbol className={cn("text-3xl", publicGoldText, publicMotionIcon, publicMotionIconHalo)} name={step.icon} />
                <span className={cn("text-sm font-semibold", publicGoldText)}>{step.number}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--kmt-public-text)]">{step.title}</h3>
              <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{step.summary}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
