"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed gold hairline that fills as the page is read.
 *
 * Renders as a zero-width (scaleX(0)) bar server-side; on mount it tracks
 * window scroll (rAF-throttled) and scales toward full width. The transform
 * transition uses the shared motion tokens so the fill eases behind the
 * scroll position. Hidden entirely under `prefers-reduced-motion`.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 motion-reduce:hidden" data-testid="reading-progress">
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-[var(--kmt-public-gold)] transition-transform duration-kmt-normal ease-kmt-out rtl:origin-right"
      />
    </div>
  );
}
