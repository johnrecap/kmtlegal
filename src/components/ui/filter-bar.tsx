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
    <div className={cn("flex w-full min-w-0 flex-wrap items-center gap-3 rounded-lg border border-kmt-border bg-white p-3", className)} role="search">
      {children}
    </div>
  );
}
