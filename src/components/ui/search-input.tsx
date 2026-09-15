import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & { ariaLabel?: string };

export function SearchInput({ className, ariaLabel, "aria-label": nativeAriaLabel, placeholder, ...props }: SearchInputProps) {
  const accessibleLabel = ariaLabel ?? nativeAriaLabel ?? placeholder ?? "بحث";
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{accessibleLabel}</span>
      <MaterialSymbol className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground ltr:left-3 rtl:right-3" name="search" />
      <input
        {...props}
        aria-label={accessibleLabel}
        className="min-h-11 w-full rounded border border-border bg-surface py-2.5 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none focus:border-ring focus:ring-2 focus:ring-ring/25 ltr:pl-10 ltr:pr-3 rtl:pl-3 rtl:pr-10"
        placeholder={placeholder}
        type="search"
      />
    </label>
  );
}
