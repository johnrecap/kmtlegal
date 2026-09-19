"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { KmtBrandLogo } from "@/components/brand";
import { Badge } from "@/components/ui";
import { MaterialSymbol } from "@/components/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { DesktopSidebar, Sidebar, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/cn";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { groupDashboardNavItems, type DashboardNavItem } from "@/components/layout/dashboard-navigation";

/**
 * Admin desktop navigation (Phase 09): the SAME official Aceternity Sidebar
 * primitive as the client foundation (SidebarProvider + DesktopSidebar —
 * hover collapse/expand, width animation), mapping the permission-filtered,
 * grouped `admin-navigation.ts` items. Links are Next.js Links (not the
 * official `SidebarLink` anchor helper) because the phase contract requires
 * per-item `aria-current` + `isAdminRouteActive` semantics, which the helper
 * cannot carry. Label animation mirrors the official SidebarLink exactly.
 * Admin shell is light-first (matches `DashboardShellView` surfaces); the
 * vendor's built-in dark classes are kept for theme parity.
 */
function AdminSidebarLinks({ navItems }: { navItems: DashboardNavItem[] }) {
  const { open, animate } = useSidebar();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden py-2">
      {groupDashboardNavItems(navItems).map((navGroup, groupIndex) => (
        <div key={`${navGroup.group ?? "nav"}-${groupIndex}`} className="min-w-0">
          {navGroup.group && open ? (
            <p className="truncate px-3 pb-2 pt-1 text-xs font-semibold text-kmt-muted">{navGroup.group}</p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {navGroup.items.map((item) => (
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
                          ? "border-kmt-gold bg-kmt-gold/15 text-kmt-ink"
                          : "border-transparent text-kmt-muted hover:border-kmt-gold/40 hover:bg-kmt-canvas hover:text-kmt-ink"
                      )}
                      href={item.href}
                    >
                      <MaterialSymbol
                        className={cn("shrink-0 text-[20px] text-kmt-gold", item.active ? undefined : "opacity-70")}
                        name={item.icon}
                      />
                      <motion.span
                        animate={{
                          display: animate ? (open ? "inline-block" : "none") : "inline-block",
                          opacity: animate ? (open ? 1 : 0) : 1
                        }}
                        className="whitespace-pre text-sm font-medium transition duration-150 group-hover/sidebar:translate-x-1 rtl:group-hover/sidebar:-translate-x-1"
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left">{item.label}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function AdminSidebarNav({ navItems, modeLabel, badgeLabel, badgeTone }: { navItems: DashboardNavItem[]; modeLabel: string; badgeLabel: string; badgeTone: "pending" | "active" }) {
  return (
    <div className="contents max-lg:hidden">
      <Sidebar>
        <AdminSidebarFocusBridge>
          <DesktopSidebar className="border-e border-kmt-border bg-white px-3 py-4 lg:sticky lg:top-0 lg:h-screen dark:border-kmt-border dark:bg-white">
            <AdminSidebarBrand badgeLabel={badgeLabel} badgeTone={badgeTone} modeLabel={modeLabel} />
            <nav aria-label={plan35AdminShellCopy.desktopNavigation} className="flex min-h-0 flex-1 flex-col" data-testid="dashboard-desktop-navigation">
              <AdminSidebarLinks navItems={navItems} />
            </nav>
          </DesktopSidebar>
        </AdminSidebarFocusBridge>
      </Sidebar>
    </div>
  );
}

/**
 * Brand lockup riding the official collapse animation (same motion values
 * as the nav labels): icon mark always visible, wordmark + mode badge only
 * when expanded.
 */
function AdminSidebarBrand({ modeLabel, badgeLabel, badgeTone }: { modeLabel: string; badgeLabel: string; badgeTone: "pending" | "active" }) {
  const { open, animate } = useSidebar();

  return (
    <div className="flex min-h-12 items-center gap-2 border-b border-kmt-border px-1 pb-3">
      <KmtBrandLogo label={modeLabel} size="sm" variant="mark" />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1
        }}
        className="min-w-0 whitespace-pre"
      >
        <KmtBrandLogo size="sm" sublabel={modeLabel} surface="light" variant="lockup" />
      </motion.span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1
        }}
        className="ms-auto shrink-0"
      >
        <Badge tone={badgeTone}>{badgeLabel}</Badge>
      </motion.span>
    </div>
  );
}

/**
 * Keyboard bridge for the hover-driven official sidebar: expanding on focus
 * keeps collapsed icon-only links discoverable for keyboard users. Uses only
 * the official `setOpen` context API — no Sidebar source changes.
 */
function AdminSidebarFocusBridge({ children }: { children: React.ReactNode }) {
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
