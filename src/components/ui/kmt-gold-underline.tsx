"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type KmtGoldUnderlineVariant = "short" | "medium" | "text" | "section";

/** Fixed rule widths per variant (override with the `width` prop in px). */
const RULE_WIDTH_CLASS: Record<Exclude<KmtGoldUnderlineVariant, "text">, string> = {
  short: "w-12", // 48px — CTA + compact accents
  section: "w-16", // 64px — section heading accents
  medium: "w-28", // 112px — medium editorial rules (hero)
};

export interface KmtGoldUnderlineProps {
  variant?: KmtGoldUnderlineVariant;
  /** Rule alignment. Ignored for the inline `text` variant. */
  align?: "start" | "center";
  /** Explicit rule width in px (overrides the variant width). */
  width?: number;
  /** Animation delay in ms. */
  delay?: number;
  /** Animation duration in ms. */
  duration?: number;
  /**
   * True (default): grow when scrolled into view (IntersectionObserver).
   * False: grow once on mount (for above-the-fold moments like the hero,
   * where an observer would only add a first-paint flash).
   */
  animateOnView?: boolean;
  className?: string;
  /** The underlined phrase — only for variant="text". */
  children?: ReactNode;
}

/**
 * KMT animated gold-underline design primitive.
 *
 * One visual grammar for every gold line on the public site: the line grows
 * 0 → target width via `transform: scaleX` (never width — no layout shift)
 * in the exact `--kmt-public-gold` token, growing inline-start → inline-end
 * (left→right LTR, right→left RTL). SSR and no-JS render the final visible
 * line; JS only hides-then-grows when motion is allowed. Reduced motion
 * keeps the line statically visible.
 */
export function KmtGoldUnderline({
  variant = "short",
  align = "start",
  width,
  delay = 0,
  duration = 500,
  animateOnView = true,
  className,
  children,
}: KmtGoldUnderlineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!animateOnView) return;
    setEnabled(true);
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animateOnView]);

  if (variant === "text") {
    return (
      <span className="inline-block">
        {children}
        <span
          ref={ref}
          aria-hidden="true"
          data-kmt-underline="text"
          className={cn("kmt-gold-underline block h-[2px] rounded-full bg-[var(--kmt-public-gold)]", !animateOnView && "kmt-gold-underline-mount", className)}
          style={underlineStyle({ enabled, shown, animateOnView, delay, duration })}
        />
      </span>
    );
  }

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-kmt-underline={variant}
      className={cn(
        "kmt-gold-underline block h-px",
        RULE_WIDTH_CLASS[variant],
        align === "center"
          ? "mx-auto bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)] to-transparent"
          : "me-auto bg-gradient-to-r from-[var(--kmt-public-gold)] to-transparent rtl:bg-gradient-to-l",
        !animateOnView && "kmt-gold-underline-mount",
        className
      )}
      style={underlineStyle({ enabled, shown, animateOnView, delay, duration, width })}
    />
  );
}

function underlineStyle({
  enabled,
  shown,
  animateOnView,
  delay,
  duration,
  width,
}: {
  enabled: boolean;
  shown: boolean;
  animateOnView: boolean;
  delay: number;
  duration: number;
  width?: number;
}): CSSProperties {
  // Mount mode is driven by the `kmt-gold-underline-mount` CSS animation
  // (`both` fill starts at scaleX(0) — no first-paint flash).
  if (!animateOnView) {
    return {
      ...(width !== undefined ? { width: `${width}px` } : null),
      ["--kmt-gold-underline-duration" as string]: `${duration}ms`,
      animationDelay: `${delay}ms`,
    };
  }
  // In-view mode: SSR/no-JS/reduced-motion render the final line; JS hides
  // it only while waiting for the intersection to fire.
  return {
    ...(width !== undefined ? { width: `${width}px` } : null),
    ...(enabled && !shown
      ? {
          transform: "scaleX(0)",
          transition: `transform ${duration}ms var(--kmt-motion-ease) ${delay}ms`,
        }
      : enabled
        ? { transform: "scaleX(1)", transition: `transform ${duration}ms var(--kmt-motion-ease) ${delay}ms` }
        : null),
  };
}
