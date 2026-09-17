"use client";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Magic UI Animated List (vendored).
 * A list that animates each item in sequence with a delay.
 *
 * KMT adaptation: under prefers-reduced-motion the full list appears
 * immediately with settled (non-animated) items. The guard reads
 * matchMedia directly (motion's own hook is unreliable in this stack);
 * the initial render is identical with or without the setting, so there
 * is no hydration mismatch — only post-hydration behavior changes.
 */
export function AnimatedListItem({ children, reduceMotion = false }: { children: React.ReactNode; reduceMotion?: boolean }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: reduceMotion
      ? { duration: 0 }
      : ({ type: "spring" as const, stiffness: 350, damping: 40 }),
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const reduceMotion = usePrefersReducedMotion();
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(() => React.Children.toArray(children), [children]);

    useEffect(() => {
      if (reduceMotion) {
        setIndex(childrenArray.length);
        return;
      }
      if (index < childrenArray.length - 1) {
        const timeout = setTimeout(() => {
          setIndex((prevIndex) => prevIndex + 1);
        }, delay);
        return () => clearTimeout(timeout);
      }
    }, [index, delay, childrenArray.length, reduceMotion]);

    // Reduced motion: same structure, full list, settled items.
    if (reduceMotion) {
      return (
        <div className={cn("flex w-full flex-col items-center gap-4", className)} {...props}>
          {childrenArray.map((item, itemIndex) => (
            <AnimatedListItem
              key={(item as React.ReactElement).key ?? `animated-list-item-${itemIndex}`}
              reduceMotion
            >
              {item}
            </AnimatedListItem>
          ))}
        </div>
      );
    }

    return (
      <div className={cn("flex w-full flex-col items-center gap-4", className)} {...props}>
        <AnimatePresence>
          {childrenArray.slice(0, index + 1).map((item, itemIndex) => (
            <AnimatedListItem key={(item as React.ReactElement).key ?? `animated-list-item-${itemIndex}`}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";
