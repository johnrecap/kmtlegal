"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RevealVariant = "rise" | "fade" | "blur" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /**
   * One motion language, varied intensity (never the same preset twice in a
   * row): rise = translate + fade (default), fade = opacity only, blur =
   * blur + rise for feature moments, none = static anchor, no observer.
   */
  variant?: RevealVariant;
}

const hiddenClasses: Record<Exclude<RevealVariant, "none">, string> = {
  rise: "translate-y-6 opacity-0",
  fade: "opacity-0",
  blur: "translate-y-4 opacity-0 blur-sm"
};

/**
 * SSR-safe scroll reveal.
 *
 * Content renders fully visible server-side (no `opacity-0` in HTML), so
 * no-JS users and crawlers always see it. On mount — when motion is allowed —
 * the element gets the transition classes and is animated into place;
 * elements already in the viewport reveal immediately.
 * `prefers-reduced-motion` keeps everything static and visible.
 */
export function Reveal({ children, className, delay = 0, variant = "rise" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (variant === "none") return;
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setEnabled(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [variant]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: enabled && !shown ? `${delay}ms` : undefined }}
      className={cn(
        enabled && !shown && cn(hiddenClasses[variant as Exclude<RevealVariant, "none">], "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"),
        enabled && shown && "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        className
      )}
    >
      {children}
    </div>
  );
}
