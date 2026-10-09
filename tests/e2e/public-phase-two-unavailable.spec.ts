import { expect, test } from "@playwright/test";
import { publicExpansion } from "../../src/content/public-expansion";
import { getPublicContent } from "../../src/content/public-content";

test.skip(process.env.RUN_PHASE_TWO_UNAVAILABLE !== "true", "Requires a separate local server with DATABASE_URL explicitly empty.");
for (const locale of ["ar", "en"] as const) test(`${locale}: unavailable articles remain distinct from an empty list`, async ({ page, request, baseURL }, info) => {
  expect(new URL(baseURL!).hostname).toBe("127.0.0.1");
  const prefix = locale === "ar" ? "/ar" : "";
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, body: "" }));
  expect((await request.get(`/api/public/articles?locale=${locale}`)).status()).toBe(503);
  await page.goto(`${prefix}/articles`, { waitUntil: "networkidle" });
  await expect(page.getByRole("status")).toContainText(publicExpansion[locale].unavailableTitle);
  await expect(page.getByText(getPublicContent(locale).articlesPage.emptyTitle)).toHaveCount(0);
  await page.getByRole("link", { name: publicExpansion[locale].retry }).click();
  await expect(page.getByRole("status")).toContainText(publicExpansion[locale].unavailableTitle);
  await page.screenshot({ path: info.outputPath(`unavailable-${locale}.png`) });
  await page.goto(`${prefix}/articles/unavailable-fixture`, { waitUntil: "networkidle" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator(`link[hreflang="${locale === "ar" ? "en" : "ar"}"]`)).toHaveCount(0);
});
