import { expect, test } from "@playwright/test";
import { getPublicContent } from "../../src/content/public-content";

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: representative formation slice`, async ({ page }, info) => {
    test.setTimeout(180_000);
    const prefix = locale === "ar" ? "/ar" : "";
    const events: Array<{ name: string; properties: Record<string, string> }> = [];
    await page.route("**/api/analytics/events", async route => {
      events.push(route.request().postDataJSON());
      await route.fulfill({ status: 202, json: { data: { accepted: true } } });
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of ["dark", "light"]) for (const width of [360, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      events.length = 0;
      const response = await page.goto(`${prefix}/services/company-formation`, { waitUntil: "networkidle" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveText(locale === "ar" ? "تأسيس الشركات" : "Company Formation");
      await expect(page.locator("html")).toHaveClass(theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new URL(`${prefix}/services/company-formation`, info.project.use.baseURL).href);
      await expect(page.locator('link[hreflang="ar"]')).toHaveCount(1);
      await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
      await expect(page.locator("main aside").getByRole("link", { name: getPublicContent(locale).shared.bookConsultation })).toHaveAttribute("href", `${prefix}/book-consultation?service=company-formation`);
      const whatsapp = page.locator('main aside a[href="https://wa.me/201117416666"]');
      await expect(whatsapp).toBeVisible();
      // Exercise the real click listener, intercept navigation so no external message is sent.
      await whatsapp.evaluate(link => link.addEventListener("click", event => event.preventDefault(), { once: true }));
      await whatsapp.click();
      await expect.poll(() => events.filter(event => event.name === "public.contact_clicked").length).toBe(1);
      expect(events.find(event => event.name === "public.contact_clicked")?.properties).toMatchObject({ locale, page: "service", service: "company-formation", channel: "whatsapp", placement: "content" });
      expect(events.filter(event => event.name === "public.page_viewed")).toHaveLength(1);
      const booking = page.locator("main aside").getByRole("link", { name: getPublicContent(locale).shared.bookConsultation });
      await booking.evaluate(link => link.addEventListener("click", event => event.preventDefault(), { once: true }));
      await booking.click();
      await expect.poll(() => events.filter(event => event.name === "public.booking_clicked").length).toBe(1);
      expect(events.find(event => event.name === "public.booking_clicked")?.properties.service).toBe("company-formation");
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath(`formation-${theme}-${width}.png`) });
    }
  });
}
