"use client";
import React, { Fragment, useRef } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * KMT-adapted Aceternity Sticky Scroll Reveal.
 *
 * Upstream renders a fixed-height nested scroll container with rainbow panel
 * gradients. For KMT it is reworked to page-scroll storytelling on deep
 * black: the section scrolls with the page (no nested scroll trap, Lenis
 * compatible), text stages dim/brighten as they pass, and the sticky visual
 * panel carries KMT imagery with a gold hairline. Mobile stacks all stages
 * fully readable (no hover dependency); reduced motion keeps every stage
 * visible (opacity floor, no layout change).
 */
export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = React.useState(0);
  const ref = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce(
      (acc, breakpoint, index) => {
        const distance = Math.abs(latest - breakpoint);
        if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
          return index;
        }
        return acc;
      },
      0,
    );
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <div
      className="relative grid gap-10 lg:grid-cols-[1fr_minmax(0,380px)] lg:gap-14"
      ref={ref}
    >
      <div className="relative flex min-w-0 items-start">
        <div className="max-w-2xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="py-10 first:pt-0 last:pb-0 lg:py-16">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-sm font-semibold tabular-nums tracking-widest transition-colors duration-300",
                    activeCard === index ? "text-[var(--kmt-public-gold)]" : "text-[var(--kmt-public-muted)]"
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px w-10 transition-colors duration-300",
                    activeCard === index ? "bg-[var(--kmt-public-gold)]" : "bg-[var(--kmt-public-line)]"
                  )}
                />
              </div>
              <motion.h3
                initial={{
                  opacity: 0.45,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.45,
                }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-2xl font-semibold text-[var(--kmt-public-text)] lg:text-3xl"
              >
                {item.title}
              </motion.h3>
              <motion.div
                initial={{
                  opacity: 0.45,
                }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.45,
                }}
                transition={{ duration: 0.3 }}
                className="mt-4 max-w-xl text-base leading-8 text-[var(--kmt-public-muted)]"
              >
                {item.description}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:block">
        <div
          className={cn(
            "sticky top-28 overflow-hidden rounded-lg border border-kmt-gold/25 bg-[var(--kmt-public-panel)]",
            contentClassName,
          )}
        >
          {/* Both panel children are keyed at this ownership level. The
              visual node is created by the caller (e.g. HomePageView) and
              crosses the RSC flight boundary, where it can materialize as a
              lazy chunk reference; rendering it unkeyed next to a static
              sibling forms a dynamic children array and React (19 key
              validation) warns "passed a child from <caller>". The Fragment
              key uses the stable item title (not the index, never random) so
              switching cards keeps deterministic identity without remount
              churn from unstable ids. */}
          <div key="kmt-sticky-scroll-hairline" className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)]/70 to-transparent" aria-hidden="true" />
          {content[activeCard] ? (
            <Fragment key={content[activeCard].title}>
              {content[activeCard].content ?? null}
            </Fragment>
          ) : null}
        </div>
      </div>
    </div>
  );
};
