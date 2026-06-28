import type { ReactNode } from "react";
import Link from "next/link";
import { Badge, MaterialSymbol, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { DashboardNavItem } from "./dashboard-shell";

export function ClientSiteShell({
  title,
  eyebrow = "بوابة العميل",
  navItems,
  children,
  userLabel,
  action,
  className
}: {
  title: string;
  eyebrow?: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  userLabel: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-kmt-canvas text-kmt-ink", className)} dir="rtl">
      <header className="border-b border-kmt-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="min-w-0" href="/client">
            <p className="text-lg font-semibold tracking-normal text-kmt-ink">KMT Legal</p>
            <p className="text-xs font-medium text-kmt-muted">مساحة العميل المحمية</p>
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <Badge tone="active">عميل</Badge>
            <span className="max-w-48 truncate text-sm text-kmt-muted">{userLabel}</span>
            <form action="/api/auth/logout" method="post">
              <button className={buttonClasses({ variant: "ghost", size: "sm", className: "min-w-9 px-2 sm:px-3" })} type="submit" aria-label="تسجيل الخروج">
                <MaterialSymbol className="text-[20px]" name="logout" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
            {action}
          </div>
        </div>
        <nav className="border-t border-kmt-border" aria-label="تنقل بوابة العميل">
          <div className="scrollbar-hide mx-auto flex max-w-7xl gap-2 overflow-x-auto overscroll-x-contain px-4 py-2 sm:px-6 lg:px-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded px-3 text-sm font-medium transition-colors",
                  item.active ? "bg-kmt-gold/15 text-kmt-ink" : "text-kmt-muted hover:bg-kmt-canvas hover:text-kmt-ink"
                )}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
              >
                <MaterialSymbol className="text-[20px]" name={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-kmt-gold">{eyebrow}</p>
          <h1 className="mt-1 break-words text-2xl font-semibold text-kmt-ink sm:text-3xl">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
