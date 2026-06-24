import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { MaterialSymbol } from "./material-symbol";

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">بحث</span>
      <MaterialSymbol className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-[20px] text-kmt-muted ltr:left-3 rtl:right-3" name="search" />
      <input
        className="min-h-11 w-full rounded border border-slate-300 bg-white py-2.5 text-base text-kmt-ink placeholder:text-slate-400 focus:border-kmt-navy focus:ring-2 focus:ring-kmt-gold/20 ltr:pl-10 ltr:pr-3 rtl:pl-3 rtl:pr-10"
        type="search"
        {...props}
      />
    </label>
  );
}
