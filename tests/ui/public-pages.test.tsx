import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { navForPath } from "@/content/public-content";
import { DetailCta, PageHero, PublicSection, TrustStrip } from "@/features/public-site/public-components";

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
    expect(html).toContain("مجالات الخبرة");
    expect(html).toContain("احجز استشارة");
    expect(html).toContain("bg-[#070604]/95");
    expect(html).toContain("event_available");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).not.toContain("secondary-container");
  });

  it("renders cinematic hero and trust strip without relying on cards inside hero", () => {
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
    expect(html).toContain("opacity-50");
    expect(html).toContain("via-kmt-navy/60");
    expect(html).toContain("bg-[#090d11]");
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
    expect(html).toContain("opacity-60");
    expect(html).toContain("via-kmt-navy/40");
    expect(html).toContain("خدمات قانونية قابلة للفرز");
    expect(html).not.toContain("secondary-container");
  });

  it("renders dark public section and detail CTA APIs", () => {
    const html = renderToStaticMarkup(
      <PublicSection align="center" eyebrow="اختبار" title="عنوان عام" description="وصف عام" surface="muted">
        <DetailCta serviceTitle="Corporate Law" />
      </PublicSection>
    );

    expect(html).toContain("bg-[#0c1116]");
    expect(html).toContain("mx-auto text-center");
    expect(html).toContain("ابدأ بطلب استشارة منظم");
    expect(html).toContain("احجز استشارة");
    expect(html).toContain("href=\"/book-consultation?service=Corporate%20Law\"");
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
