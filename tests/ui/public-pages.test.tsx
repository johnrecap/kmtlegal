import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicShell } from "@/components/layout";
import { ButtonLink } from "@/components/ui";
import { getPublicContent, navForPath } from "@/content/public-content";
import { DetailCta, PageHero, PublicSection, TrustStrip } from "@/features/public-site/public-components";
import { HomePageView, PrivacyPageView, privacyMetadata } from "@/features/public-site/public-pages";

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
    expect(html).toContain("Services");
    expect(html).toContain("Request a Consultation");
    expect(html).toContain("Client Login");
    expect(html).toContain("href=\"/login?next=/client\"");
    expect(html).toContain("العربية");
    expect(html).toContain("bg-[color:var(--kmt-public-header)]");
    expect(html).toContain("event_available");
    expect(html).toContain("account_circle");
    expect(html).toContain("/brand/kmt-logo-mark.webp");
    expect(html).toContain("/brand/kmt-logo-full.webp");
    expect(html).toContain("bg-kmt-gold/15");
    expect(html).not.toContain(">balance</span>");
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
    expect(html).toContain("دخول العميل");
    expect(html).toContain("href=\"/login?next=/client\"");
  });

  it("renders the English applicant privacy notice with semantic structure and verified links", () => {
    const html = renderToStaticMarkup(<PrivacyPageView locale="en" />);
    const metadata = privacyMetadata("en");

    expect(html).toContain("data-testid=\"privacy-policy\"");
    expect(html).toContain("<h1");
    expect(html).toContain("Privacy Policy and Applicant Notice</h1>");
    expect(html).toContain("dateTime=\"2026-07-10\"");
    expect(html).toContain("href=\"#data-we-collect\"");
    expect(html).toContain("id=\"data-we-collect\"");
    expect(html).toContain("mailto:careers@kmtlegal.org");
    expect(html).toContain("https://www.facebook.com/privacy/policy/");
    expect(html).toContain("https://pdpc.gov.eg");
    expect(html).not.toMatch(/TODO|placeholder/i);
    expect(metadata.alternates?.canonical).toBe("/privacy");
    expect(metadata.alternates?.languages).toEqual({ en: "/privacy", ar: "/ar/privacy", "x-default": "/privacy" });
  });

  it("renders the Arabic applicant privacy notice in structural RTL", () => {
    const html = renderToStaticMarkup(<PrivacyPageView locale="ar" />);

    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("lang=\"ar\"");
    expect(html).toContain("سياسة الخصوصية وبيانات المتقدمين للوظائف</h1>");
    expect(html).toContain("إمكانية العمل حضوريًا في العاصمة الإدارية الجديدة");
    expect(html).toContain("careers@kmtlegal.org");
    expect(html).toContain("سياسة خصوصية Meta");
  });

  it("keeps the Arabic homepage CTA and section eyebrows clean", async () => {
    const content = getPublicContent("ar");
    const html = renderToStaticMarkup(await HomePageView({ locale: "ar" }));
    const publicPageSource = readFileSync(join(process.cwd(), "src/features/public-site/public-pages.tsx"), "utf8");

    expect(content.home.focusEyebrow).toBe("مجال التركيز");
    expect(content.home.approachEyebrow).toBe("منهج العمل");
    expect(content.home.representativeEyebrow).toBe("نماذج تمثيلية");
    expect(content.home.industriesEyebrow).toBe("القطاعات");
    expect(content.home.teamEyebrow).toBe("الفريق");
    expect(content.home.insightsEyebrow).toBe("رؤى قانونية");
    expect(html).toContain("هل تريد مناقشة مسألة قانونية؟");
    expect(html).not.toContain("هل تحتاج إلى دعم قانوني لعملك؟");
    expect(publicPageSource).not.toContain("<FinalCtaBand");
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
    expect(html).toContain("Reviewed by the office before any legal step");
    expect(html).toContain("object-cover");
    expect(html).toContain("data-testid=\"public-page-hero-image\"");
    expect(html).toContain("data-nimg=\"fill\"");
    expect(html).toContain("/_next/image?url=%2Fimage.png");
    expect(html).toContain("opacity-95");
    expect(html).toContain("ltr:bg-gradient-to-r");
    expect(html).toContain("rtl:bg-gradient-to-l");
    expect(html).toContain("drop-shadow-[0_4px_22px_rgba(0,0,0,0.88)]");
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
        title="Find the Closest Service Path"
        description="Clear English description"
      />
    );

    expect(html).toContain("min-h-[360px]");
    expect(html).toContain("md:min-h-[420px]");
    expect(html).toContain("loading=\"lazy\"");
    expect(html).toContain("opacity-95");
    expect(html).toContain("bg-[#020403]/42");
    expect(html).toContain("Find the Closest Service Path");
    expect(html).not.toContain("secondary-container");
  });

  it("renders dark public section and detail CTA APIs", () => {
    const html = renderToStaticMarkup(
        <PublicSection align="center" eyebrow="Test" title="General title" description="General description" surface="muted">
          <DetailCta serviceTitle="Companies & Commercial Contracts" />
        </PublicSection>
      );

    expect(html).toContain("bg-[var(--kmt-public-surface-muted)]");
    expect(html).toContain("mx-auto text-center");
    expect(html).toContain("Start with the Consultation Assistant");
    expect(html).toContain("Request a Consultation");
    expect(html).toContain("href=\"/book-consultation?service=Companies%20%26%20Commercial%20Contracts\"");
  });

  it("keeps product font loading local and blocks fallback font flashes", () => {
    const layoutSource = readFileSync(join(process.cwd(), "src/app/(public-en)/layout.tsx"), "utf8");
    const globalsSource = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

    expect(layoutSource).not.toContain("@fontsource/ibm-plex-sans-arabic");
    expect(layoutSource).not.toContain("material-symbols/outlined.css");
    expect(globalsSource).toContain('font-family: "Inter", "IBM Plex Sans Arabic"');
    expect(globalsSource).toContain('font-family: "IBM Plex Sans Arabic"');
    expect(globalsSource).toContain('font-family: "Material Symbols Outlined"');
    expect(globalsSource).toContain("font-display: swap");
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
