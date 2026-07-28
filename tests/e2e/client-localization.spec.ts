import { expect, test, type Page } from "@playwright/test";

const clientDestinations = [
  "/client",
  "/client/cases",
  "/client/court-dates",
  "/client/files",
  "/client/payments",
  "/client/assistant",
  "/client/profile"
] as const;

test.describe("localized client sign-in", () => {
  test("renders Arabic and English from the same login URL with document-level direction", async ({ page }) => {
    await page.goto("/login?next=/client&locale=ar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { name: "بوابة واحدة للعميل وفريق المكتب" })).toBeVisible();
    await expect(page.getByRole("button", { name: "دخول" })).toBeVisible();

    const englishSwitch = page.getByRole("link", { name: /English/ });
    await englishSwitch.focus();
    await expect(englishSwitch).toBeFocused();
    await englishSwitch.click();

    await expect(page).toHaveURL(/\/login\?.*locale=en/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: "One gateway for clients and the office team" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
test.describe("authenticated client locale persistence", () => {
  test.skip(
    process.env.PLAN39_ALLOW_DB_FIXTURES !== "true" || !process.env.DATABASE_URL,
    "Requires the disposable seeded client account and PLAN39_ALLOW_DB_FIXTURES=true."
  );

  test("switches every client destination to English, survives a new session, and restores the fixture", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await signInClient(page, "ar");

    try {
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await page.getByRole("button", { name: /اللغة: English/ }).click();
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

      await page.setViewportSize({ width: 390, height: 844 });
      for (const destination of clientDestinations) {
        const response = await page.goto(destination, { waitUntil: "domcontentloaded" });
        expect(response?.status() ?? 500, destination).toBeLessThan(500);
        expect(new URL(page.url()).pathname, destination).toBe(destination);
        await expect(page.locator("html"), destination).toHaveAttribute("lang", "en");
        await expect(page.locator("html"), destination).toHaveAttribute("dir", "ltr");
        await expectNoHorizontalOverflow(page, destination);
      }

      await page.request.post("/api/auth/logout");
      await page.context().clearCookies();
      await signInClient(page, "en");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
      expect(consoleErrors).toEqual([]);
      expect(failedResponses).toEqual([]);
    } finally {
      await page.request.patch("/api/client/preferences", { data: { locale: "ar" } }).catch(() => null);
    }
  });
});

async function signInClient(page: Page, locale: "ar" | "en") {
  await page.goto(`/login?next=/client&locale=${locale}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill("client@kmt.local");
  await page.locator('input[name="password"]').fill("KmtLocalDev!2026");
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/client(?:\/|$)/);
}

async function expectNoHorizontalOverflow(page: Page, destination: string) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(widths.scroll, destination).toBeLessThanOrEqual(widths.client + 1);
}
