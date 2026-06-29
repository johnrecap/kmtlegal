import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

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
const arabicResponsivePages = ["/ar", "/ar/services", "/ar/contact", "/ar/book-consultation"];

const publicLuxurySurfacePages = [
  { path: "/services", expectedDir: "ltr", testIds: ["public-directory-filter", "public-directory-card"] },
  { path: "/contact", expectedDir: "ltr", testIds: ["contact-form"] },
  { path: "/book-consultation", expectedDir: "ltr", testIds: ["booking-stepper"] },
  { path: "/ar/services", expectedDir: "rtl", testIds: ["public-directory-filter", "public-directory-card"] },
  { path: "/ar/contact", expectedDir: "rtl", testIds: ["contact-form"] },
  { path: "/ar/book-consultation", expectedDir: "rtl", testIds: ["booking-stepper"] }
];

async function expectNoHorizontalScroll(page: Page, path: string) {
  const { clientWidth, scrollWidth } = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(scrollWidth, `${path} should not create page-level horizontal scroll`).toBeLessThanOrEqual(clientWidth + 1);
}

async function expectDarkLuxurySurface(locator: Locator, label: string) {
  const className = (await locator.getAttribute("class")) ?? "";

  expect(className, `${label} should use the PLAN-28 layered dark surface`).toContain("bg-[linear-gradient");
  expect(className, `${label} should not keep the old light card border`).toContain("border-kmt-gold");
}

async function gotoUntilSurfaceVisible(page: Page, path: string, testId: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(path, { waitUntil: "domcontentloaded" });

    try {
      await expect(page.getByTestId(testId).first(), `${path} ${testId} should render`).toBeVisible({ timeout: 5000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

async function collectAnalyticsEvents(page: Page) {
  const events: string[] = [];

  await page.route("**/api/analytics/events", async (route) => {
    const raw = route.request().postData() ?? "{}";

    try {
      const body = JSON.parse(raw) as { name?: string };
      if (body.name) {
        events.push(body.name);
      }
    } catch {
      // Ignore malformed analytics payloads here; the app treats analytics as best effort.
    }

    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ data: null })
    });
  });

  return events;
}

test.describe("MVP smoke without database", () => {
  for (const path of publicSmokePages) {
    test(`${path} renders with the expected document direction and no console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${path} should not fail before DB-backed actions`).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", expectedDocumentDir(path));
      await expect(page.locator("html")).toHaveAttribute("lang", expectedDocumentLang(path));
      expect(consoleErrors).toEqual([]);
    });
  }

  for (const path of ["/ar", "/ar/services", "/ar/contact", "/ar/book-consultation"]) {
    test(`${path} renders the optional Arabic public route`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${path} should render`).toBeLessThan(400);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
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

  test("public header exposes client login entry point", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const clientLogin = page.getByRole("link", { name: "Client Login" }).first();
    await expect(clientLogin).toBeVisible();
    await expect(clientLogin).toHaveAttribute("href", "/login?next=/client");

    await Promise.all([
      page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("next") === "/client"),
      clientLogin.click()
    ]);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/client");
  });

  test.describe("public mobile responsiveness", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const path of publicResponsivePages) {
      test(`${path} fits a 390px LTR viewport without page-level horizontal scroll`, async ({ page }) => {
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

    for (const path of arabicResponsivePages) {
      test(`${path} fits a 390px RTL viewport without page-level horizontal scroll`, async ({ page }) => {
        const response = await page.goto(path, { waitUntil: "domcontentloaded" });

        expect(response?.status(), `${path} should render on mobile`).toBeLessThan(400);
        await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
        await expect(page.locator("body")).toBeVisible();
        await expect(page.getByRole("heading").first()).toBeVisible();
        await expectNoHorizontalScroll(page, path);
      });
    }
  });

  test.describe("PLAN-28 public luxury surfaces", () => {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900 },
      { name: "mobile", width: 390, height: 844 }
    ]) {
      test(`${viewport.name} listing and form surfaces use dark luxury treatment without overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const { path, expectedDir, testIds } of publicLuxurySurfacePages) {
          await gotoUntilSurfaceVisible(page, path, testIds[0]);

          await expect(page.locator("html")).toHaveAttribute("dir", expectedDir);
          await expectNoHorizontalScroll(page, `${viewport.name} ${path}`);

          for (const testId of testIds) {
            const surface = page.getByTestId(testId).first();
            await expect(surface, `${path} ${testId} should be visible`).toBeVisible();
            await expectDarkLuxurySurface(surface, `${path} ${testId}`);
          }
        }
      });
    }
  });

  test("contact form preserves requestId error output on the dark surface", async ({ page }) => {
    await page.route("**/api/public/contact**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "SERVER_ERROR",
            message: "Contact smoke failure",
            requestId: "req-contact-plan28"
          }
        })
      });
    });

    await gotoUntilSurfaceVisible(page, "/contact", "contact-form");

    const form = page.getByTestId("contact-form");
    await expect(form).toHaveAttribute("data-hydrated", "true");
    await form.locator('input[name="fullName"]').fill("PLAN 28 Visitor");
    await form.locator('input[name="email"]').fill("plan28@example.com");
    await form.locator('textarea[name="message"]').fill("Please contact me about a legal service smoke test.");
    await form.locator('input[type="checkbox"]').check();
    await form.locator('button[type="submit"]').click();

    await expect(form.getByText("req-contact-plan28")).toBeVisible();
  });

  test("booking chat preserves validation, analytics events, and requestId error output", async ({ page }) => {
    const analyticsEvents = await collectAnalyticsEvents(page);

    await page.route("**/api/public/consultations**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Booking smoke failure",
            requestId: "req-booking-plan28"
          }
        })
      });
    });

    await gotoUntilSurfaceVisible(page, "/book-consultation", "booking-stepper");

    const form = page.getByTestId("booking-stepper");
    await expect(form).toHaveAttribute("data-hydrated", "true");

    await form.locator('input[name="chatMessage"]').fill("Will I win this case?");
    await form.locator('button[type="submit"]').last().click();
    await expect(form.getByText("I cannot provide a legal opinion")).toBeVisible();

    await form.locator('button[type="button"]').first().click();
    await form.locator('button[type="submit"]').click();
    await expect(form.getByText("Name and phone are required")).toBeVisible();

    await form.locator('input[name="fullName"]').fill("PLAN 28 Visitor");
    await form.locator('input[name="phone"]').fill("+201000000001");
    await form.locator('input[name="email"]').fill("plan28@example.com");
    await form.locator('button[type="submit"]').click();

    await form.locator('textarea[name="summary"]').fill("This is a sufficiently detailed public consultation summary for the PLAN 28 smoke test.");
    await form.locator('button[type="submit"]').click();

    await page.locator("#booking-consent").check();
    await form.locator('button[type="submit"]').click();

    await expect(form.getByText("req-booking-plan28")).toBeVisible();
    await expect.poll(() => analyticsEvents).toContain("booking.step_viewed");
    await expect.poll(() => analyticsEvents).toContain("booking.submit_attempted");
    await expect.poll(() => analyticsEvents).toContain("booking.submit_failed");
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

  test("homepage does not render stale article or case-study detail links without DB content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator('a[href="/articles/contract-risk-basics"]')).toHaveCount(0);
    await expect(page.locator('a[href="/articles/prepare-consultation-file"]')).toHaveCount(0);
    await expect(page.locator('a[href="/case-studies/anonymous-commercial-dispute"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Contract Risk Basics" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "How To Prepare A Legal Consultation File" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Organizing An Anonymous Commercial Dispute" })).toHaveCount(0);
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

  test("protected client and portal routes redirect anonymous users without chunk errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    await page.goto("/client", { waitUntil: "domcontentloaded" });
    let url = new URL(page.url());
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/client");

    await page.goto("/portal", { waitUntil: "domcontentloaded" });

    url = new URL(page.url());
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

function expectedDocumentDir(path: string) {
  return path === "/ar" ||
    path.startsWith("/ar/") ||
    path.startsWith("/login") ||
    path.startsWith("/product-system") ||
    path.startsWith("/stitch-clone")
    ? "rtl"
    : "ltr";
}

function expectedDocumentLang(path: string) {
  return expectedDocumentDir(path) === "rtl" ? "ar" : "en";
}
