"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  spotlight?: boolean;
}

/**
 * SSR-safe scroll reveal.
 *
 * Content renders fully visible server-side (no `opacity-0` in HTML), so
 * no-JS users and crawlers always see it. On mount — when motion is allowed —
 * the element gets the transition classes and is animated into place from
 * just below; elements already in the viewport reveal immediately.
 * `prefers-reduced-motion` keeps everything static and visible.
 */
export function Reveal({ children, className, delay = 0, spotlight = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
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
  }, []);

  const onMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={spotlight ? onMove : undefined}
      style={{ transitionDelay: enabled && !shown ? `${delay}ms` : undefined }}
      className={cn(
        enabled && !shown && "translate-y-6 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
        enabled && shown && "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        spotlight && "group relative",
        className
      )}
    >
      {spotlight ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), rgb(199 154 82 / 0.14), transparent 70%)" }}
        />
      ) : null}
      {children}
    </div>
  );
}
