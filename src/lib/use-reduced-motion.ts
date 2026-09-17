"use client";

import { useEffect, useState } from "react";

/**
 * prefers-reduced-motion as React state, without motion's hook.
 *
 * `useReducedMotion` from motion/react is unreliable in this stack (it
 * reports false even when the OS setting requests reduced motion), so
 * JS-driven motion guards read matchMedia directly. SSR and the first
 * client render always report false (matching server HTML); the real
 * value applies in an effect, so callers must only change behavior
 * post-hydration (timers, transitions, canvas work) — never the initial
 * rendered structure.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
