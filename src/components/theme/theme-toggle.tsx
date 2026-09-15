"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/cn";

export type ThemeToggleProps = {
  label: string;
  className?: string;
};

export function ThemeToggle({ label, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={mounted ? isDark : undefined}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-kmt-fast ease-kmt-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
        className
      )}
    >
      <MaterialSymbol
        aria-hidden={true}
        className={cn("text-[20px] transition-transform duration-kmt-fast ease-kmt-out motion-reduce:transition-none", !mounted && "invisible")}
        name={isDark ? "dark_mode" : "light_mode"}
      />
    </button>
  );
}
