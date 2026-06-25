import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function FilterBar({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full min-w-0 grid-cols-1 gap-3 rounded-lg border border-kmt-border bg-white p-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end",
        "[&>*]:min-w-0 [&>*]:w-full lg:[&>*]:w-auto",
        className
      )}
      role="search"
    >
      {children}
    </div>
  );
}
