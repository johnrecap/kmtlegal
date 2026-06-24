import { expect, test } from "@playwright/test";

test.describe("DB-backed MVP readiness", () => {
  test.skip(!process.env.DATABASE_URL, "DATABASE_URL is required for DB-backed E2E.");

  test("staff login opens the admin dashboard without 2FA in the installer release", async ({ page }) => {
    await page.goto("/login?next=/admin", { waitUntil: "domcontentloaded" });

    await page.locator('input[name="email"]').fill("office.admin@kmt.local");
    await page.locator('input[name="password"]').fill("KmtLocalDev!2026");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("body")).toContainText(/KMT|لوحة|المكتب/);
  });

  test("client login does not require 2FA and opens the portal", async ({ page }) => {
    await page.goto("/login?next=/portal", { waitUntil: "domcontentloaded" });

    await page.locator('input[name="email"]').fill("client@kmt.local");
    await page.locator('input[name="password"]').fill("KmtLocalDev!2026");
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/portal/);
    await expect(page.locator("body")).toContainText(/KMT|بوابة|القضايا|المستندات/);
  });
});
