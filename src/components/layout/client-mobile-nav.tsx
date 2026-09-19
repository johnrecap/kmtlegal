"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
import { cn } from "@/lib/cn";
import { getClientContent, type ClientLocale } from "@/content/client-content";
import type { DashboardNavItem } from "./dashboard-shell";

/**
 * Client mobile navigation (Phase 07): the approved Animate UI Sheet menu
 * replacing the compact mobile nav row. Correct RTL side, focus trap from
 * Radix Dialog, close on navigation, `aria-current` active states,
 * translated labels, touch-safe targets.
 */
export function ClientMobileNav({
  navItems,
  locale
}: {
  navItems: DashboardNavItem[];
  locale: ClientLocale;
}) {
  const [open, setOpen] = useState(false);
  const copy = getClientContent(locale).shell;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={copy.navigation}
          className="inline-flex h-10 min-w-10 items-center justify-center border border-[var(--kmt-client-line)] px-2 text-[var(--kmt-client-text)] transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold sm:h-11 sm:min-w-11 sm:px-3 lg:hidden"
          type="button"
        >
          <MaterialSymbol className="text-[22px]" name="menu" />
        </button>
      </SheetTrigger>
      <SheetContent
        className="border-[var(--kmt-client-line)] bg-[var(--kmt-client-surface)] text-[var(--kmt-client-text)]"
        side={locale === "ar" ? "right" : "left"}
      >
        <SheetHeader className="border-b border-[var(--kmt-client-line)] text-start">
          <SheetTitle className="text-[var(--kmt-client-text)]">{copy.navigation}</SheetTitle>
        </SheetHeader>
        <nav aria-label={copy.navigation} className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded border-s-2 px-3 py-2 text-base font-semibold transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                    item.active
                      ? "border-kmt-gold bg-kmt-gold/10 text-[var(--kmt-client-text)]"
                      : "border-transparent text-[var(--kmt-client-muted)] hover:border-kmt-gold/40 hover:bg-[var(--kmt-client-hover)] hover:text-[var(--kmt-client-text)]"
                  )}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <MaterialSymbol
                    className={cn("shrink-0 text-[22px] text-[var(--kmt-client-gold)]", item.active ? undefined : "opacity-70")}
                    name={item.icon}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
