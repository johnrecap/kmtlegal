import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ProductThemeProvider({
  children,
  locale = "ar",
  className
}: {
  children: ReactNode;
  locale?: "ar" | "en";
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-kmt-canvas text-kmt-ink", className)} dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      {children}
    </div>
  );
}
