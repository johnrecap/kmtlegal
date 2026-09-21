"use client";

import { MaterialSymbol } from "@/components/ui";
import { Timeline } from "@/components/ui/timeline";
import { cn } from "@/lib/cn";
import { publicGoldText, publicMutedText } from "@/features/public-site/public-components";
import { publicMotionIcon, publicMotionIconHalo } from "@/features/public-site/public-motion";

export type ProcessStep = {
  number: string;
  title: string;
  summary: string;
  icon: string;
};

/**
 * "How the request is handled" as the Aceternity Timeline (KMT-adapted):
 * the four real intake steps drive a scroll-linked gold progress rail.
 * Step containers stay minimal (small gold icon + summary) — no giant
 * cards. Mobile renders a clear vertical sequence; reduced motion shows the
 * static rail with all steps visible.
 */
export function ProcessSteps({ steps }: { steps: ReadonlyArray<ProcessStep> }) {
  return (
    <Timeline
      data={steps.map((step) => ({
        title: `${step.number} — ${step.title}`,
        content: (
          <div className="flex max-w-2xl gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-kmt-gold/30 bg-kmt-gold/10 text-[var(--kmt-public-gold)]" aria-hidden="true">
              <MaterialSymbol className={cn("text-xl", publicMotionIcon, publicMotionIconHalo)} name={step.icon} />
            </span>
            <div className="min-w-0">
              <p className={cn("text-xs font-semibold tabular-nums tracking-widest", publicGoldText)}>{step.number}</p>
              <p className={cn("mt-2 text-sm leading-7 md:text-base md:leading-8", publicMutedText)}>{step.summary}</p>
            </div>
          </div>
        )
      }))}
    />
  );
}
