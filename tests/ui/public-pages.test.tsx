import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { PageHero, TrustStrip } from "@/features/public-site/public-components";

describe("public website UI", () => {
  it("renders public shell navigation with Arabic labels and active page", () => {
    const html = renderToStaticMarkup(
      <PublicShell navItems={navForPath("/services")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("التنقل الرئيسي");
    expect(html).toContain("href=\"/services\"");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("احجز استشارة");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).not.toContain("secondary-container");
  });

  it("renders hero and trust strip without relying on cards inside hero", () => {
    const html = renderToStaticMarkup(
      <>
        <PageHero
          eyebrow="KMT Legal"
          image="/image.png"
          title="استشارات قانونية منظمة"
          description="وصف عربي واضح"
          actions={<ButtonLink href="/book-consultation">احجز</ButtonLink>}
        />
        <TrustStrip />
      </>
    );

    expect(html).toContain("استشارات قانونية منظمة");
    expect(html).toContain("مراجعة بشرية");
    expect(html).toContain("object-cover");
  });

  it("renders compact public heroes for inner pages", () => {
    const html = renderToStaticMarkup(
      <PageHero
        eyebrow="الخدمات"
        image="/services.png"
        size="compact"
        title="خدمات قانونية قابلة للفرز"
        description="وصف عربي واضح"
      />
    );

    expect(html).toContain("min-h-[340px]");
    expect(html).toContain("خدمات قانونية قابلة للفرز");
    expect(html).not.toContain("secondary-container");
  });

  it("keeps product font loading local and blocks fallback font flashes", () => {
    const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const globalsSource = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(layoutSource).not.toContain("@fontsource/ibm-plex-sans-arabic");
    expect(layoutSource).not.toContain("material-symbols/outlined.css");
    expect(globalsSource).toContain('font-family: "IBM Plex Sans Arabic"');
    expect(globalsSource).toContain('font-family: "Material Symbols Outlined"');
    expect(globalsSource).toContain("font-display: block");
  });
});
