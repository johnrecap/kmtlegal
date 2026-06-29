import type { ReactNode } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { Badge, MaterialSymbol, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: string;
  group?: string;
  active?: boolean;
};

export function DashboardShell({
  title,
  eyebrow,
  navItems,
  children,
  userLabel,
  mode = "admin",
  action,
  className
}: {
  title: string;
  eyebrow: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  userLabel: string;
  mode?: "admin" | "portal";
  action?: ReactNode;
  className?: string;
}) {
  const groupedNavItems = navItems.reduce<Array<{ group?: string; items: DashboardNavItem[] }>>((groups, item) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.group === item.group) {
      lastGroup.items.push(item);
      return groups;
    }
    groups.push({ group: item.group, items: [item] });
    return groups;
  }, []);

  const modeLabel = mode === "admin" ? "إدارة المكتب" : "بوابة العميل";

  return (
    <div className={cn("min-h-screen overflow-x-hidden bg-kmt-canvas text-kmt-ink lg:flex", className)}>
      <aside className="min-w-0 border-b border-kmt-border bg-white lg:min-h-screen lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-l">
        <div className="flex min-h-16 items-center justify-between border-b border-kmt-border px-5">
          <KmtBrandLogo size="sm" sublabel={modeLabel} surface="light" variant="lockup" />
          <Badge tone={mode === "admin" ? "pending" : "active"}>{mode === "admin" ? "إدارة" : "عميل"}</Badge>
        </div>
        <nav
          aria-label="تنقل لوحة التحكم"
          className="scrollbar-hide flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain p-2 lg:block lg:overflow-visible lg:p-3"
        >
          {groupedNavItems.map((group, groupIndex) => (
            <div key={`${group.group ?? "nav"}-${groupIndex}`} className={cn("contents lg:block", groupIndex > 0 ? "lg:mt-4" : undefined)}>
              {group.group ? (
                <p className="hidden px-3 pb-2 pt-1 text-xs font-semibold text-kmt-muted lg:block">{group.group}</p>
              ) : null}
              <div className="contents lg:block lg:space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    className={cn(
                      "flex min-h-12 min-w-20 shrink-0 flex-col items-center justify-center gap-1 rounded px-2 text-center text-xs font-medium leading-4 transition-colors lg:min-h-11 lg:w-full lg:min-w-0 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-start lg:text-sm lg:leading-normal",
                      item.active ? "bg-kmt-gold/15 text-kmt-ink" : "text-kmt-muted hover:bg-kmt-canvas hover:text-kmt-ink"
                    )}
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                  >
                    <MaterialSymbol className="text-[20px]" name={item.icon} />
                    <span className="max-w-full truncate lg:whitespace-nowrap">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-kmt-border bg-white">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-kmt-gold">{eyebrow}</p>
              <h1 className="break-words text-2xl font-semibold text-kmt-ink">{title}</h1>
            </div>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
              <span className="hidden min-w-0 max-w-56 truncate text-sm text-kmt-muted sm:inline">{userLabel}</span>
              <form action="/api/auth/logout" method="post">
                <button
                  className={buttonClasses({ variant: "ghost", size: "sm", className: "min-w-9 px-2 sm:px-3" })}
                  type="submit"
                  aria-label="تسجيل الخروج"
                >
                  <MaterialSymbol className="text-[20px]" name="logout" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
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
