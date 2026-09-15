"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-US");

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
};

export function CountUp({ value, duration = 1.4, className, format }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatValue = format ?? defaultFormat;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = formatValue(value);
      return;
    }

    let tween: gsap.core.Tween | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          const state = { current: 0 };
          tween = gsap.to(state, {
            current: value,
            duration,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = formatValue(state.current);
            }
          });
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      tween?.kill();
    };
  }, [value, duration, formatValue]);

  return (
    <span ref={ref} className={className}>
      {formatValue(value)}
    </span>
  );
}
