"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";



const transition = {
  type: "spring" as const,
  mass: 0.5,
  damping: 11.5,
  stiffness: 100,
  restDelta: 0.001,
  restSpeed: 0.001,
};

export const MenuItem = ({
  setActive,
  active,
  item,
  children,
  href,
  activeLink = false,
  triggerClassName,
  ariaExpanded,
  trigger,
}: {
  setActive: (item: string) => void;
  active: string | null;
  item: string;
  children?: React.ReactNode;
  /**
   * KMT adaptation: when provided, the trigger renders as a real Next.js
   * navigation link (preserving routes/keyboard/a11y) instead of demo text.
   */
  href?: string;
  activeLink?: boolean;
  triggerClassName?: string;
  ariaExpanded?: boolean;
  /** KMT adaptation: rich trigger content (label + icon + indicator). */
  trigger?: React.ReactNode;
}) => {
  const triggerClasses = `cursor-pointer text-[var(--kmt-public-muted)] hover:text-[var(--kmt-public-text)] hover:opacity-[0.9] ${triggerClassName ?? ""}`;
  const triggerContent = trigger ?? item;
  return (
    <div
      onMouseEnter={() => setActive(item)}
      onFocus={() => setActive(item)}
      className="relative "
    >
      {href ? (
        <Link
          href={href}
          aria-expanded={ariaExpanded}
          aria-haspopup={children ? "true" : undefined}
          aria-current={activeLink ? "page" : undefined}
          className={triggerClasses}
        >
          <motion.span transition={{ duration: 0.3 }} className="inline-flex items-center gap-1">
            {triggerContent}
          </motion.span>
        </Link>
      ) : (
        <motion.p
          transition={{ duration: 0.3 }}
          className={triggerClasses}
        >
          {triggerContent}
        </motion.p>
      )}
      {active !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={transition}
        >
          {active === item && (
            <div className="absolute top-[calc(100%_+_1.2rem)] start-1/2 transform -translate-x-1/2 rtl:translate-x-1/2 pt-4">
              <motion.div
                transition={transition}
                layoutId="active" // layoutId ensures smooth animation
                className="overflow-hidden rounded-2xl border border-kmt-gold/20 bg-[color:var(--kmt-public-header)] shadow-[var(--kmt-public-dropdown-shadow)] backdrop-blur-xl"
              >
                <motion.div
                  layout // layout ensures smooth animation
                  className="w-max h-full p-4"
                >
                  {children}
                </motion.div>
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export const Menu = ({
  setActive,
  children,
  className,
}: {
  setActive: (item: string | null) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <nav
      onMouseLeave={() => setActive(null)} // resets the state
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setActive(null);
      }}
      className={cn(
        "relative flex justify-center space-x-4 rounded-full border border-transparent bg-transparent px-8 py-6 shadow-none rtl:space-x-reverse",
        className
      )}
    >
      {children}
    </nav>
  );
};

export const ProductItem = ({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) => {
  return (
    <a href={href} className="flex space-x-2 rtl:space-x-reverse">
      <img
        src={src}
        width={140}
        height={70}
        alt={title}
        className="shrink-0 rounded-md shadow-2xl"
      />
      <div>
        <h4 className="text-xl font-bold mb-1 text-black dark:text-white">
          {title}
        </h4>
        <p className="text-neutral-700 text-sm max-w-[10rem] dark:text-neutral-300">
          {description}
        </p>
      </div>
    </a>
  );
};

export const HoveredLink = ({ children, ...rest }: any) => {
  return (
    <a
      {...rest}
      className="text-neutral-700 dark:text-neutral-200 hover:text-black "
    >
      {children}
    </a>
  );
};
