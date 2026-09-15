"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export const KMT_THEME_STORAGE_KEY = "kmt-theme";
export const KMT_ADMIN_THEME_STORAGE_KEY = "kmt-theme-admin";

type KmtThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: "light" | "dark";
  storageKey?: string;
  enableSystem?: boolean;
};

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = KMT_THEME_STORAGE_KEY,
  enableSystem = false
}: KmtThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
