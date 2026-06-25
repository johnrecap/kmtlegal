import { expect, test } from "@playwright/test";

const publicSmokePages = [
  "/",
  "/services",
  "/team",
  "/articles",
  "/case-studies",
  "/media",
  "/contact",
  "/book-consultation",
  "/login",
  "/privacy",
  "/terms",
  "/product-system",
  "/stitch-clone/home"
];

const publicResponsivePages = ["/", "/services", "/team", "/articles", "/case-studies", "/media", "/contact", "/book-consultation"];

test.describe("MVP smoke without database", () => {
  for (const path of publicSmokePages) {
    test(`${path} renders with RTL shell and no console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${path} should not fail before DB-backed actions`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      expect(consoleErrors).toEqual([]);
    });
  }

  test("root response includes security headers", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test.describe("public mobile responsiveness", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const path of publicResponsivePages) {
      test(`${path} fits a 390px viewport without page-level horizontal scroll`, async ({ page }) => {
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });

        expect(response?.status(), `${path} should render on mobile`).toBeLessThan(400);
        await expect(page.locator("body")).toBeVisible();
        await expect(page.getByRole("heading").first()).toBeVisible();

        const { clientWidth, scrollWidth } = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        expect(scrollWidth, `${path} should not create page-level horizontal scroll at 390px`).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  });

  test("favicon resolves without falling through to a 404 page", async ({ request }) => {
    const response = await request.get("/favicon.ico");

    expect(response.status()).toBeLessThan(400);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
  });

  test("homepage rendered article and case-study detail links resolve", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const hrefs = await page.locator('a[href^="/articles/"], a[href^="/case-studies/"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href))
    );

    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), `${href} should resolve when linked from the homepage`).toBeLessThan(400);
    }
  });

  test("login page does not expose local development setup copy", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("npm run db:seed")).toHaveCount(0);
    await expect(page.getByText("PostgreSQL")).toHaveCount(0);
  });

  test("protected admin route redirects anonymous users to login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/admin");
  });

  test("protected portal route redirects anonymous users without chunk errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/portal", { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/portal");
    expect(consoleErrors).toEqual([]);
  });

  test("API mutation rejects cross-origin requests before handler execution", async ({ request }) => {
    const response = await request.post("/api/auth/logout", {
      headers: {
        Origin: "https://evil.example"
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
