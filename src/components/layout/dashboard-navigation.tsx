import Link from "next/link";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: string;
  group?: string;
  active?: boolean;
};

type DashboardNavGroup = {
  group?: string;
  items: DashboardNavItem[];
};

export function groupDashboardNavItems(navItems: DashboardNavItem[]) {
  return navItems.reduce<DashboardNavGroup[]>((groups, navItem) => {
    const currentGroup = groups.at(-1);
    if (currentGroup && currentGroup.group === navItem.group) {
      currentGroup.items.push(navItem);
    } else {
      groups.push({ group: navItem.group, items: [navItem] });
    }
    return groups;
  }, []);
}

export function DashboardNavigationLinks({
  navItems,
  surface,
  onNavigate
}: {
  navItems: DashboardNavItem[];
  surface: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  return groupDashboardNavItems(navItems).map((navGroup, groupIndex) => (
    <div key={`${navGroup.group ?? "nav"}-${groupIndex}`} className={groupIndex ? "mt-4" : undefined}>
      {navGroup.group ? (
        <p className="px-3 pb-2 pt-1 text-xs font-semibold text-kmt-muted">{navGroup.group}</p>
      ) : null}
      <div className="space-y-1">
        {navGroup.items.map((navItem) => (
          <Link
            key={navItem.href}
            aria-current={navItem.active ? "page" : undefined}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded px-3 text-start text-sm font-medium transition-colors",
              surface === "mobile" ? "py-2.5" : undefined,
              navItem.active
                ? "bg-kmt-gold/15 text-kmt-ink"
                : "text-kmt-muted hover:bg-kmt-canvas hover:text-kmt-ink"
            )}
            href={navItem.href}
            onClick={onNavigate}
          >
            <MaterialSymbol className="text-[20px]" name={navItem.icon} />
            <span className="min-w-0 flex-1 break-words">{navItem.label}</span>
          </Link>
        ))}
      </div>
    </div>
  ));
}
