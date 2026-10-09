import { expect, test } from "@playwright/test";
import { businessDeskCopy } from "../../src/content/business-desk-copy";
for (const locale of ["ar", "en"] as const) test(`${locale}: company subscriptions, managed services and secure verification are responsive`, async ({ page }) => {
  test.setTimeout(240000);
  const prefix = locale === "ar" ? "/ar" : "";
  for (const route of ["", "/services/company-formation", "/services/corporate-business-services", "/services/contracts", "/industries"]) for (const theme of ["light", "dark"]) for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    await page.goto(`${prefix}${route}` || "/", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator('a[href^="https://wa.me/201117416666?text="]').first()).toBeVisible();
    if (width === 390 && route === "/services/corporate-business-services") await page.screenshot({ path: `.playwright/phase-five/business-${locale}-${theme}-390.png`, fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto(`/account/verify#token=${"a".repeat(64)}&locale=${locale}`, { waitUntil: "networkidle" });
  await expect(page.locator('input[type="password"]')).toHaveCount(2);
  expect(new URL(page.url()).hash).toBe("");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
  await page.locator('input[type="password"]').first().focus(); await page.keyboard.press("Tab"); await expect(page.locator('input[type="password"]').last()).toBeFocused();
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(businessDeskCopy[locale]).toBeDefined();
});
