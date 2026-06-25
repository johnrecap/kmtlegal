import { expect, test, type Page, type Response } from "@playwright/test";

const liveBaseUrl = process.env.KMT_LIVE_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "";
const liveAdminEmail = process.env.KMT_LIVE_ADMIN_EMAIL ?? "";
const liveAdminPassword = process.env.KMT_LIVE_ADMIN_PASSWORD ?? "";

const adminPages = [
  "/admin",
  "/admin/consultations",
  "/admin/clients",
  "/admin/cases",
  "/admin/content",
  "/admin/finance",
  "/admin/documents",
  "/admin/reports",
  "/admin/users",
  "/admin/audit-log",
  "/admin/settings"
];

const mobileAdminPages = [
  "/admin",
  "/admin/clients",
  "/admin/consultations",
  "/admin/cases",
  "/admin/content",
  "/admin/finance",
  "/admin/documents",
  "/admin/users"
];
const apiChecks = ["/api/auth/me", "/api/admin/dashboard", "/api/admin/consultations", "/api/admin/content"];
const blockedConsolePatterns = [
  /ChunkLoadError/i,
  /Application error/i,
  /Content Security Policy.*cloudflare/i,
  /Refused to load.*cloudflare/i,
  /Refused to execute script.*_next\/static/i,
  /MIME type.*text\/html/i
];

test.describe("live admin release smoke", () => {
  test.skip(!liveBaseUrl || !liveAdminEmail || !liveAdminPassword, "Set KMT_LIVE_BASE_URL, KMT_LIVE_ADMIN_EMAIL, and KMT_LIVE_ADMIN_PASSWORD to run live admin smoke.");

  test("desktop admin pages load without chunk, static asset, CSP, or dev-copy regressions", async ({ page }) => {
    const issues = collectReleaseIssues(page);
    await loginAsAdmin(page);

    for (const path of adminPages) {
      await visitAdminPage(page, path);
    }

    for (const apiPath of apiChecks) {
      const response = await page.request.get(liveUrl(apiPath));
      expect(response.status(), `${apiPath} should return 200 after admin login`).toBe(200);
    }

    expect(issues()).toEqual([]);
  });

  test.describe("mobile viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("critical admin pages fit without page-level horizontal scroll", async ({ page }) => {
      const issues = collectReleaseIssues(page);
      await loginAsAdmin(page);

      for (const path of mobileAdminPages) {
        await visitAdminPage(page, path);
        const { clientWidth, scrollWidth } = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        expect(scrollWidth, `${path} should not create page-level horizontal scroll at 390px`).toBeLessThanOrEqual(clientWidth + 1);
        if (path === "/admin/clients") {
          await expectAdminClientsMobileSurface(page);
        } else if (path !== "/admin") {
          await expectAdminMobileListSurface(page);
        }
      }

      expect(issues()).toEqual([]);
    });
  });
});

async function loginAsAdmin(page: Page) {
  await page.goto(liveUrl("/login"), { waitUntil: "domcontentloaded" });
  await expect(page.getByText("npm run db:seed")).toHaveCount(0);
  await expect(page.getByText("PostgreSQL")).toHaveCount(0);

  await page.fill('input[name="email"]', liveAdminEmail);
  await page.fill('input[name="password"]', liveAdminPassword);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 30_000 });
}

async function visitAdminPage(page: Page, path: string) {
  const response = await page.goto(liveUrl(path), { waitUntil: "domcontentloaded" });

  expect(response?.status(), `${path} should return a successful document response`).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
  await page.waitForTimeout(750);
}

async function expectAdminClientsMobileSurface(page: Page) {
  const filterBar = page.getByRole("search").first();

  await expect(page.getByPlaceholder("ابحث بالاسم أو الهاتف أو البريد")).toBeVisible();
  await expect(filterBar.getByLabel("الحالة")).toBeVisible();
  await expect(filterBar.getByLabel("المصدر")).toBeVisible();
  await expect(filterBar.getByRole("button", { name: "تطبيق" })).toBeVisible();
  await expect(page.getByRole("link", { name: "إضافة عميل" })).toBeVisible();

  const hasEmptyState = await page.getByText("لا توجد ملفات عملاء مطابقة للفلاتر الحالية.").isVisible().catch(() => false);
  const hasMobileOpenAction = await page.getByRole("link", { name: "فتح" }).first().isVisible().catch(() => false);
  expect(hasEmptyState || hasMobileOpenAction, "clients page should show a mobile result card or an empty state").toBe(true);
}

async function expectAdminMobileListSurface(page: Page) {
  const filterBar = page.getByRole("search").first();

  await expect(filterBar).toBeVisible();
  await expect(filterBar.getByRole("button", { name: "تطبيق" })).toBeVisible();

  const hasEmptyState = await page.getByText(/لا توجد|لا توجد عناصر|لا توجد حسابات|لا توجد فواتير|لا توجد مستندات/).first().isVisible().catch(() => false);
  const hasMobileAction = await page.getByRole("link", { name: /فتح|مراجعة|تعديل|تنزيل/ }).first().isVisible().catch(() => false);
  expect(hasEmptyState || hasMobileAction, "admin list pages should show a mobile card/action or an empty state").toBe(true);
}

function collectReleaseIssues(page: Page) {
  const issues: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    const text = message.text();
    if (blockedConsolePatterns.some((pattern) => pattern.test(text))) {
      issues.push(`console: ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    const text = error.message;
    if (blockedConsolePatterns.some((pattern) => pattern.test(text))) {
      issues.push(`pageerror: ${text}`);
    }
  });

  page.on("response", (response) => {
    const issue = staticAssetIssue(response);
    if (issue) {
      issues.push(issue);
    }
  });

  return () => issues;
}

function staticAssetIssue(response: Response) {
  const url = response.url();
  if (!url.includes("/_next/static/")) {
    return null;
  }

  const pathname = new URL(url).pathname;
  const isJavaScript = pathname.endsWith(".js");
  const isCss = pathname.endsWith(".css");
  if (!isJavaScript && !isCss) {
    return null;
  }

  const status = response.status();
  const contentType = response.headers()["content-type"] ?? "";

  if (status >= 400) {
    return `static asset status ${status}: ${url}`;
  }

  if (contentType.includes("text/html")) {
    return `static asset returned HTML: ${url}`;
  }

  if (isJavaScript && !/javascript|ecmascript/i.test(contentType)) {
    return `static JS wrong MIME ${contentType}: ${url}`;
  }

  if (isCss && !/text\/css/i.test(contentType)) {
    return `static CSS wrong MIME ${contentType}: ${url}`;
  }

  return null;
}

function liveUrl(path: string) {
  return new URL(path, liveBaseUrl).toString();
}
