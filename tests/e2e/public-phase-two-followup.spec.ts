import { expect, test } from "@playwright/test";
import { getPublicContent } from "../../src/content/public-content";

for (const locale of ["ar", "en"] as const) {
  const prefix = locale === "ar" ? "/ar" : "";
  test(`${locale}: final service template at every required viewport`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, body: "" }));
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      for (const service of getPublicContent(locale).legalServices) {
        await page.goto(`${prefix}/services/${service.slug}`, { waitUntil: "networkidle" });
        await expect(page.locator("html")).toHaveClass(theme);
        await expect(page.locator("h1")).toHaveText(service.title);
        await expect(page.getByRole("navigation", { name: getPublicContent(locale).serviceDetail.breadcrumbAriaLabel }).locator("li")).toHaveCount(2);
        for (const width of [360, 390, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
          if (service.slug === "contracts" && [390, 1440].includes(width)) await page.screenshot({ path: info.outputPath(`contracts-${theme}-${width}.png`) });
        }
      }
    }
  });
  test(`${locale}: final home count, logo motion, header and layout`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, body: "" }));
    for (const theme of ["light", "dark"]) for (const width of [360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(prefix || "/", { waitUntil: "networkidle" });
      const statistic = page.getByText(getPublicContent(locale).home.heroStats[0].label, { exact: true }).locator("..");
      await expect(statistic).toContainText("6");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const logo = page.locator("header .kmt-logo-enter").filter({ visible: true });
      await expect(logo).toHaveCSS("animation-name", "none");
      if (width >= 1280) {
        const nav = page.getByRole("navigation", { name: getPublicContent(locale).shell.mainNavLabel }).filter({ visible: true });
        await expect(nav).toBeVisible();
        const box = await nav.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
      await page.screenshot({ path: info.outputPath(`home-${theme}-${width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload({ waitUntil: "networkidle" });
    const logo = page.locator("header .kmt-logo-enter").filter({ visible: true });
    await expect(logo).toHaveCSS("animation-duration", "0.3s");
    await expect(logo).toHaveCSS("animation-iteration-count", "1");
  });

  test(`${locale}: service slugs and legacy titles reach the existing booking category`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, body: "" }));
    const sent: Array<{ draft: { serviceCategory: string } }> = [];
    await page.route("**/api/public/consultations/assistant", async route => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({ status: 503, json: { error: { code: "SERVICE_UNAVAILABLE" } } });
    });
    const cases: Array<{ query: string; category: string }> = getPublicContent(locale).legalServices.map(service => ({ query: service.slug, category: service.category }));
    cases.push({ query: "contract-drafting", category: "corporate-business-services" });
    cases.push({ query: locale === "ar" ? "الشركات والعقود التجارية" : "Companies & Commercial Contracts", category: "corporate-business-services" });
    for (const item of cases) {
      await page.goto(`${prefix}/book-consultation?service=${encodeURIComponent(item.query)}`, { waitUntil: "networkidle" });
      await page.getByTestId(`booking-language-${locale}`).click();
      const count = sent.length;
      await page.locator('input[name="chatMessage"]').fill("Synthetic unsent intake test");
      await page.getByTestId("booking-chat-composer").locator('button[type="submit"]').click();
      await expect.poll(() => sent.length).toBe(count + 1);
      expect(sent.at(-1)?.draft.serviceCategory).toBe(item.category);
    }
    await page.goto(`${prefix}/services/contract-drafting`, { waitUntil: "networkidle" });
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(`${prefix}/services/contracts`, "http://127.0.0.1:3000").href);
  });
}
