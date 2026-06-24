import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const stitchScreens = [
  "home",
  "services",
  "service-corporate-contracts",
  "team",
  "lawyer-profile-karim",
  "book-consultation",
  "case-studies",
  "case-study-commercial-dispute",
  "media",
  "articles",
  "contact",
  "login",
  "portal-dashboard",
  "portal-case-detail",
  "portal-documents",
  "portal-appointments",
  "admin-dashboard",
  "admin-clients",
  "admin-cases",
  "admin-case-detail",
  "admin-calendar",
  "admin-tasks",
  "admin-content-social"
] as const;

const outputDir = path.join(process.cwd(), "test-results", "stitch-clone");

test.describe("Stitch clone screenshots", () => {
  for (const screen of stitchScreens) {
    test(`${screen} mobile 390x844`, async ({ page }) => {
      mkdirSync(outputDir, { recursive: true });
      await page.setViewportSize({ width: 390, height: 844 });
      const response = await page.goto(`/stitch-clone/${screen}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await page.screenshot({
        path: path.join(outputDir, `${screen}-mobile.png`),
        fullPage: true
      });
    });

    test(`${screen} desktop 1440x900`, async ({ page }) => {
      mkdirSync(outputDir, { recursive: true });
      await page.setViewportSize({ width: 1440, height: 900 });
      const response = await page.goto(`/stitch-clone/${screen}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await page.screenshot({
        path: path.join(outputDir, `${screen}-desktop.png`),
        fullPage: true
      });
    });
  }
});
