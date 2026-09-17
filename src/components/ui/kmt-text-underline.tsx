"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Highlighter } from "@/components/ui/highlighter";

/**
 * KMT logo gold (primary) — source of truth `src/app/globals.css`
 * (`--kmt-gold-primary`, bucket analysis of the logo assets).
 * A concrete hex is required because rough-notation draws the stroke on SVG,
 * where `var(--kmt-public-gold)` would not resolve. #a87830 stays restrained
 * and editorial on both the deep-black dark canvas and the warm light paper
 * (unlike a bright/neon yellow), keeping the whole underline family in one
 * gold family across themes.
 */
export const KMT_TEXT_UNDERLINE_GOLD = "#a87830";

export type KmtTextUnderlineEmphasis = "subtle" | "normal" | "strong";

/** Stroke widths per emphasis — thin editorial annotation, never marker-like. */
const EMPHASIS_STROKE_WIDTH: Record<KmtTextUnderlineEmphasis, number> = {
  subtle: 1,
  normal: 1.5,
  strong: 2,
};

export interface KmtTextUnderlineProps {
  /** The meaningful phrase to underline (inline text only). */
  children: ReactNode;
  /** Underline color. Defaults to the exact KMT logo gold token. */
  color?: string;
  /** Explicit stroke width (overrides `emphasis`). */
  strokeWidth?: number;
  /** Hand-drawn stroke duration in ms (overrides the emphasis default). */
  duration?: number;
  /** Support multi-line wrapped phrases. Defaults to true (incl. Arabic). */
  multiline?: boolean;
  /** Editorial weight. Defaults to "normal". */
  emphasis?: KmtTextUnderlineEmphasis;
  /**
   * True (default): animate when scrolled into view via the Highlighter's own
   * in-view mechanism. False: show immediately on mount (above-the-fold).
   * `prefers-reduced-motion` always renders the final underline immediately.
   */
  animateOnView?: boolean;
  className?: string;
}

/**
 * Thin KMT wrapper around the REAL Magic UI Highlighter
 * (`src/components/ui/highlighter.tsx`, `action="underline"`).
 * The hand-drawn effect itself is never reimplemented here — this only fixes
 * KMT styling (gold family, editorial weights) plus the reduced-motion
 * contract. One shared IntersectionObserver-based in-view trigger per
 * instance comes from the Highlighter itself; no extra scroll listeners.
 */
export function KmtTextUnderline({
  children,
  color = KMT_TEXT_UNDERLINE_GOLD,
  strokeWidth,
  duration,
  multiline = true,
  emphasis = "normal",
  animateOnView = true,
  className,
}: KmtTextUnderlineProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedStrokeWidth = strokeWidth ?? EMPHASIS_STROKE_WIDTH[emphasis];
  // Reduced motion: draw the final underline immediately (kept, not removed).
  const resolvedDuration = reducedMotion ? 0 : (duration ?? (emphasis === "strong" ? 900 : 650));

  return (
    <span data-kmt-text-underline={emphasis} className={className}>
      <Highlighter
        action="underline"
        color={color}
        strokeWidth={resolvedStrokeWidth}
        animationDuration={resolvedDuration}
        multiline={multiline}
        isView={!reducedMotion && animateOnView}
      >
        {children}
      </Highlighter>
    </span>
  );
}

export interface KmtUnderlinedTextProps extends Omit<KmtTextUnderlineProps, "children"> {
  /** Full sentence in the current locale. */
  text: string;
  /** The single meaningful phrase inside `text` to underline. */
  highlight: string;
}

/**
 * Render `text` with the single `highlight` phrase wrapped in
 * `KmtTextUnderline`. When the phrase is absent (locale drift), the plain
 * sentence renders unchanged — copy is never broken by emphasis.
 */
export function KmtUnderlinedText({ text, highlight, ...underlineProps }: KmtUnderlinedTextProps) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const [before, after] = text.split(highlight);
  return (
    <>
      {before}
      <KmtTextUnderline {...underlineProps}>{highlight}</KmtTextUnderline>
      {after}
    </>
  );
}
