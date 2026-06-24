import React from "react";
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
});
