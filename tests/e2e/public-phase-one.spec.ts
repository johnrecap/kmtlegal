import { expect, test } from "@playwright/test";
import { getPublicContent } from "../../src/content/public-content";
import { publicOfficeProfile } from "../../src/content/public-office-profile";

test.describe.configure({ mode: "parallel" });

for (const locale of ["ar", "en"] as const) {
  const content = getPublicContent(locale);
  const local = (path: string) => locale === "ar" ? `/ar${path === "/" ? "" : path}` : path;
  test(`${locale}: menu, touch targets and enlarged text`, async ({ page }, info) => {
    test.setTimeout(180_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of ["light", "dark"]) for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(local("/"), { waitUntil: "networkidle" });
      await page.evaluate(value => localStorage.setItem("kmt-theme", value), theme);
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveClass(theme);
      await expect(page.getByRole("button", { name: content.shell.themeToggleLabel }).filter({ visible: true })).toBeVisible();
      await page.screenshot({ path: info.outputPath(`home-${theme}-${width}.png`) });
      const dock = page.getByTestId(width < 768 ? "public-floating-dock-mobile" : "public-floating-dock-desktop");
      for (const action of await dock.getByRole("link").all()) {
        const box = await action.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      if (width === 390) {
        await page.getByRole("button", { name: content.shell.compactNavLabel }).click();
        const menu = page.getByRole("dialog");
        await expect(menu).toHaveCSS("opacity", "1");
        await expect(menu.getByRole("button", { name: content.shell.closeNavigation })).toBeVisible();
        await expect(menu.getByRole("link", { name: content.shell.clientLoginCta })).toBeVisible();
        await page.keyboard.press("Tab");
        expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true);
        await page.screenshot({ path: info.outputPath(`menu-${theme}.png`) });
        await page.keyboard.press("Escape");
        await expect(menu).toHaveCount(0);
        await page.getByRole("button", { name: content.shell.compactNavLabel }).click();
        await menu.getByRole("button", { name: content.shell.closeNavigation }).click();
        await expect(menu).toHaveCount(0);
      }
      await page.goto(local("/contact"), { waitUntil: "networkidle" });
      await page.screenshot({ path: info.outputPath(`contact-${theme}-${width}.png`) });
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
  const paths = ["/", "/services", ...content.legalServices.map(s => `/services/${s.slug}`), "/team", ...content.lawyers.map(p => `/team/${p.slug}`), "/contact", "/book-consultation", "/privacy", "/terms"];
  for (const theme of ["light", "dark"]) for (const width of [360, 390, 768, 1024, 1440]) {
    test(`${locale} ${theme} ${width}: public layout, contacts and SEO`, async ({ page }, info) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      const errors: string[] = [];
      page.on("pageerror", e => errors.push(e.message));
      for (const path of paths) {
        const response = await page.goto(local(path), { waitUntil: "networkidle" });
        expect(response?.status(), path).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
        await expect(page.locator("html")).toHaveClass(theme);
        await expect(page.locator("h1"), path).toHaveCount(1);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S.{20,}/);
        // Next may serialize the origin without a trailing slash in an optimized build.
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(new URL(canonical!).href).toBe(new URL(local(path), info.project.use.baseURL).href);
        await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveCount(1);
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
        await expect(page.locator('footer a[href="tel:+201117416666"]')).toHaveText(publicOfficeProfile.phoneDisplay);
        await expect(page.locator('footer a[href="mailto:contact@kmtlegal.org"]')).toHaveText(publicOfficeProfile.email);
        await expect(page.locator('a[href*="kmtlegal.com"]')).toHaveCount(0);
        if (path === "/book-consultation") await expect(page.getByTestId("public-floating-dock")).toHaveCount(0);
        else {
          const dock = page.getByTestId(width < 768 ? "public-floating-dock-mobile" : "public-floating-dock-desktop");
          await expect(dock).toBeVisible();
          await expect(dock.getByRole("link")).toHaveCount(2);
          await expect(dock.locator(`a[href="${publicOfficeProfile.whatsappHref}"]`)).toBeVisible();
        }
        if (path === "/") await expect(page.locator("h1")).toHaveAttribute("aria-label", content.home.heroTitle);
        await page.screenshot({ path: info.outputPath(`${path.replaceAll("/", "_") || "home"}.png`), fullPage: true });
        // Check the compressed header too, rather than only the initial viewport.
        await page.evaluate(() => window.scrollTo(0, 600));
        await page.waitForTimeout(250);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} scrolled`).toBe(true);
      }
      expect(errors).toEqual([]);
    });
  }

  test(`${locale}: contact rejection preserves draft and retry succeeds`, async ({ page }) => {
    const copy = content.contactForm;
    await page.setViewportSize({ width: 390, height: 844 });
    let attempts = 0;
    await page.route("**/api/public/contact?**", async route => {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.fulfill(attempts === 1 ? { status: 503, json: { error: { code: "UNAVAILABLE" } } } : { status: 201, json: { requestId: "phase-one-synthetic" } });
    });
    await page.goto(local("/contact"));
    const form = page.getByTestId("contact-form");
    await expect(form).toHaveAttribute("data-hydrated", "true");
    await form.locator('input[name="fullName"]').fill("Example Client");
    await form.locator('input[name="email"]').fill("phase-one@example.invalid");
    await form.locator('textarea[name="message"]').fill("Synthetic contact recovery check.");
    await form.locator('input[type="checkbox"]').check();
    const submit = form.getByRole("button", { name: copy.submit });
    await submit.click();
    await expect(form).toHaveAttribute("aria-busy", "true");
    await expect(form.getByRole("alert")).toHaveText(copy.fallbackError);
    await expect(form.locator('textarea[name="message"]')).toHaveValue("Synthetic contact recovery check.");
    await submit.click();
    await expect(form.getByRole("status")).toHaveText(copy.success);
    expect(attempts).toBe(2);
  });

  test(`${locale}: mobile keyboard viewport, navigation and utility pages`, async ({ page }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(local("/book-consultation"));
    await expect(page.getByTestId("consultation-assistant")).toHaveAttribute("data-hydrated", "true");
    await page.getByTestId(`booking-language-${locale}`).click();
    const input = page.locator('input[name="chatMessage"]');
    await input.fill("Synthetic unsent booking question");
    await input.focus();
    await page.setViewportSize({ width: 390, height: 400 });
    await expect.poll(async () => {
      const box = await input.boundingBox();
      return box !== null && box.y >= 0 && box.y + box.height <= 400;
    }).toBe(true);
    await expect(input).toHaveValue("Synthetic unsent booking question");
    await page.screenshot({ path: info.outputPath("keyboard-viewport.png") });
    await page.setViewportSize({ width: 390, height: 844 });
    const language = page.getByTestId("public-language-switch").filter({ visible: true });
    await language.click();
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "ltr" : "rtl");
    await expect(page.locator('input[name="chatMessage"]')).toHaveValue("Synthetic unsent booking question");

    for (const path of ["/client-account/setup", "/payment/consultation/return"]) {
      await page.goto(local(path) + "?token=phase-one-synthetic");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S.{20,}/);
      const otherLocaleLink = page.getByTestId("public-language-switch").filter({ visible: true });
      await expect(otherLocaleLink).toHaveAttribute("href", /token=phase-one-synthetic/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: info.outputPath(path.replaceAll("/", "_") + ".png"), fullPage: true });
    }
  });
}
