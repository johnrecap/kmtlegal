"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Sticky in-page table of contents for policy pages (privacy, terms).
 *
 * Renders fully as plain anchor links server-side, so navigation works
 * without JavaScript. When mounted, an IntersectionObserver watches a thin
 * detector band sitting just below the anchor landing position
 * (`scroll-mt-28` = 112px): whichever section's box covers the band is the
 * one at the reading position, and its entry gets a gold start-edge
 * indicator plus `aria-current="location"`. Scrolling to the very bottom
 * of the page falls back to the last entry when no section covers the
 * band. The indicator rides the token motion timings and switches
 * instantly under `prefers-reduced-motion`. Start-edge positioning is
 * logical, so the indicator flips to the right edge in RTL automatically.
 */
export function PolicyToc({
  label,
  items,
  hideHeading = false
}: {
  label: string;
  items: ReadonlyArray<{ id: string; title: string }>;
  /** Inside a mobile Accordion the trigger already names the group. */
  hideHeading?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);
    if (sections.length === 0) return;

    const BAND_TOP = 118;
    const BAND_HEIGHT = 4;
    const visible = new Set<string>();

    const syncActive = () => {
      let candidate: string | null = null;
      for (const item of items) {
        if (visible.has(item.id)) candidate = item.id;
      }
      if (candidate === null && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        candidate = items[items.length - 1]?.id ?? null;
      }
      if (candidate !== null) setActiveId(candidate);
    };

    const createObserver = () =>
      new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          syncActive();
        },
        { rootMargin: `-${BAND_TOP}px 0px -${Math.max(window.innerHeight - BAND_TOP - BAND_HEIGHT, 0)}px 0px` }
      );

    let observer: IntersectionObserver;
    try {
      observer = createObserver();
    } catch {
      return;
    }

    const observeAll = () => {
      for (const section of sections) observer.observe(section);
    };
    observeAll();

    const onResize = () => {
      observer.disconnect();
      observer = createObserver();
      observeAll();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav aria-label={label}>
      {hideHeading ? null : (
        <h2 className="text-lg font-semibold text-[var(--kmt-public-text)]">{label}</h2>
      )}
      <ol className="mt-4 space-y-1.5 text-sm">
        {items.map((item) => {
          const active = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                aria-current={active ? "location" : undefined}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-md px-3 py-1.5 transition-colors duration-kmt-normal ease-kmt-out motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                  active
                    ? "bg-[var(--kmt-public-hover)] font-medium text-[var(--kmt-public-text)]"
                    : "text-[var(--kmt-public-muted)] hover:bg-[var(--kmt-public-hover)] hover:text-[var(--kmt-public-text)]"
                )}
                href={`#${item.id}`}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-1.5 start-1.5 w-0.5 rounded-full bg-[var(--kmt-public-gold)] transition-transform duration-kmt-normal ease-kmt-out motion-reduce:transition-none",
                    active ? "scale-y-100" : "scale-y-0"
                  )}
                />
                <span className="min-w-0 break-words">{item.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
