"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

import { useState } from "react";

/**
 * KMT-adapted Aceternity Card Hover Effect.
 *
 * A restrained moving deep-black/gold background follows the hovered matter;
 * all matters stay discoverable at once (no carousel). Upstream slate/neutral
 * fills become KMT surfaces with a low-alpha gold border accent. Items accept
 * an optional numeral + footnote so representative matters keep their
 * evidence framing (region/year, anonymization disclaimer) without
 * exaggeration. No scale jump, tilt, or dramatic glow.
 */
export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
    link: string;
    /** Visible matter numeral, e.g. "01". */
    numeral?: string;
    /** Small legal/anonymization footnote kept inside the card. */
    footnote?: string;
  }[];
  className?: string;
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, idx) => (
        <Link
          href={item?.link}
          key={item?.link}
          className="group relative block h-full w-full p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kmt-gold"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          onFocus={() => setHoveredIndex(idx)}
          onBlur={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 block h-full w-full rounded-lg border border-kmt-gold/30 bg-[var(--kmt-public-hover)] motion-reduce:hidden dark:bg-kmt-gold/10"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card>
            {item.numeral ? (
              <span aria-hidden="true" className="text-3xl font-semibold tabular-nums text-[var(--kmt-public-gold)]/50 transition-colors duration-150 group-hover:text-[var(--kmt-public-gold)]">
                {item.numeral}
              </span>
            ) : null}
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
            {item.footnote ? (
              <p className="mt-4 border-t border-[var(--kmt-public-line)] pt-3 text-xs leading-6 text-[var(--kmt-public-muted)]">
                {item.footnote}
              </p>
            ) : null}
          </Card>
        </Link>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full overflow-hidden rounded-lg border border-kmt-gold/25 bg-[var(--kmt-public-panel)] p-4 group-hover:border-kmt-gold/50 dark:bg-[var(--kmt-black-1)]",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};
export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("mt-4 font-bold tracking-wide text-[var(--kmt-public-text)]", className)}>
      {children}
    </h4>
  );
};
export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "mt-4 text-sm leading-relaxed tracking-wide text-[var(--kmt-public-muted)]",
        className
      )}
    >
      {children}
    </p>
  );
};
