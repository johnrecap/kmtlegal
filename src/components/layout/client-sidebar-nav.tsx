"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { MaterialSymbol } from "@/components/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { DesktopSidebar, Sidebar, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/cn";
import { getClientContent, type ClientLocale } from "@/content/client-content";
import type { DashboardNavItem } from "./dashboard-shell";

/**
 * Client desktop navigation (Phase 07): the official Aceternity Sidebar
 * chrome (SidebarProvider + DesktopSidebar — hover collapse/expand, width
 * animation) driven by the existing 7 `client-navigation.ts` items. Links
 * are Next.js Links (not the official `SidebarLink` anchor helper) because
 * the phase contract requires `aria-current` + translated active states per
 * item, which the helper cannot carry. Label animation values mirror the
 * official SidebarLink exactly.
 */
function ClientSidebarLinks({ navItems, locale }: { navItems: DashboardNavItem[]; locale: ClientLocale }) {
  const { open, animate } = useSidebar();

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-2">
      {navItems.map((item) => (
        <li key={item.href} className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                aria-current={item.active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "group/sidebar flex min-h-11 items-center justify-start gap-3 rounded border-s-2 px-3 py-2 transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                  item.active
                    ? "border-kmt-gold bg-kmt-gold/10 text-[var(--kmt-client-text)]"
                    : "border-transparent text-[var(--kmt-client-muted)] hover:border-kmt-gold/40 hover:bg-[var(--kmt-client-hover)] hover:text-[var(--kmt-client-text)] dark:hover:bg-white/[0.045]"
                )}
                href={item.href}
              >
                <MaterialSymbol
                  className={cn("shrink-0 text-[22px] text-[var(--kmt-client-gold)]", item.active ? undefined : "opacity-70")}
                  name={item.icon}
                />
                <motion.span
                  animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1
                  }}
                  className="whitespace-pre text-sm font-semibold transition duration-150 group-hover/sidebar:translate-x-1 rtl:group-hover/sidebar:-translate-x-1"
                >
                  {item.label}
                </motion.span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side={locale === "ar" ? "left" : "right"}>{item.label}</TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

export function ClientSidebarNav({
  navItems,
  locale
}: {
  navItems: DashboardNavItem[];
  locale: ClientLocale;
}) {
  const copy = getClientContent(locale).shell;

  return (
    <div className="contents max-lg:hidden">
      <Sidebar>
        <ClientSidebarFocusBridge>
          <DesktopSidebar
            className="border-e border-[var(--kmt-client-line)] bg-[var(--kmt-client-surface)] px-3 py-4 lg:sticky lg:top-[69px] lg:h-[calc(100vh-69px)] dark:bg-[var(--kmt-client-surface)]"
          >
            <nav aria-label={copy.navigation} className="flex min-h-0 flex-1 flex-col">
              <ClientSidebarLinks locale={locale} navItems={navItems} />
            </nav>
          </DesktopSidebar>
        </ClientSidebarFocusBridge>
      </Sidebar>
    </div>
  );
}

/**
 * Keyboard bridge for the hover-driven official sidebar: expanding on focus
 * keeps collapsed icon-only links discoverable for keyboard users. Uses only
 * the official `setOpen` context API — no Sidebar source changes.
 */
function ClientSidebarFocusBridge({ children }: { children: React.ReactNode }) {
  const { setOpen } = useSidebar();

  return (
    <div
      className="contents"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      onFocus={() => setOpen(true)}
    >
      {children}
    </div>
  );
}
