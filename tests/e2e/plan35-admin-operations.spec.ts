import { expect, test, type Locator, type Page } from "@playwright/test";
import { PLAN35_IMPLEMENTED_ADMIN_ROUTES, PLAN35_PLANNED_ADMIN_ROUTES } from "../fixtures/plan35-admin-route-fixtures";
import { PLAN35_ROLE_KEYS, type Plan35RoleKey } from "../fixtures/plan35-role-fixtures";
import { configuredPlan35StorageState } from "./plan35-auth-state";

const officeAdminStorageState = configuredPlan35StorageState("officeAdmin");
const surfacePath = officeAdminStorageState ? "/admin" : process.env.PLAN35_E2E_FALLBACK_PATH ?? "/product-system";
const personaStorageStates = Object.fromEntries(
  PLAN35_ROLE_KEYS.map((roleKey) => [roleKey, configuredPlan35StorageState(roleKey)])
) as Record<Plan35RoleKey, string | null>;
const hasAllPersonaStorageStates = PLAN35_ROLE_KEYS.every((roleKey) => Boolean(personaStorageStates[roleKey]));
const us3DisposableBrowserEnabled = Boolean(
  officeAdminStorageState &&
  process.env.PLAN35_ALLOW_DB_FIXTURES === "true" &&
  process.env.PLAN35_US3_E2E === "true"
);
const expectedNotificationTitles = (process.env.PLAN35_US3_NOTIFICATION_TITLES ?? "")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);

if (officeAdminStorageState) test.use({ storageState: officeAdminStorageState });

test.describe("PLAN-35 admin responsive accessibility characterization", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.annotations.push({
      type: "local-verification",
      description: "The T046-T049 shell behavior is green; deterministic screenshot acceptance remains owned by T112."
    });
    testInfo.annotations.push({ type: "auth-state", description: officeAdminStorageState ? "Disposable Office Admin storage state" : "Collection-safe product-system fallback" });
    await loadSurface(page);
  });

  test("has no duplicate IDs or broken label, help, and error references", async ({ page }) => {
    const result = await page.locator("body").evaluate(() => {
      const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]"), (element) => element.id);
      const counts = new Map<string, number>();
      ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
      return {
        duplicateIds: [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id).sort(),
        brokenLabels: Array.from(document.querySelectorAll<HTMLLabelElement>("label[for]")).map((label) => label.htmlFor).filter((id) => id && !document.getElementById(id)),
        brokenDescriptions: Array.from(document.querySelectorAll<HTMLElement>("[aria-describedby]")).flatMap((element) => (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean)).filter((id) => !document.getElementById(id))
      };
    });
    expect(result).toEqual({ duplicateIds: [], brokenLabels: [], brokenDescriptions: [] });
  });

  test("opens mobile navigation from the keyboard as a native modal dialog", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadSurface(page);
    const { trigger, dialog } = await openMobileNavigation(page);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(dialog).toHaveJSProperty("open", true);
    expect(await dialog.evaluate((element) => element.tagName)).toBe("DIALOG");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  });

  test("contains focus, locks scroll, closes on Escape, and restores trigger focus", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadSurface(page);
    const { trigger, dialog } = await openMobileNavigation(page);
    const contained = await page.evaluate(() => {
      const modal = document.querySelector<HTMLDialogElement>("dialog[open]");
      const outside = Array.from(document.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).find((item) => modal && !modal.contains(item));
      outside?.focus();
      return Boolean(modal?.contains(document.activeElement));
    });
    const overflow = await page.evaluate(() => [getComputedStyle(document.body).overflow, getComputedStyle(document.documentElement).overflow]);
    expect(contained).toBe(true);
    expect(overflow).toEqual(expect.arrayContaining([expect.stringMatching(/hidden|clip/)]));
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await trigger.evaluate((element) => element === document.activeElement)).toBe(true);
  });

  test("anchors mobile navigation to logical inline-start in RTL", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadSurface(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    const { dialog } = await openMobileNavigation(page);
    const box = await dialog.boundingBox();
    expect(await dialog.evaluate((element) => getComputedStyle(element).direction)).toBe("rtl");
    expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) - 390)).toBeLessThanOrEqual(2);
  });

  test("keeps mobile navigation controls at least 44 by 44 CSS pixels", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadSurface(page);
    const { trigger, dialog } = await openMobileNavigation(page);
    const sizes = await dialog.locator('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])').evaluateAll((elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      }).map((element) => { const rect = element.getBoundingClientRect(); return { width: rect.width, height: rect.height }; })
    );
    const triggerBox = await trigger.boundingBox();
    expect(sizes.length).toBeGreaterThan(0);
    expect(sizes.filter(({ width, height }) => width < 44 || height < 44)).toEqual([]);
    expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("provides distinct accessible names for navigation, filter, and search regions", async ({ page }) => {
    const regions = await page.locator('nav,[role="navigation"],[role="search"]').evaluateAll((elements) => elements.map((element) => ({
      name: element.getAttribute("aria-label") ?? (element.getAttribute("aria-labelledby") ? document.getElementById(element.getAttribute("aria-labelledby") ?? "")?.textContent?.trim() ?? "" : "")
    })));
    const names = regions.map(({ name }) => name).filter(Boolean);
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.filter(({ name }) => !name)).toEqual([]);
    expect(new Set(names).size).toBe(names.length);
  });

  test("switches from mobile navigation at 1023px to desktop navigation at 1024px", async ({ page }) => {
    await page.setViewportSize({ width: 1023, height: 768 });
    await loadSurface(page);
    const trigger = mobileNavigationTrigger(page);
    await expect(trigger).toBeVisible();
    expect(await visibleCount(dashboardNavigation(page))).toBe(0);
    await page.setViewportSize({ width: 1024, height: 768 });
    await loadSurface(page);
    await expect(trigger).not.toBeVisible();
    expect(await visibleCount(dashboardNavigation(page))).toBeGreaterThan(0);
  });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 1023, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    test(`does not create document overflow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await loadSurface(page);
      const size = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
    });
  }
});

test.describe("PLAN-35 nineteen-route permission-aware workspace matrix", () => {
  test.skip(
    !hasAllPersonaStorageStates,
    "Requires disposable authenticated storage states for Lawyer, Secretary, Office Admin, Marketing Staff, and Super Admin."
  );

  for (const roleKey of PLAN35_ROLE_KEYS) {
    test(`${roleKey} discovery matches direct page and API authorization`, async ({ browser }, testInfo) => {
      const baseURL = String(testInfo.project.use.baseURL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000");
      const context = await browser.newContext({ baseURL, storageState: personaStorageStates[roleKey]! });
      try {
        const page = await context.newPage();
        await expectWorkspaceDiscovery(page, roleKey);
        await expectDirectAuthorization(page, roleKey);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe("PLAN-35 contact triage and complete notification center", () => {
  test.skip(
    !us3DisposableBrowserEnabled,
    "Requires an explicitly opted-in disposable database plus an authenticated Office Admin storage state."
  );

  test("submits a public contact and reaches triage in one shell navigation action", async ({ page }, testInfo) => {
    testInfo.annotations.push({
      type: "database-prerequisite",
      description: "T057 is collected only against disposable synthetic data; production databases are forbidden."
    });
    const marker = `PLAN35-US3-${testInfo.workerIndex}-${Date.now()}`;
    const response = await page.request.post("/api/public/contact?locale=ar", {
      data: {
        locale: "ar",
        fullName: marker,
        email: `plan35.us3.${Date.now()}@example.invalid`,
        phone: "+201550000035",
        topic: "documents",
        message: `${marker} رسالة اصطناعية لاختبار وصول نموذج التواصل إلى قائمة المراجعة فقط.`,
        consent: true
      }
    });
    expect(response.status()).toBe(201);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    const contactNavigation = page
      .getByTestId("dashboard-desktop-navigation")
      .locator('a[href="/admin/contact-messages"]');
    await expect(contactNavigation).toBeVisible();
    await contactNavigation.click();
    await expect(page).toHaveURL(/\/admin\/contact-messages/);

    await page.getByRole("search", { name: "فلاتر رسائل التواصل" }).getByRole("searchbox").fill(marker);
    await page.getByRole("button", { name: "تطبيق" }).click();
    await expect(page.getByText(marker, { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "تحديد كمراجعة" }).first().click();
    await expect(page.getByText("تم تحديث حالة الرسالة.", { exact: true })).toBeVisible();
  });

  test("loads every prepared generic notification once across opaque cursor pages", async ({ page }) => {
    test.skip(
      expectedNotificationTitles.length < 21,
      "Set PLAN35_US3_NOTIFICATION_TITLES to at least 21 pipe-separated synthetic titles prepared for the Office Admin persona."
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/notifications", { waitUntil: "domcontentloaded" });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const missing = await missingExpectedTitles(page, expectedNotificationTitles);
      if (!missing.length) break;
      const loadMore = page.getByRole("button", { name: "تحميل المزيد" });
      if (!(await loadMore.isVisible().catch(() => false))) break;
      await loadMore.click();
    }

    for (const title of expectedNotificationTitles) {
      await expect(page.getByText(title, { exact: true })).toHaveCount(1);
    }
  });
});

async function loadSurface(page: Page) {
  const response = await page.goto(surfacePath, { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();
  expect(response?.status() ?? 500).toBeLessThan(500);
  if (officeAdminStorageState) expect(new URL(page.url()).pathname).not.toBe("/login");
}

async function openMobileNavigation(page: Page) {
  const trigger = mobileNavigationTrigger(page);
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: /التنقل|القائمة/ }).first();
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
}

async function expectWorkspaceDiscovery(page: Page, roleKey: Plan35RoleKey) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  for (const route of PLAN35_IMPLEMENTED_ADMIN_ROUTES) {
    const expectedCount = route.defaultAccess[roleKey] ? 1 : 0;
    await expect(page.getByTestId("dashboard-desktop-navigation").locator(`a[href="${route.href}"]`)).toHaveCount(expectedCount);
  }
  for (const route of PLAN35_PLANNED_ADMIN_ROUTES) {
    await expect(page.locator(`a[href="${route.href}"]`)).toHaveCount(0);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  const { dialog } = await openMobileNavigation(page);
  for (const route of PLAN35_IMPLEMENTED_ADMIN_ROUTES) {
    const expectedCount = route.defaultAccess[roleKey] ? 1 : 0;
    await expect(dialog.locator(`a[href="${route.href}"]`)).toHaveCount(expectedCount);
  }
}

async function expectDirectAuthorization(page: Page, roleKey: Plan35RoleKey) {
  for (const route of PLAN35_IMPLEMENTED_ADMIN_ROUTES) {
    const allowed = route.defaultAccess[roleKey];
    const apiResponse = route.apiMethod === "POST"
      ? await page.request.post(route.apiProbe, { data: route.apiBody })
      : await page.request.get(route.apiProbe);
    expect(apiResponse.status(), `${roleKey}:${route.id}:api`).toBe(allowed ? route.allowedApiStatus ?? 200 : 403);

    const pageResponse = await page.goto(route.href, { waitUntil: "domcontentloaded" });
    expect(pageResponse?.status() ?? 500, `${roleKey}:${route.id}:page`).toBeLessThan(500);
    const deniedState = page.getByTestId("admin-permission-denied");
    if (allowed) {
      await expect(deniedState).toHaveCount(0);
    } else {
      await expect(deniedState).toBeVisible();
      await expect(deniedState).not.toContainText(/[a-z]+\.[a-z]+\.[a-z]+/i);
      await expect(deniedState.getByRole("link", { name: /مساحة العمل|الرئيسية/ })).toBeVisible();
    }
  }
}

function mobileNavigationTrigger(page: Page) { return page.getByRole("button", { name: /التنقل|القائمة الرئيسية|قائمة الإدارة/ }).first(); }
function dashboardNavigation(page: Page) { return page.getByRole("navigation", { name: /لوحة التحكم|الإدارة|التنقل/ }); }
async function visibleCount(locator: Locator) {
  let visible = 0;
  for (let index = 0; index < await locator.count(); index += 1) if (await locator.nth(index).isVisible()) visible += 1;
  return visible;
}

async function missingExpectedTitles(page: Page, titles: string[]) {
  const missing: string[] = [];
  for (const title of titles) {
    if ((await page.getByText(title, { exact: true }).count()) === 0) missing.push(title);
  }
  return missing;
}
