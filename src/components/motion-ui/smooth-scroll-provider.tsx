"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Phase 02 motion-ownership scope: Lenis (wheel smoothing + anchor-click
 * smoothing, GSAP-ticker-driven with ScrollTrigger sync) runs ONLY on public
 * routes with genuine smooth-scroll/anchor UX — home (GSAP ScrollTrigger
 * parallax) and Privacy/Terms (plain-anchor PolicyToc). Every other public
 * route (booking chat with native element auto-scroll, forms, directories,
 * detail pages) uses native scroll. `prefers-reduced-motion` disables Lenis
 * everywhere, as before.
 */
const LENIS_ROUTES = new Set(["/", "/privacy", "/terms"]);

function stripLocalePrefix(pathname: string): string {
  if (pathname === "/ar") return "/";
  return pathname.replace(/^\/ar(?=\/)/, "") || "/";
}

export function SmoothScrollProvider() {
  const pathname = usePathname();
  const enabled = LENIS_ROUTES.has(stripLocalePrefix(pathname ?? "/"));

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ anchors: true });
    const updateScrollTrigger = () => ScrollTrigger.update();
    lenis.on("scroll", updateScrollTrigger);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [enabled]);

  return null;
}
