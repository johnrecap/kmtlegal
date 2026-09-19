import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MaterialSymbol, buttonClasses } from "@/components/ui";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin";
import { cn } from "@/lib/cn";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { type DashboardNavItem } from "./dashboard-navigation";

export type DashboardShellViewProps = {
  title: string;
  eyebrow: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  userLabel: string;
  notificationBell?: ReactNode;
  mode?: "admin" | "portal";
  action?: ReactNode;
  className?: string;
};

export function DashboardShellView({
  title,
  eyebrow,
  navItems,
  children,
  userLabel,
  notificationBell,
  mode = "admin",
  action,
  className
}: DashboardShellViewProps) {
  const modeLabel = mode === "admin" ? plan35AdminShellCopy.adminMode : plan35AdminShellCopy.portalMode;
  const badgeLabel = mode === "admin" ? plan35AdminShellCopy.adminBadge : plan35AdminShellCopy.clientBadge;

  return (
    <div className={cn("min-h-screen overflow-x-hidden bg-kmt-canvas text-kmt-ink lg:flex", className)}>
      <AdminSidebarNav
        badgeLabel={badgeLabel}
        badgeTone={mode === "admin" ? "pending" : "active"}
        modeLabel={modeLabel}
        navItems={navItems}
      />
      <div className="min-w-0 flex-1">
        <header className="border-b border-kmt-border bg-white">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <AdminMobileNav navItems={navItems} modeLabel={modeLabel} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-kmt-gold">{eyebrow}</p>
                <h1 className="break-words text-2xl font-semibold text-kmt-ink">{title}</h1>
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              {mode === "admin" ? notificationBell : null}
              <ThemeToggle
                className="border border-kmt-border text-kmt-muted hover:border-kmt-gold/60 hover:text-kmt-gold focus-visible:outline-kmt-gold"
                label={plan35AdminShellCopy.themeToggle}
              />
              <span className="hidden min-w-0 max-w-56 truncate text-sm text-kmt-muted sm:inline">{userLabel}</span>
              <form action="/api/auth/logout" method="post">
                <button
                  aria-label={plan35AdminShellCopy.logout}
                  className={buttonClasses({ variant: "ghost", size: "sm", className: "min-w-11 px-2 sm:px-3" })}
                  type="submit"
                >
                  <MaterialSymbol className="text-[20px]" name="logout" />
                  <span className="hidden sm:inline">{plan35AdminShellCopy.logout}</span>
                </button>
              </form>
              {action}
            </div>
          </div>
        </header>
        <main className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
