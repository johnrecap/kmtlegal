"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/cn";

export type ThemeToggleProps = {
  label: string;
  className?: string;
};

/**
 * Shared theme toggle (Phase 02): internals replaced with the official
 * Magic UI Animated Theme Toggler
 * (https://magicui.design/docs/components/animated-theme-toggler), wired
 * controlled to the existing next-themes setup (`resolvedTheme` + `setTheme`)
 * per the official Next.js integration. next-themes keeps owning persistence
 * (`kmt-theme` / `kmt-theme-admin` storage keys), SSR/hydration, and first
 * paint. `prefers-reduced-motion` collapses the reveal to an instant switch
 * (`duration={0}`). Public/Client/Admin shells keep rendering this same
 * shared component — no shell theme surface is redesigned here.
 */
export function ThemeToggle({ label, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Pre-mount placeholder with the exact button footprint: next-themes has
  // not resolved the theme on the server, so rendering the icon now would
  // hydrate-mismatch (Moon vs Sun). Matches the previous toggle behavior.
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={cn("invisible inline-flex h-11 w-11 shrink-0 items-center justify-center", className)}
      />
    );
  }

  return (
    <AnimatedThemeToggler
      aria-label={label}
      title={label}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      duration={reducedMotion ? 0 : 400}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none [&_svg]:size-5",
        className
      )}
    />
  );
}
