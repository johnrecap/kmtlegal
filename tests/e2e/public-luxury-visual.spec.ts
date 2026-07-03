import { expect, test } from "@playwright/test";

const publicVisualPages = [
  { path: "/", name: "home", expectedDir: "ltr" },
  { path: "/services", name: "services", expectedDir: "ltr" },
  { path: "/team", name: "team", expectedDir: "ltr" },
  { path: "/articles", name: "articles", expectedDir: "ltr" },
  { path: "/case-studies", name: "case-studies", expectedDir: "ltr" },
  { path: "/media", name: "media", expectedDir: "ltr" },
  { path: "/contact", name: "contact", expectedDir: "ltr" },
  { path: "/book-consultation", name: "book-consultation", expectedDir: "ltr" },
  { path: "/ar", name: "home-ar", expectedDir: "rtl" },
  { path: "/ar/services", name: "services-ar", expectedDir: "rtl" },
  { path: "/ar/team", name: "team-ar", expectedDir: "rtl" },
  { path: "/ar/articles", name: "articles-ar", expectedDir: "rtl" },
  { path: "/ar/case-studies", name: "case-studies-ar", expectedDir: "rtl" },
  { path: "/ar/media", name: "media-ar", expectedDir: "rtl" },
  { path: "/ar/contact", name: "contact-ar", expectedDir: "rtl" },
  { path: "/ar/book-consultation", name: "book-consultation-ar", expectedDir: "rtl" }
];

const publicVisualViewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

const publicMotionSmokePages = [
  { path: "/", name: "home", expectedDir: "ltr" },
  { path: "/services", name: "services", expectedDir: "ltr" },
  { path: "/contact", name: "contact", expectedDir: "ltr" },
  { path: "/book-consultation", name: "book-consultation", expectedDir: "ltr" },
  { path: "/ar", name: "home-ar", expectedDir: "rtl" },
  { path: "/ar/services", name: "services-ar", expectedDir: "rtl" },
  { path: "/ar/contact", name: "contact-ar", expectedDir: "rtl" },
  { path: "/ar/book-consultation", name: "book-consultation-ar", expectedDir: "rtl" }
];

const publicCrawlSeedPages = [
  "/",
  "/services",
  "/team",
  "/articles",
  "/case-studies",
  "/media",
  "/contact",
  "/book-consultation",
  "/privacy",
  "/terms",
  "/ar",
  "/ar/services",
  "/ar/contact",
  "/ar/book-consultation"
];

const publicHeroImagePages = [
  { path: "/", name: "home", expectedObjectPosition: "50% 55%" },
  { path: "/services", name: "services", expectedObjectPosition: "50% 62%" },
  { path: "/team", name: "team", expectedObjectPosition: "50% 38%" },
  { path: "/articles", name: "articles", expectedObjectPosition: "50% 50%" },
  { path: "/case-studies", name: "case-studies", expectedObjectPosition: "50% 60%" },
  { path: "/media", name: "media", expectedObjectPosition: "50% 52%" },
  { path: "/contact", name: "contact", expectedObjectPosition: "50% 48%" },
  { path: "/book-consultation", name: "book-consultation", expectedObjectPosition: "50% 62%" },
  { path: "/ar", name: "home-ar", expectedObjectPosition: "50% 55%" },
  { path: "/ar/services", name: "services-ar", expectedObjectPosition: "50% 62%" },
  { path: "/ar/team", name: "team-ar", expectedObjectPosition: "50% 38%" },
  { path: "/ar/articles", name: "articles-ar", expectedObjectPosition: "50% 50%" },
  { path: "/ar/case-studies", name: "case-studies-ar", expectedObjectPosition: "50% 60%" },
  { path: "/ar/media", name: "media-ar", expectedObjectPosition: "50% 52%" },
  { path: "/ar/contact", name: "contact-ar", expectedObjectPosition: "50% 48%" },
  { path: "/ar/book-consultation", name: "book-consultation-ar", expectedObjectPosition: "50% 62%" }
];

const primaryEnglishHeroImagePaths = new Set(["/", "/services", "/team", "/articles"]);
const primaryEnglishHeroImagePages = publicHeroImagePages.filter((page) => primaryEnglishHeroImagePaths.has(page.path));

async function stubAnalytics(page: import("@playwright/test").Page) {
  await page.route("**/api/analytics/events", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ data: null })
    });
  });
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page, label: string) {
  const { clientWidth, scrollWidth } = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(scrollWidth, `${label} should not create page-level horizontal overflow`).toBeLessThanOrEqual(clientWidth + 1);
}

test.describe("PLAN-28 public luxury visual smoke", () => {
  test("first public hero images load from direct public asset URLs", async ({ page }) => {
    await stubAnalytics(page);
    const primaryEnglishHeroSrcs = new Set<string>();

    for (const pageTarget of publicHeroImagePages) {
      const response = await page.goto(pageTarget.path, { waitUntil: "load" });
      expect(response?.status(), `${pageTarget.path} should render before checking the hero image`).toBeLessThan(400);

      const heroImage = page.getByTestId("public-page-hero-image").first();
      await expect(heroImage, `${pageTarget.name} hero image should be visible`).toBeVisible();

      const src = await heroImage.getAttribute("src");
      expect(src, `${pageTarget.name} hero image should use a direct public asset URL`).toMatch(/^\/stitch-assets\/.+\.png$/);
      await expect(heroImage, `${pageTarget.name} hero crop should use the page-specific focal point`).toHaveCSS("object-position", pageTarget.expectedObjectPosition);
      if (primaryEnglishHeroImagePages.some((primaryPage) => primaryPage.path === pageTarget.path) && src) {
        primaryEnglishHeroSrcs.add(src);
      }

      await expect
        .poll(
          () =>
            heroImage.evaluate((node) => {
              const image = node as HTMLImageElement;
              return image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && image.currentSrc.includes("/stitch-assets/");
            }),
          { message: `${pageTarget.name} hero image should finish loading` }
        )
        .toBe(true);
    }

    expect(primaryEnglishHeroSrcs.size, "the first English public pages should not repeat the same hero photograph").toBe(primaryEnglishHeroImagePages.length);
  });

  for (const viewport of publicVisualViewports) {
    for (const pageTarget of publicVisualPages) {
      test(`${pageTarget.name} captures ${viewport.name} evidence without horizontal overflow`, async ({ page }, testInfo) => {
        await stubAnalytics(page);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(pageTarget.path, { waitUntil: "domcontentloaded" });

        expect(response?.status(), `${pageTarget.path} should render`).toBeLessThan(400);
        await expect(page.locator("html")).toHaveAttribute("dir", pageTarget.expectedDir);
        await expect(page.getByTestId("public-shell")).toHaveAttribute("dir", pageTarget.expectedDir);
        await expect(page.getByRole("heading").first()).toBeVisible();

        await expectNoHorizontalOverflow(page, `${pageTarget.path} ${viewport.width}px`);

        await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath(`plan28-${pageTarget.name}-${viewport.name}.png`)
        });
      });
    }
  }

  test("public internal links across redesigned entry points resolve", async ({ page, request }) => {
    const hrefs = new Set<string>();

    for (const seedPage of publicCrawlSeedPages) {
      const response = await page.goto(seedPage, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${seedPage} should render before crawling links`).toBeLessThan(400);

      const pageHrefs = await page.locator("a[href]").evaluateAll((anchors) =>
        anchors
          .map((anchor) => anchor.getAttribute("href"))
          .filter((href): href is string => Boolean(href))
          .map((href) => {
            const url = new URL(href, window.location.origin);
            return url.origin === window.location.origin ? `${url.pathname}${url.search}` : "";
          })
          .filter((href) => href.startsWith("/") && !href.startsWith("/api/") && !href.startsWith("/_next/"))
      );

      for (const href of pageHrefs) {
        hrefs.add(href);
      }
    }

    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), `${href} should resolve from redesigned public links`).toBeLessThan(400);
    }
  });

  test("PLAN-31 public cinematic motion respects reduced-motion preferences", async ({ page }) => {
    await stubAnalytics(page);
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const pageTarget of publicMotionSmokePages) {
      const response = await page.goto(pageTarget.path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${pageTarget.path} should render with reduced motion`).toBeLessThan(400);
      await expect(page.locator("html")).toHaveAttribute("dir", pageTarget.expectedDir);
      await expect(page.getByTestId("public-shell")).toHaveAttribute("dir", pageTarget.expectedDir);

      const reveal = page.locator(".kmt-motion-reveal").first();
      await expect(reveal, `${pageTarget.path} should include the public hero reveal target`).toBeVisible();
      await expect(reveal).toHaveCSS("animation-name", "none");

      await expect(page.locator(".kmt-motion-thread"), `${pageTarget.path} should not render the removed Gold Legal Thread`).toHaveCount(0);
      await expect(page.locator(".kmt-motion-cta").first(), `${pageTarget.path} should include cinematic CTA motion hooks`).toBeVisible();
      await expect(page.locator(".kmt-motion-card-beam").first(), `${pageTarget.path} should include animated border beam hooks`).toBeVisible();
      await expect(page.locator(".kmt-motion-icon-halo").first(), `${pageTarget.path} should include icon halo hooks`).toBeVisible();

      const arrow = page.locator(".kmt-motion-arrow").first();
      if ((await arrow.count()) > 0) {
        const transformBeforeHover = await arrow.evaluate((node) => getComputedStyle(node).transform);
        await arrow.hover();
        await expect.poll(() => arrow.evaluate((node) => getComputedStyle(node).transform)).toBe(transformBeforeHover);
      }
    }
  });

  test("PLAN-31 hover and focus motion do not introduce horizontal overflow", async ({ page }) => {
    await stubAnalytics(page);
    await page.setViewportSize({ width: 390, height: 844 });

    for (const pageTarget of publicVisualPages) {
      const response = await page.goto(pageTarget.path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${pageTarget.path} should render before motion interaction`).toBeLessThan(400);

      const firstButton = page.locator(".kmt-motion-button").first();
      if ((await firstButton.count()) > 0) {
        await firstButton.focus();
        await expectNoHorizontalOverflow(page, `${pageTarget.path} focused motion button`);
      }

      const firstCard = page.locator(".kmt-motion-card-beam").first();
      if ((await firstCard.count()) > 0) {
        await firstCard.hover();
        await expectNoHorizontalOverflow(page, `${pageTarget.path} hovered motion card`);
      }
    }
  });

  test("PLAN-31 RTL arrow trail moves inline-forward", async ({ page }) => {
    await stubAnalytics(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const englishArrow = page.locator(".kmt-motion-arrow-trail").first();
    await expect(englishArrow).toBeVisible();
    await englishArrow.hover();
    await expect.poll(() => englishArrow.evaluate((node) => getComputedStyle(node).getPropertyValue("--kmt-arrow-shift").trim())).toBe("6px");

    await page.goto("/ar", { waitUntil: "domcontentloaded" });
    const arabicArrow = page.locator(".kmt-motion-arrow-trail").first();
    await expect(arabicArrow).toBeVisible();
    await arabicArrow.hover();
    await expect.poll(() => arabicArrow.evaluate((node) => getComputedStyle(node).getPropertyValue("--kmt-arrow-shift").trim())).toBe("-6px");
  });

  test("English public shell stays LTR after switching from Arabic", async ({ page }) => {
    await stubAnalytics(page);
    await page.goto("/ar", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("public-shell")).toHaveAttribute("dir", "rtl");

    await page.getByTestId("public-language-switch").click();
    await page.waitForURL("/");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("public-shell")).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("public-shell")).toHaveAttribute("lang", "en");
  });
});
