import { expect, test, type Page } from "@playwright/test";
import { configuredPlan35StorageState } from "./plan35-auth-state";

const storageState = process.env.PLAN36_E2E_STORAGE_STATE ?? configuredPlan35StorageState("officeAdmin");
const allowDisposableFixtures = process.env.PLAN36_ALLOW_DISPOSABLE_FIXTURES === "true";
const awaitingConsultationId = process.env.PLAN36_AWAITING_CONSULTATION_ID;
const missedConsultationId = process.env.PLAN36_MISSED_CONSULTATION_ID;
const reopenLawyerId = process.env.PLAN36_REOPEN_LAWYER_ID;
const conflictStartsAt = process.env.PLAN36_CONFLICT_STARTS_AT_LOCAL;
const availableStartsAt = process.env.PLAN36_REOPEN_STARTS_AT_LOCAL;
const expectedViews = [
  "current",
  "awaiting_result",
  "missed",
  "successful",
  "no_show",
  "cancelled",
  "all"
] as const;

if (storageState) test.use({ storageState });

test.describe("PLAN-36 consultation outcome queues", () => {
  test.skip(!storageState, "Requires an authenticated disposable Office Admin storage state.");

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`keeps all outcome tabs shareable and RTL at ${viewport.width}px`, async ({ page }) => {
      const browserErrors = collectBrowserErrors(page);
      await page.setViewportSize(viewport);
      await page.goto("/admin/consultations?view=current&q=PLAN36&page=4", { waitUntil: "networkidle" });

      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const tabs = page.locator('nav[aria-label] a[href^="/admin/consultations?"][href*="view="]');
      await expect(tabs).toHaveCount(expectedViews.length);
      const hrefs = await tabs.evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
      expect(hrefs.map((href) => new URL(href, "http://plan36.local").searchParams.get("view"))).toEqual(expectedViews);
      for (const href of hrefs) {
        const search = new URL(href, "http://plan36.local").searchParams;
        expect(search.get("q")).toBe("PLAN36");
        expect(search.get("page")).toBe("1");
      }

      await tabs.nth(2).click();
      await expect(page).toHaveURL(/view=missed/);
      expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
      expect(browserErrors).toEqual([]);
    });
  }
});

test.describe("PLAN-36 manual result confirmation", () => {
  test.skip(
    !storageState || !allowDisposableFixtures || !awaitingConsultationId,
    "Requires an opted-in disposable AWAITING_RESULT consultation fixture; production mutation is forbidden."
  );

  test("records a successful result, rejects a stale editor, and audits the correction", async ({ page, context }) => {
    const consultationId = awaitingConsultationId!;
    const browserErrors = collectBrowserErrors(page);
    const stalePage = await context.newPage();
    const staleBrowserErrors = collectBrowserErrors(stalePage);
    await Promise.all([
      page.goto(`/admin/consultations/${consultationId}`, { waitUntil: "networkidle" }),
      stalePage.goto(`/admin/consultations/${consultationId}`, { waitUntil: "networkidle" })
    ]);

    await page.locator('select[name="status"]').selectOption("SUCCESSFUL");
    await page.locator('select[name="reasonCode"]').selectOption("COMPLETED_AS_SCHEDULED");
    await page.locator('input[name="confirm"]').check();

    const responsePromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/outcome`) &&
      response.request().method() === "POST"
    );
    await page.locator('form:has(select[name="status"]) button[type="submit"]').click();
    expect((await responsePromise).status()).toBe(200);
    await expect(page.getByText("تم تسجيل نتيجة الاستشارة.", { exact: true })).toBeVisible();

    const staleForm = stalePage.locator('form:has(select[name="status"])');
    await staleForm.locator('select[name="status"]').selectOption("NO_SHOW");
    await staleForm.locator('select[name="reasonCode"]').selectOption("CLIENT_NO_SHOW");
    await staleForm.locator('input[name="confirm"]').check();
    const staleResponsePromise = stalePage.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/outcome`) &&
      response.request().method() === "POST"
    );
    await staleForm.locator('button[type="submit"]').click();
    expect((await staleResponsePromise).status()).toBe(409);
    await expect(stalePage.getByText(
      "تغير طلب الاستشارة بعد فتح الصفحة. حدّث الصفحة وراجع أحدث حالة ثم حاول مرة أخرى.",
      { exact: true }
    )).toBeVisible();

    await stalePage.getByRole("button", { name: "تحديث الصفحة" }).click();
    await expect(stalePage.getByText("تصحيح نتيجة الاستشارة", { exact: true })).toBeVisible();
    await staleForm.locator('select[name="status"]').selectOption("NO_SHOW");
    await staleForm.locator('select[name="reasonCode"]').selectOption("CORRECTED_AFTER_VERIFICATION");
    await staleForm.locator('input[name="confirm"]').check();
    const correctionResponsePromise = stalePage.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/outcome`) &&
      response.request().method() === "POST"
    );
    await staleForm.locator('button[type="submit"]').click();
    expect((await correctionResponsePromise).status()).toBe(200);
    await expect(stalePage.getByText(
      "تم تصحيح نتيجة الاستشارة وحفظ سجل تدقيق جديد.",
      { exact: true }
    )).toBeVisible();

    expect(browserErrors).toEqual([]);
    expect(staleBrowserErrors).toEqual([]);
    await stalePage.close();
  });
});

test.describe("PLAN-36 missed consultation recovery", () => {
  test.skip(
    !storageState ||
      !allowDisposableFixtures ||
      !missedConsultationId ||
      !reopenLawyerId ||
      !conflictStartsAt ||
      !availableStartsAt,
    "Requires opted-in disposable missed/conflict fixtures; production mutation is forbidden."
  );

  test("preserves entered values after a conflict and then reopens with a free future slot", async ({ page }) => {
    const consultationId = missedConsultationId!;
    const assignedLawyerId = reopenLawyerId!;
    const conflictingLocalTime = conflictStartsAt!;
    const availableLocalTime = availableStartsAt!;
    const browserErrors = collectBrowserErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/admin/consultations/${consultationId}`, { waitUntil: "networkidle" });

    const form = page.locator('form:has(select[name="assignedLawyerId"])');
    await form.locator('select[name="assignedLawyerId"]').selectOption(assignedLawyerId);
    await form.locator('input[name="startsAt"]').fill(conflictingLocalTime);
    await form.locator('input[name="durationMinutes"]').fill("60");
    await form.locator('textarea[name="note"]').fill("PLAN36 disposable conflict recovery");

    const conflictPromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/reopen`) &&
      response.request().method() === "POST"
    );
    await form.locator('button[type="submit"]').click();
    expect((await conflictPromise).status()).toBe(409);
    await expect(form.locator('input[name="startsAt"]')).toHaveValue(conflictingLocalTime);
    await expect(form.locator('textarea[name="note"]')).toHaveValue("PLAN36 disposable conflict recovery");

    await form.locator('input[name="startsAt"]').fill(availableLocalTime);
    const successPromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/reopen`) &&
      response.request().method() === "POST"
    );
    await form.locator('button[type="submit"]').click();
    expect((await successPromise).status()).toBe(200);
    await expect(page.getByText("تمت إعادة فتح الطلب وجدولة موعد جديد.", { exact: true })).toBeVisible();
    expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
    expect(browserErrors).toEqual([]);
  });
});

function collectBrowserErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function documentOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
