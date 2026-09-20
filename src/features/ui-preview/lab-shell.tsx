"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { ThemeProvider } from "@/components/theme";
import { cn } from "@/lib/cn";

export type LabLocale = "en" | "ar";

/**
 * Internal Lab shell (Phase 12, preview-only). One compact toolbar switches
 * theme (light/dark via the production next-themes provider) and locale /
 * direction (EN LTR / AR RTL). Sections receive the locale through a
 * render prop so kit demos can swap sample strings without quadruplicating
 * markup. Never linked from production navigation.
 */
export function LabShell({ children }: { children: (locale: LabLocale) => ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <LabInner>{children}</LabInner>
    </ThemeProvider>
  );
}

function LabInner({ children }: { children: (locale: LabLocale) => ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [locale, setLocale] = useState<LabLocale>("en");
  const resolvedTheme = theme === "dark" ? "dark" : "light";

  return (
    <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">KMT Legal Design System</p>
            <h1 className="mt-0.5 text-xl font-semibold text-foreground">
              {locale === "ar" ? "مختبر نظام التصميم" : "Design System Lab"}
            </h1>
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-4 text-sm">
            <SegmentedControl
              ariaLabel={locale === "ar" ? "السمة" : "Theme"}
              onChange={(value) => setTheme(value)}
              options={[
                { value: "light", label: locale === "ar" ? "فاتح" : "Light" },
                { value: "dark", label: locale === "ar" ? "داكن" : "Dark" }
              ]}
              value={resolvedTheme}
            />
            <SegmentedControl
              ariaLabel={locale === "ar" ? "اللغة والاتجاه" : "Locale and direction"}
              onChange={(value) => setLocale(value as LabLocale)}
              options={[
                { value: "en", label: "EN · LTR" },
                { value: "ar", label: "AR · RTL" }
              ]}
              value={locale}
            />
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-2 text-xs text-muted-foreground sm:px-6">
          {locale === "ar"
            ? "معاينة داخلية فقط — تُعرض المكونات الإنتاجية الحالية، ولا توجد روابط لها من التنقل."
            : "Internal preview only — shows current production components. No navigation links point here."}
        </p>
      </div>
      {children(locale)}
    </div>
  );
}

function SegmentedControl({
  ariaLabel,
  options,
  value,
  onChange
}: {
  ariaLabel: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-label={ariaLabel} className="flex items-center gap-1 rounded-full border border-border bg-surface-muted p-1" role="group">
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
            value === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Internal-only provenance label for third-party-derived components.
 * Lab/documentation metadata only — never rendered in production UI.
 */
export function Provenance({ label, note }: { label: string; note?: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="inline-block rounded-full border border-border bg-surface-muted px-2 py-0.5 font-semibold">{label}</span>
      {note ? <span className="ms-2">{note}</span> : null}
    </p>
  );
}
