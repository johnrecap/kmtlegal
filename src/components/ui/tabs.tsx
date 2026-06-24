import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: ReactNode;
  badge?: ReactNode;
};

export function Tabs({
  items,
  activeValue,
  className
}: {
  items: TabItem[];
  activeValue: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2 border-b border-kmt-border", className)} role="tablist" aria-orientation="horizontal">
      {items.map((item) => {
        const active = item.value === activeValue;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "mb-[-1px] inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors",
              active ? "border-kmt-gold text-kmt-ink" : "border-transparent text-kmt-muted hover:text-kmt-ink"
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
