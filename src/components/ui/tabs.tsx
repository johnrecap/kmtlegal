import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: ReactNode;
  badge?: ReactNode;
};

export function Tabs({
  items,
  activeValue,
  className,
  ariaLabel = "اختيار القسم"
}: {
  items: TabItem[];
  activeValue: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2 border-b border-border", className)} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === activeValue;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            className={cn(
              "mb-[-1px] inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}

export type LinkTabItem = {
  href: string;
  label: ReactNode;
  count?: ReactNode;
  active?: boolean;
};

export function LinkTabs({
  items,
  className,
  ariaLabel = "اختيار القسم"
}: {
  items: LinkTabItem[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("flex flex-wrap gap-2 border-b border-border", className)}>
      {items.map((item) => (
        <Link
          key={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "mb-[-1px] inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none",
            item.active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          href={item.href}
        >
          <span>{item.label}</span>
          {item.count !== undefined ? (
            <span aria-hidden="true" className={cn("rounded-full border px-1.5 text-xs leading-5", item.active ? "border-primary/40 bg-primary/15 text-foreground" : "border-border bg-surface-muted text-muted-foreground")}>
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
