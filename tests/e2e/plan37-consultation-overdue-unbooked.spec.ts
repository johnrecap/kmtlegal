import { expect, test, type Page } from "@playwright/test";
import { configuredPlan35StorageState } from "./plan35-auth-state";

const storageState = process.env.PLAN37_E2E_STORAGE_STATE ?? configuredPlan35StorageState("officeAdmin");
const allowDisposableFixtures = process.env.PLAN37_ALLOW_DISPOSABLE_FIXTURES === "true";
const consultationId = process.env.PLAN37_UNBOOKED_CONSULTATION_ID;
const lawyerId = process.env.PLAN37_SCHEDULE_LAWYER_ID;
const conflictStartsAt = process.env.PLAN37_CONFLICT_STARTS_AT_LOCAL;
const availableStartsAt = process.env.PLAN37_AVAILABLE_STARTS_AT_LOCAL;
const expectedViews = [
  "current",
  "overdue_unbooked",
  "awaiting_result",
  "missed",
  "successful",
  "no_show",
  "cancelled",
  "all"
] as const;

if (storageState) test.use({ storageState });

test.describe("PLAN-37 overdue-unbooked queue", () => {
  test.skip(!storageState, "Requires an authenticated disposable Office Admin storage state.");

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`keeps the overdue queue shareable, explained, and RTL at ${viewport.width}px`, async ({ page }) => {
      const browserErrors = collectBrowserErrors(page);
      await page.setViewportSize(viewport);
      await page.goto(
        "/admin/consultations?view=current&q=PLAN37&assigned=unassigned&page=4",
        { waitUntil: "networkidle" }
      );

      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      const tabs = page.locator('nav[aria-label] a[href^="/admin/consultations?"][href*="view="]');
      await expect(tabs).toHaveCount(expectedViews.length);
      const hrefs = await tabs.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? "")
      );
      expect(hrefs.map((href) => new URL(href, "http://plan37.local").searchParams.get("view")))
        .toEqual(expectedViews);
      for (const href of hrefs) {
        const search = new URL(href, "http://plan37.local").searchParams;
        expect(search.get("q")).toBe("PLAN37");
        expect(search.get("assigned")).toBe("unassigned");
        expect(search.get("page")).toBe("1");
      }

      await tabs.nth(1).click();
      await expect(page).toHaveURL(/view=overdue_unbooked/);
      await expect(page.getByText(
        "طلبات نشطة مرّت 72 ساعة كاملة على إنشائها ولم يُحجز لها موعد أساسي بعد.",
        { exact: true }
      )).toBeVisible();
      expect(await documentOverflow(page)).toBeLessThanOrEqual(1);
      expect(browserErrors).toEqual([]);
    });
  }
});

test.describe("PLAN-37 atomic initial scheduling", () => {
  test.skip(
    !storageState ||
      !allowDisposableFixtures ||
      !consultationId ||
      !lawyerId ||
      !conflictStartsAt ||
      !availableStartsAt,
    "Requires opted-in disposable overdue/conflict fixtures; production mutation is forbidden."
  );

  test("preserves the form on conflict and schedules a free future slot on mobile", async ({ page }) => {
    const browserErrors = collectBrowserErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/admin/consultations/${consultationId}`, { waitUntil: "networkidle" });

    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: "حفظ الموعد والإسناد" })
    });
    await expect(form).toBeVisible();
    await form.locator('select[name="assignedLawyerId"]').selectOption(lawyerId!);
    await form.locator('input[name="startsAt"]').fill(conflictStartsAt!);
    await form.locator('input[name="durationMinutes"]').fill("75");
    await form.locator('input[name="location"]').fill("PLAN37 disposable room");

    const conflictPromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/schedule`) &&
      response.request().method() === "POST"
    );
    await form.getByRole("button", { name: "حفظ الموعد والإسناد" }).click();
    expect((await conflictPromise).status()).toBe(409);
    await expect(form.locator('select[name="assignedLawyerId"]')).toHaveValue(lawyerId!);
    await expect(form.locator('input[name="startsAt"]')).toHaveValue(conflictStartsAt!);
    await expect(form.locator('input[name="durationMinutes"]')).toHaveValue("75");
    await expect(form.locator('input[name="location"]')).toHaveValue("PLAN37 disposable room");

    await form.locator('input[name="startsAt"]').fill(availableStartsAt!);
    const successPromise = page.waitForResponse((response) =>
      response.url().endsWith(`/api/admin/consultations/${consultationId}/schedule`) &&
      response.request().method() === "POST"
    );
    await form.getByRole("button", { name: "حفظ الموعد والإسناد" }).click();
    expect((await successPromise).status()).toBe(200);
    await expect(page.getByRole("heading", { name: "جدولة الطلب وإسناد محامٍ" })).toHaveCount(0);
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
  return page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
}
