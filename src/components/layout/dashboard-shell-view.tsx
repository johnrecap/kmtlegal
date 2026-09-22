import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminAccountMenu, AdminMobileNav, AdminSidebarNav } from "@/components/admin";
import { cn } from "@/lib/cn";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { type DashboardNavItem } from "./dashboard-navigation";
import type { DashboardBreadcrumb } from "./dashboard-page-frame";

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
  roleLabel?: string;
  scopeLabel?: string;
  description?: string;
  breadcrumbs?: DashboardBreadcrumb[];
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
  className,
  roleLabel,
  scopeLabel,
  description
}: DashboardShellViewProps) {
  const modeLabel = mode === "admin" ? plan35AdminShellCopy.adminMode : plan35AdminShellCopy.portalMode;
  const badgeLabel = mode === "admin" ? plan35AdminShellCopy.adminBadge : plan35AdminShellCopy.clientBadge;

  return (
    <div className={cn("admin-workspace min-h-screen overflow-x-hidden bg-background text-foreground lg:flex", className)}>
      <a className="sr-only z-[200] rounded bg-surface px-4 py-3 text-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4" href="#admin-main-content">
        {plan35AdminShellCopy.skipToContent}
      </a>
      <AdminSidebarNav
        badgeLabel={roleLabel ?? badgeLabel}
        badgeTone={mode === "admin" ? "pending" : "active"}
        modeLabel={modeLabel}
        navItems={navItems}
      />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <AdminMobileNav navItems={navItems} modeLabel={modeLabel} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{eyebrow}</p>
                <p className="break-words text-base font-semibold text-foreground sm:text-lg">{title}</p>
                {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              {mode === "admin" ? notificationBell : null}
              <ThemeToggle
                className="border border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
                label={plan35AdminShellCopy.themeToggle}
              />
              <AdminAccountMenu roleLabel={roleLabel} scopeLabel={scopeLabel} userLabel={userLabel} />
              {action}
            </div>
          </div>
        </header>
        <main id="admin-main-content" className="min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
