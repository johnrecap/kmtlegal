"use client";

import { useEffect, useRef, useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

/**
 * Client boundary that arms one support-panel gold border glow.
 *
 * Same contract as the capability grid gate: the glow attaches window
 * scroll + body pointermove listeners, so it stays disarmed (the identical
 * static panel) until its own card is near the viewport on a fine-pointer
 * device with motion allowed. Touch, reduced-motion, and offscreen panels
 * never pay for global tracking. SSR and first hydrate render disarmed, so
 * there is no hydration mismatch.
 */
export function SupportGlowGate({ spread = 14 }: { spread?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => setArmed(entry.isIntersecting),
      { rootMargin: "25% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // NOTE: the wrapper must keep a real box (absolute inset-0 over the
  // card) — display:contents yields an empty rect and an
  // IntersectionObserver target without a box never intersects.
  return (
    <span ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <GlowingEffect spread={spread} borderWidth={1} variant="kmt-gold" disabled={!armed} glow={false} />
    </span>
  );
}
