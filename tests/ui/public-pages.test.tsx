import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { getPublicContent, navForPath } from "@/content/public-content";
import { DetailCta, PageHero, PublicSection, TrustStrip } from "@/features/public-site/public-components";

describe("public website UI", () => {
  it("renders public shell navigation with English default labels and active page", () => {
    const html = renderToStaticMarkup(
      <PublicShell locale="en" navItems={navForPath("/services", "en")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("Main navigation");
    expect(html).toContain("data-testid=\"public-shell\"");
    expect(html).toContain("dir=\"ltr\"");
    expect(html).toContain("lang=\"en\"");
    expect(html).toContain("data-testid=\"public-language-switch\"");
    expect(html).toContain("href=\"/services\"");
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("Practice Areas");
    expect(html).toContain("Book a Consultation");
    expect(html).toContain("العربية");
    expect(html).toContain("bg-[#070604]/95");
    expect(html).toContain("event_available");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).not.toContain("secondary-container");
  });

  it("renders Arabic public shell with explicit RTL direction", () => {
    const html = renderToStaticMarkup(
      <PublicShell locale="ar" currentPath="/ar/services" navItems={navForPath("/services", "ar")}>
        <div>content</div>
      </PublicShell>
    );

    expect(html).toContain("data-testid=\"public-shell\"");
    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("lang=\"ar\"");
    expect(html).toContain("data-testid=\"public-language-switch\"");
    expect(html).toContain("href=\"/services\"");
    expect(html).toContain("English");
  });

  it("renders cinematic hero and trust strip without relying on cards inside hero", () => {
    const content = getPublicContent("en");
    const html = renderToStaticMarkup(
      <>
        <PageHero
          eyebrow="KMT Legal"
          image="/image.png"
          title="Structured Legal Consultations"
          description="Clear English description"
          actions={<ButtonLink href="/book-consultation">Book</ButtonLink>}
        />
        <TrustStrip items={content.home.trustItems} />
      </>
    );

    expect(html).toContain("Structured Legal Consultations");
    expect(html).toContain("Human review");
    expect(html).toContain("object-cover");
    expect(html).toContain("opacity-50");
    expect(html).toContain("via-kmt-navy/60");
    expect(html).toContain("bg-[#090d11]");
    expect(html).not.toContain("kmt-motion-thread");
    expect(html).toContain("kmt-motion-icon-halo");
  });

  it("renders compact public heroes for inner pages", () => {
    const html = renderToStaticMarkup(
      <PageHero
        eyebrow="Services"
        image="/services.png"
        size="compact"
        title="Filterable Legal Services"
        description="Clear English description"
      />
    );

    expect(html).toContain("min-h-[340px]");
    expect(html).toContain("opacity-60");
    expect(html).toContain("via-kmt-navy/40");
    expect(html).toContain("Filterable Legal Services");
    expect(html).not.toContain("secondary-container");
  });

  it("renders dark public section and detail CTA APIs", () => {
    const html = renderToStaticMarkup(
        <PublicSection align="center" eyebrow="Test" title="General title" description="General description" surface="muted">
          <DetailCta serviceTitle="Corporate Law" />
        </PublicSection>
      );

    expect(html).toContain("bg-[#0c1116]");
    expect(html).toContain("mx-auto text-center");
    expect(html).toContain("Write Your Request In A Few Steps");
    expect(html).toContain("Book a Consultation");
    expect(html).toContain("href=\"/book-consultation?service=Corporate%20Law\"");
  });

  it("keeps product font loading local and blocks fallback font flashes", () => {
    const layoutSource = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const globalsSource = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(layoutSource).not.toContain("@fontsource/ibm-plex-sans-arabic");
    expect(layoutSource).not.toContain("material-symbols/outlined.css");
    expect(globalsSource).toContain('font-family: "Inter", "IBM Plex Sans Arabic"');
    expect(globalsSource).toContain('font-family: "IBM Plex Sans Arabic"');
    expect(globalsSource).toContain('font-family: "Material Symbols Outlined"');
    expect(globalsSource).toContain("font-display: block");
  });

  it("keeps PLAN-31 motion contract free of removed thread utilities", () => {
    const globalsSource = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const motionSource = readFileSync(join(process.cwd(), "src/features/public-site/public-motion.ts"), "utf8");
    const componentsSource = readFileSync(join(process.cwd(), "src/features/public-site/public-components.tsx"), "utf8");
    const packageSource = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const runtimeSources = [globalsSource, motionSource, componentsSource].join("\n");

    expect(runtimeSources).not.toContain("kmt-motion-thread");
    expect(runtimeSources).not.toContain("kmt-motion-trust-strip");
    expect(runtimeSources).not.toContain("publicMotionThread");
    expect(runtimeSources).not.toContain("publicMotionTrustStrip");
    expect(runtimeSources).toContain("kmt-motion-cta");
    expect(runtimeSources).toContain("kmt-motion-card-beam");
    expect(runtimeSources).toContain("kmt-motion-icon-halo");
    expect(runtimeSources).toContain("kmt-motion-arrow-trail");
    expect(runtimeSources).toContain("kmt-motion-panel-enter");
    expect(packageSource).not.toContain("\"motion\"");
  });
});
