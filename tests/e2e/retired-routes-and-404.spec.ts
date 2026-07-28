import { expect, test, type Page } from "@playwright/test";

const retiredPaths = [
  "/portal",
  "/portal/cases",
  "/api/portal/profile",
  "/product-system",
  "/product-system/cases",
  "/stitch-clone",
  "/stitch-clone/home"
];

async function expectBrandedNotFound(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${path} must preserve the HTTP 404 status`).toBe(404);
  expect(new URL(page.url()).pathname).toBe(path);
  await expect(page.getByTestId("global-not-found")).toBeVisible();
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "الرئيسية" })).toHaveAttribute("href", "/ar");
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /دخول العميل|Client login/ })).toHaveAttribute(
    "href",
    "/login?next=/client"
  );
}

test.describe("retired routes and global 404", () => {
  for (const path of retiredPaths) {
    test(`${path} returns the branded 404 without an auth redirect`, async ({ page }) => {
      await expectBrandedNotFound(page, path);
    });
  }

  test("unknown routes are bilingual, keyboard reachable, and responsive", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expectBrandedNotFound(page, "/does-not-exist-plan-39");

    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("Page not found")).toBeVisible();

    const homeLink = page.getByRole("link", { name: "الرئيسية" });
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  });

  test("product-used archived design imagery remains available", async ({ request }) => {
    const response = await request.get("/stitch-assets/ff4ca4cf707aef0c.png");
    expect(response.status()).toBeLessThan(400);
    expect(response.headers()["cache-control"]).toContain("immutable");
  });
});
