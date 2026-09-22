"use client";

import { useState } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { MaterialSymbol, buttonClasses } from "@/components/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/animate-ui/components/radix/sheet";
import { cn } from "@/lib/cn";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { groupDashboardNavItems, type DashboardNavItem } from "@/components/layout/dashboard-navigation";

/**
 * Admin mobile navigation (Phase 09): the approved Animate UI Sheet
 * replacing the native dialog-element drawer. Correct RTL side, Radix focus
 * trap, close on navigation, permission-filtered grouped items, active
 * states. Existing testids + copy preserved.
 */
export function AdminMobileNav({ navItems, modeLabel }: { navItems: DashboardNavItem[]; modeLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={plan35AdminShellCopy.openNavigation}
          className={buttonClasses({ variant: "ghost", size: "sm", className: "h-11 w-11 shrink-0 px-0 lg:hidden" })}
          data-testid="dashboard-mobile-navigation-trigger"
          type="button"
        >
          <MaterialSymbol className="text-[24px]" name="menu" />
        </button>
      </SheetTrigger>
      <SheetContent
        className="border-border bg-surface p-0 text-foreground"
        side="right"
      >
        <SheetHeader className="flex min-h-16 flex-row items-center justify-between gap-3 border-b border-border px-4">
          <KmtBrandLogo size="sm" sublabel={modeLabel} variant="lockup" />
          <SheetTitle className="sr-only">{plan35AdminShellCopy.navigationTitle}</SheetTitle>
        </SheetHeader>
        <nav aria-label={plan35AdminShellCopy.mobileNavigation} className="flex-1 overflow-y-auto p-3" data-testid="dashboard-mobile-navigation">
          {groupDashboardNavItems(navItems).map((navGroup, groupIndex) => (
            <div key={`${navGroup.group ?? "nav"}-${groupIndex}`} className={groupIndex ? "mt-4" : undefined}>
              {navGroup.group ? (
                <p className="px-3 pb-2 pt-1 text-xs font-semibold text-muted-foreground">{navGroup.group}</p>
              ) : null}
              <div className="space-y-1">
                {navGroup.items.map((navItem) => (
                  <Link
                    key={navItem.href}
                    aria-current={navItem.active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded px-3 py-2.5 text-start text-sm font-medium transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
                      navItem.active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                    )}
                    href={navItem.href}
                    onClick={() => setOpen(false)}
                  >
                    <MaterialSymbol className="text-[20px]" name={navItem.icon} />
                    <span className="min-w-0 flex-1 break-words">{navItem.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
