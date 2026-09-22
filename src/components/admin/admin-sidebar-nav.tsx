"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KmtBrandLogo } from "@/components/brand";
import { Badge, MaterialSymbol, buttonClasses } from "@/components/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/animate-ui/components/radix/tooltip";
import { cn } from "@/lib/cn";
import { plan35AdminShellCopy } from "@/lib/ui-copy";
import { groupDashboardNavItems, type DashboardNavItem } from "@/components/layout/dashboard-navigation";

const STORAGE_KEY = "kmt-admin-sidebar-collapsed";

export function AdminSidebarNav({
  navItems,
  modeLabel,
  badgeLabel,
  badgeTone
}: {
  navItems: DashboardNavItem[];
  modeLabel: string;
  badgeLabel: string;
  badgeTone: "pending" | "active";
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-e border-border bg-surface px-3 py-4 transition-[width] duration-kmt-normal ease-kmt-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
      data-collapsed={collapsed || undefined}
    >
      <div className={cn("flex min-h-14 items-center gap-3 border-b border-border pb-3", collapsed ? "justify-center" : undefined)}>
        {collapsed ? (
          <KmtBrandLogo label={modeLabel} size="sm" variant="mark" />
        ) : (
          <>
            <KmtBrandLogo size="sm" sublabel={modeLabel} variant="lockup" />
            <Badge className="ms-auto shrink-0" tone={badgeTone}>{badgeLabel}</Badge>
          </>
        )}
      </div>

      <nav aria-label={plan35AdminShellCopy.desktopNavigation} className="flex min-h-0 flex-1 flex-col" data-testid="dashboard-desktop-navigation">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden py-4">
          {groupDashboardNavItems(navItems).map((navGroup, groupIndex) => (
            <div key={`${navGroup.group ?? "nav"}-${groupIndex}`} className="min-w-0">
              {navGroup.group && !collapsed ? (
                <p className="truncate px-3 pb-2 pt-1 text-xs font-semibold text-muted-foreground">{navGroup.group}</p>
              ) : null}
              <ul className="flex flex-col gap-1">
                {navGroup.items.map((item) => {
                  const link = (
                    <Link
                      aria-current={item.active ? "page" : undefined}
                      aria-label={item.label}
                      className={cn(
                        "group flex min-h-11 items-center gap-3 rounded border-s-2 px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        collapsed ? "justify-center" : "justify-start",
                        item.active
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-transparent text-muted-foreground hover:border-primary/40 hover:bg-surface-muted hover:text-foreground"
                      )}
                      href={item.href}
                    >
                      <MaterialSymbol className={cn("shrink-0 text-[20px] text-primary", item.active ? undefined : "opacity-80")} name={item.icon} />
                      {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}
                    </Link>
                  );
                  return (
                    <li key={item.href} className="min-w-0">
                      {collapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="left">{item.label}</TooltipContent>
                        </Tooltip>
                      ) : link}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <button
        aria-expanded={!collapsed}
        aria-label={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
        className={buttonClasses({ variant: "ghost", size: "sm", className: cn("mt-3 min-w-11 gap-2", collapsed ? "px-0" : "w-full justify-start") })}
        onClick={toggleCollapsed}
        type="button"
      >
        <MaterialSymbol className="text-[20px] rtl:rotate-180" name={collapsed ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"} />
        {!collapsed ? <span>طي القائمة</span> : null}
      </button>
    </aside>
  );
}
