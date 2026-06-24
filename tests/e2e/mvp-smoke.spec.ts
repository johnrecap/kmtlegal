import { expect, test } from "@playwright/test";

const publicSmokePages = ["/", "/contact", "/login", "/privacy", "/terms", "/product-system", "/stitch-clone/home"];

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

  test("protected admin route redirects anonymous users to login", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "domcontentloaded" });

    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/admin");
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
