import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";

/**
 * Phases 6+7 regression: the public footer must ride theme-aware tokens
 * (never a forced-dark surface), and the dark-based full logo must sit in
 * a deliberate brand plaque in both themes.
 */
describe("public footer theme", () => {
  it("renders the footer body on the theme-aware canvas, not forced black", () => {
    const html = renderToStaticMarkup(
      <PublicShell locale="en" navItems={navForPath("/", "en")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("bg-[var(--kmt-public-canvas)]");
    expect(html).not.toContain("bg-[var(--kmt-black-0)]");
    // Legal bar: warm secondary in light, transparent deep black in dark.
    expect(html).toContain("bg-[var(--kmt-public-surface-muted)]");
    expect(html).toContain("dark:bg-transparent");
  });

  it("wraps the footer logo in a dark brand plaque", () => {
    const html = renderToStaticMarkup(
      <PublicShell locale="en" navItems={navForPath("/", "en")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("/brand/kmt-logo-full.webp");
    expect(html).toContain("rounded-[10px]");
    expect(html).toContain("border-kmt-gold/30");
    expect(html).toContain("bg-black");
  });

  it("keeps the plaque in Arabic RTL shells", () => {
    const html = renderToStaticMarkup(
      <PublicShell locale="ar" currentPath="/ar" navItems={navForPath("/", "ar")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("/brand/kmt-logo-full.webp");
    expect(html).toContain("rounded-[10px]");
    expect(html).not.toContain("bg-[var(--kmt-black-0)]");
  });
});
