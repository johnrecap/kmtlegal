"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

/**
 * Aceternity UI Floating Dock (vendored + adapted).
 * https://ui.aceternity.com/components/floating-dock
 *
 * Real component architecture, kept intact: desktop magnification dock
 * (mouseX motion value → distance transform → springed icon containers
 * with hover tooltips) + mobile expanding menu. KMT adaptations
 * (behavior contract preserved, styling owned by caller/theme):
 * - `motion/react` instead of framer-motion (same API; matches repo stack).
 * - No Tabler dependency: `icon` is caller-provided ReactNode (KMT uses
 *   Material Symbols).
 * - Items support `external` (WhatsApp): external entries render an
 *   anchor with target/rel instead of a Next Link.
 * - Theme-aware surfaces via KMT tokens (deep black/gold dark, warm
 *   paper light) instead of hard-coded gray-50/neutral-900.
 * - Reduced motion is handled by the caller's `MotionConfig
 *   reducedMotion="user"` boundary (springs collapse, tooltips settle).
 */
export type FloatingDockItem = {
  title: string;
  icon: ReactNode;
  href: string;
  /** External actions (WhatsApp) open in a new tab with noopener. */
  external?: boolean;
};

export function FloatingDock({
  items,
  desktopClassName,
  mobileClassName,
  mobileMenuLabel = "Quick actions",
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  mobileMenuLabel?: string;
}) {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} menuLabel={mobileMenuLabel} />
    </>
  );
}

function FloatingDockMobile({
  items,
  className,
  menuLabel,
}: {
  items: FloatingDockItem[];
  className?: string;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)} data-testid="public-floating-dock-mobile">
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="public-dock-nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col items-center gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: { delay: idx * 0.05 },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <DockAction
                  item={item}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] text-[var(--kmt-assistant-text)]"
                  iconClassName="h-5 w-5"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={menuLabel}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] text-[var(--kmt-public-gold)]"
      >
        <MaterialSymbol className="text-xl" name={open ? "close" : "add"} />
      </button>
    </div>
  );
}

function FloatingDockDesktop({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 w-max items-end gap-4 rounded-2xl border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-shell)]/95 px-4 pb-3 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur md:flex dark:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
      data-testid="public-floating-dock-desktop"
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} item={item} />
      ))}
    </motion.div>
  );
}

function IconContainer({
  mouseX,
  item,
}: {
  mouseX: MotionValue<number>;
  item: FloatingDockItem;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref?.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [20, 40, 20]
  );

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <DockAction
      item={item}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        className="relative flex aspect-square items-center justify-center rounded-full border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-chip)] text-[var(--kmt-assistant-text)] transition-colors hover:border-kmt-gold/60 hover:text-[var(--kmt-public-gold)]"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="absolute -top-8 left-1/2 w-fit whitespace-pre rounded-md border border-[var(--kmt-assistant-line)] bg-[var(--kmt-assistant-bubble)] px-2 py-0.5 text-xs text-[var(--kmt-assistant-text)]"
            >
              {item.title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {item.icon}
        </motion.div>
      </motion.div>
    </DockAction>
  );
}

function DockAction({
  item,
  children,
  className,
  iconClassName,
  onMouseEnter,
  onMouseLeave,
}: {
  item: FloatingDockItem;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title}
        title={item.title}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={className}
      >
        {children ?? <span className={iconClassName}>{item.icon}</span>}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      aria-label={item.title}
      title={item.title}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
    >
      {children ?? <span className={iconClassName}>{item.icon}</span>}
    </Link>
  );
}
