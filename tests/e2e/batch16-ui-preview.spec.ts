import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const screenshotDirectory = path.join(
  process.cwd(),
  "docs",
  "reviews",
  "2026-09-13",
  "batch16",
  "screenshots"
);

async function openPreview(page: Page) {
  await page.goto("/preview/ui", { waitUntil: "domcontentloaded" });
  await expect(page.locator('main[data-preview-ready="true"]')).toBeVisible();
  await expect(page.locator('[data-preview-view="home"]')).toBeVisible();
}

async function selectView(page: Page, name: string, view: "home" | "service" | "booking") {
  await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
  await expect(page.locator(`[data-preview-view="${view}"]`)).toBeVisible();
}

async function loadLazyImages(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 400);
    const initialHeight = document.documentElement.scrollHeight;
    for (let y = 0; y < initialHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 35));
    }
    const images = Array.from(document.images);
    await Promise.race([
      Promise.all(images.map((image) => image.decode().catch(() => undefined))),
      new Promise((resolve) => window.setTimeout(resolve, 2_000))
    ]);
    window.scrollTo(0, 0);
  });
}

test("isolated public preview preserves an honest, resilient draft and renders the full matrix", async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(screenshotDirectory, { recursive: true });

  const writeRequests: string[] = [];
  const apiRequests: string[] = [];
  const runtimeErrors: string[] = [];
  page.on("request", (request) => {
    const method = request.method();
    const url = request.url();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) writeRequests.push(`${method} ${url}`);
    if (/\/api\/|booking|payment|provider/i.test(new URL(url).pathname)) apiRequests.push(`${method} ${url}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await openPreview(page);
  await selectView(page, "Service detail", "service");
  await selectView(page, "Request a consultation", "booking");

  const desktopSummary = page.locator('[data-preview-summary="desktop"]');
  await expect(desktopSummary.getByText("Not chosen", { exact: true })).toHaveCount(2);

  await desktopSummary.getByRole("button", { name: "Edit: Sample appointment window" }).click();
  await expect(page.locator('[data-preview-stage="service"]').first()).toBeFocused();
  await expect(page.getByRole("button", { name: "Confirm demo request" })).toHaveCount(0);

  const serviceChoices = page.locator('[data-preview-stage="service"]');
  const firstService = (await serviceChoices.first().textContent())?.trim() ?? "";
  await serviceChoices.first().click();
  await page.locator('[data-preview-stage="method"]').filter({ hasText: /^Phone$/ }).click();
  await page.locator('[data-preview-stage="details"]').fill("   Contract review needed before 21 September.   ");
  await page.getByRole("button", { name: "Choose a sample time" }).click();
  await page.locator('[data-preview-stage="slot"]').filter({ hasText: /^12:30$/ }).click();

  await expect(desktopSummary.getByText("Contract review needed before 21 September.", { exact: true })).toBeVisible();
  await expect(desktopSummary.getByText(firstService, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm demo request" })).toBeEnabled();

  await page.getByRole("button", { name: "Simulate temporary error" }).click();
  const bookingAlert = page.locator('[data-preview-view="booking"] p[role="alert"]');
  await expect(bookingAlert).toContainText("Your answers are still here");
  await expect(desktopSummary.getByText("12:30", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(bookingAlert).toHaveCount(0);
  await expect(desktopSummary.getByText("12:30", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Simulate unavailable time" }).click();
  await expect(bookingAlert).toContainText("no longer available");
  await expect(page.locator('[data-preview-stage="slot"]').filter({ hasText: /^12:30$/ })).toHaveCount(0);
  await expect(page.getByText("Contract review needed before 21 September.", { exact: true }).first()).toBeVisible();
  await page.locator('[data-preview-stage="slot"]').filter({ hasText: /^10:00$/ }).click();
  await page.getByRole("button", { name: "Confirm demo request" }).click();
  await expect(page.getByRole("status")).toContainText("No request, appointment, payment, or reference has been created");

  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("main")).toHaveAttribute("dir", "rtl");
  await expect(desktopSummary.getByText("10:00", { exact: true })).toBeVisible();
  await expect(desktopSummary.getByText("Contract review needed before 21 September.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();

  await desktopSummary.getByRole("button", { name: "Edit: Meeting preference" }).click();
  await expect(page.locator('[data-preview-stage="method"]').first()).toBeFocused();
  await page.locator('[data-preview-stage="method"]').filter({ hasText: /^Office visit$/ }).click();
  await expect(page.locator('[data-preview-stage="slot"]').first()).toBeFocused();
  await expect(page.getByText("Contract review needed before 21 September.", { exact: true }).first()).toBeVisible();
  await page.locator('[data-preview-stage="slot"]').filter({ hasText: /^15:00$/ }).click();

  await desktopSummary.getByRole("button", { name: "Edit: Matter area" }).click();
  const secondService = (await page.locator('[data-preview-stage="service"]').nth(1).textContent())?.trim() ?? "";
  await page.locator('[data-preview-stage="service"]').nth(1).click();
  await expect(page.locator('[data-preview-stage="slot"]').first()).toBeFocused();
  await expect(desktopSummary.getByText("—", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Contract review needed before 21 September.", { exact: true }).first()).toBeVisible();
  await page.locator('[data-preview-stage="slot"]').filter({ hasText: /^10:00$/ }).click();

  await selectView(page, "Service detail", "service");
  await page.locator('[data-preview-view="service"] button').last().click();
  await selectView(page, "Request a consultation", "booking");
  await expect(desktopSummary.getByText(secondService, { exact: true })).toBeVisible();
  await expect(desktopSummary.getByText("10:00", { exact: true })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await openPreview(page);
  await selectView(page, "Request a consultation", "booking");
  const summaryOpener = page.getByRole("button", { name: "Review request" });
  const dialog = page.getByRole("dialog", { name: "Request summary" });
  await summaryOpener.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(summaryOpener).toBeFocused();
  await summaryOpener.click();
  await dialog.getByRole("button", { name: "Edit: Sample appointment window" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-preview-stage="service"]').first()).toBeFocused();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    const original = window.scrollTo.bind(window);
    Object.defineProperty(window, "__previewScrollBehavior", { configurable: true, writable: true, value: "" });
    window.scrollTo = ((optionsOrX: ScrollToOptions | number, y?: number) => {
      if (typeof optionsOrX === "object") {
        (window as typeof window & { __previewScrollBehavior: string }).__previewScrollBehavior = optionsOrX.behavior ?? "";
      }
      return typeof optionsOrX === "number" ? original(optionsOrX, y ?? 0) : original(optionsOrX);
    }) as typeof window.scrollTo;
  });
  await selectView(page, "Service detail", "service");
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __previewScrollBehavior: string }).__previewScrollBehavior)).toBe("auto");

  const widths = [390, 768, 1440] as const;
  const locales = ["en", "ar"] as const;
  const views = ["home", "service", "booking"] as const;
  const names = {
    en: { home: "Home", service: "Service detail", booking: "Request a consultation" },
    ar: { home: "الرئيسية", service: "تفاصيل الخدمة", booking: "طلب استشارة" }
  } as const;
  const summaryNames = { en: "Review request", ar: "مراجعة الطلب" } as const;
  const sampleDetails = {
    en: "Sample contract review context retained in this local preview.",
    ar: "سياق نموذجي لمراجعة عقد محفوظ داخل هذه المعاينة المحلية."
  } as const;

  for (const width of widths) {
    for (const locale of locales) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await openPreview(page);
      if (locale === "ar") await page.getByRole("button", { name: "العربية" }).click();
      for (const view of views) {
        if (view !== "home") await selectView(page, names[locale][view], view);
        if (view === "home") await loadLazyImages(page);
        if (view === "booking") {
          await page.locator('[data-preview-stage="service"]').first().click();
          await page.locator('[data-preview-stage="method"]').first().click();
          await page.locator('[data-preview-stage="details"]').fill(sampleDetails[locale]);
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
          if (width === 390) await page.getByRole("button", { name: summaryNames[locale] }).click();
        }
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({
          fullPage: true,
          path: path.join(screenshotDirectory, `${view}-${locale}-${width}.jpg`),
          quality: 78,
          type: "jpeg"
        });
      }
    }
  }

  expect(writeRequests).toEqual([]);
  expect(apiRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});
