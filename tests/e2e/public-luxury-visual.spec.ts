import { expect, test } from "@playwright/test";

const publicVisualPages = [
  { path: "/", name: "home", expectedDir: "ltr" },
  { path: "/services", name: "services", expectedDir: "ltr" },
  { path: "/contact", name: "contact", expectedDir: "ltr" },
  { path: "/book-consultation", name: "book-consultation", expectedDir: "ltr" },
  { path: "/ar", name: "home-ar", expectedDir: "rtl" },
  { path: "/ar/services", name: "services-ar", expectedDir: "rtl" }
];

const publicVisualViewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
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

async function stubAnalytics(page: import("@playwright/test").Page) {
  await page.route("**/api/analytics/events", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ data: null })
    });
  });
}

test.describe("PLAN-28 public luxury visual smoke", () => {
  for (const viewport of publicVisualViewports) {
    for (const pageTarget of publicVisualPages) {
      test(`${pageTarget.name} captures ${viewport.name} evidence without horizontal overflow`, async ({ page }, testInfo) => {
        await stubAnalytics(page);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(pageTarget.path, { waitUntil: "domcontentloaded" });

        expect(response?.status(), `${pageTarget.path} should render`).toBeLessThan(400);
        await expect(page.locator("html")).toHaveAttribute("dir", pageTarget.expectedDir);
        await expect(page.getByRole("heading").first()).toBeVisible();

        const { clientWidth, scrollWidth } = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        expect(scrollWidth, `${pageTarget.path} should not overflow ${viewport.width}px`).toBeLessThanOrEqual(clientWidth + 1);

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
});
