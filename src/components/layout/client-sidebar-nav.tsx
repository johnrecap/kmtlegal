"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import { DesktopSidebar, Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/cn";
import { getClientContent, type ClientLocale } from "@/content/client-content";
import type { DashboardNavItem } from "./dashboard-shell";

/**
 * Client desktop navigation (Phase 07): the official Aceternity Sidebar
 * chrome, pinned open at its existing 300px width by the client layout plan.
 * Links are Next.js Links (not the official `SidebarLink` anchor helper) because
 * the phase contract requires `aria-current` + translated active states per
 * item, which the helper cannot carry. The vendor component stays unchanged.
 */
function ClientSidebarLinks({ navItems }: { navItems: DashboardNavItem[] }) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-2">
      {navItems.map((item) => (
        <li key={item.href} className="min-w-0">
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
            <span className="min-w-0 break-words text-sm font-semibold">{item.label}</span>
          </Link>
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
    <aside className="hidden min-h-0 w-[300px] shrink-0 lg:flex" data-testid="client-portal-sidebar">
      <Sidebar open animate={false}>
        <DesktopSidebar
          className="min-h-0 border-e border-[var(--kmt-client-line)] bg-[var(--kmt-client-surface)] px-3 py-4 dark:bg-[var(--kmt-client-surface)]"
          initial={false}
          onMouseEnter={undefined}
          onMouseLeave={undefined}
        >
          <nav aria-label={copy.navigation} className="flex min-h-0 flex-1 flex-col">
            <ClientSidebarLinks navItems={navItems} />
          </nav>
        </DesktopSidebar>
      </Sidebar>
    </aside>
  );
}
