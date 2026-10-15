import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { defaultConsultationAvailability, addCairoDays, cairoDateString, cairoWeekday } from "../../src/server/consultations/consultation-availability-service";
import { directBookingCopy } from "../../src/content/direct-booking-copy";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import { bookingDateLabel } from "../../src/lib/direct-booking-availability";

test.describe.configure({ mode: "serial" });
for (const locale of ["ar", "en"] as const) test(`${locale}: ordered days, real closed-day reason and safe booking on mobile/desktop`, async ({ page, playwright, baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable synthetic fixture database.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
  test.setTimeout(180000);
  const fixture = JSON.parse(await readFile(".playwright/phase-five/fixtures.json", "utf8"));
  const admin = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL, Cookie: `kmt_session=${fixture.users.admin.token}` } });
  const copy = directBookingCopy[locale];
  const today = cairoDateString(new Date()), closed = addCairoDays(today, 2), open = addCairoDays(today, 3);
  const schedule = { ...defaultConsultationAvailability, minLeadHours: 0, days: defaultConsultationAvailability.days.map(day => ({ ...day,
    enabled: day.weekday !== cairoWeekday(closed), start: "10:00", end: "15:00", modes: ["PHONE"] })),
    directBooking: { published: true, closures: [], roster: defaultConsultationAvailability.days.map(day => ({ weekday: day.weekday, lawyerIds: [fixture.users.lawyer.id] })) } };
  try {
    expect((await admin.patch("/api/admin/consultation-availability", { data: schedule })).status()).toBe(200);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    // Delay one real availability response to verify that it cannot overwrite a newer date selection.
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "POST") {
        const input = route.request().postDataJSON();
        if (input.action === "booking_slots" && input.date === closed) {
          const response = await route.fetch();
          await new Promise(resolve => setTimeout(resolve, 350));
          return route.fulfill({ response });
        }
      }
      return route.continue();
    });
    for (const width of [390, 1440]) {
      // Each scenario is a distinct synthetic visitor; production rate limits remain unchanged.
      await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `192.0.2.${(locale === "ar" ? 60 : 70) + (width === 390 ? 1 : 2)}` });
      await page.context().clearCookies(); await page.setViewportSize({ width, height: 900 });
      await page.goto((locale === "ar" ? "/ar" : "") + "/book-consultation", { waitUntil: "networkidle" });
      await page.getByRole("button", { name: assistantPolicyCopy[locale].begin, exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: copy.scheduleTitle })).toBeVisible();
      await expect(dialog.getByRole("button", { name: copy.chooseNearest, exact: true })).toBeVisible();
      await expect(dialog.getByRole("button", { name: copy.chooseNearest, exact: true })).toBeEnabled();
      await dialog.getByText(copy.weeklyTitle, { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.playwright/ordered-booking/${locale}-${width}-schedule.png` });
      await dialog.getByRole("button", { name: copy.nextDays, exact: true }).click();
      await expect(dialog.getByRole("button", { name: bookingDateLabel(addCairoDays(today, 7), locale), exact: false })).toBeVisible();
      await dialog.getByRole("button", { name: copy.previousDays, exact: true }).click();
      await dialog.getByLabel(copy.name, { exact: true }).fill(locale === "ar" ? "عميل جدول تجريبي" : "Synthetic Schedule Customer");
      await dialog.getByLabel(copy.number, { exact: true }).fill(`0101234${locale === "ar" ? "1" : "2"}${width === 390 ? "111" : "222"}`);
      await dialog.getByLabel(copy.date, { exact: true }).fill(closed);
      await expect(dialog.locator('[role="status"]').filter({ hasText: copy.availabilityReasons.CLOSED_WEEKLY })).toBeVisible();
      await expect(dialog.getByRole("radio")).toHaveCount(0);
      await expect(dialog.getByLabel(copy.consent, { exact: true })).toHaveCount(0);
      await expect(dialog.getByRole("button", { name: copy.callback, exact: true })).toHaveCount(0);
      await dialog.getByText(copy.daysTitle, { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.playwright/ordered-booking/${locale}-${width}-closed.png` });
      const next = await page.request.post("/api/public/assistant/conversation", { data: { action: "booking_slots", date: closed }, headers: { Origin: baseURL } });
      const availability = (await next.json()).data;
      expect(availability.selectedDay.status).toBe("CLOSED_WEEKLY");
      expect(cairoDateString(new Date(availability.nearestSlot.startsAt))).toBe(open);
      await dialog.getByRole("button", { name: copy.chooseNearest, exact: true }).click();
      await expect(dialog.getByLabel(copy.date, { exact: true })).toHaveValue(open);
      await expect(dialog.getByRole("radio").first()).toBeChecked();
      // Rapid changes keep the newer day's time list and preserve the contact fields.
      await dialog.getByLabel(copy.date, { exact: true }).fill(today);
      await dialog.getByLabel(copy.date, { exact: true }).fill(closed);
      await dialog.getByLabel(copy.date, { exact: true }).fill(open);
      await expect(dialog.getByRole("radio").first()).toBeVisible();
      await page.waitForTimeout(500);
      await expect(dialog.getByLabel(copy.date, { exact: true })).toHaveValue(open);
      await expect(dialog.getByLabel(copy.name, { exact: true })).toHaveValue(locale === "ar" ? "عميل جدول تجريبي" : "Synthetic Schedule Customer");
      const labels = await dialog.getByRole("radio").evaluateAll(radios => radios.map(radio => radio.parentElement?.textContent?.trim()));
      expect(new Set(labels).size).toBe(labels.length); expect(labels.length).toBeGreaterThan(1);
      expect(labels.every(label => !label?.includes(bookingDateLabel(open, locale)))).toBe(true);
      await dialog.getByRole("radio").first().check(); await dialog.getByLabel(copy.consent, { exact: true }).check();
      await dialog.getByLabel(copy.date, { exact: true }).fill(addCairoDays(open, 1));
      await expect(dialog.getByRole("radio").first()).toBeVisible();
      await expect(dialog.getByLabel(copy.consent, { exact: true })).toHaveCount(0);
      await expect(dialog.getByRole("button", { name: copy.callback, exact: true })).toHaveCount(0);
      await expect(dialog.getByRole("button", { name: copy.confirm, exact: true })).toBeDisabled();
      await dialog.getByRole("radio").first().focus(); await page.keyboard.press("ArrowDown");
      await expect(dialog.getByRole("radio").nth(1)).toBeChecked();
      await dialog.getByLabel(copy.consent, { exact: true }).check();
      await dialog.getByText(copy.review, { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.playwright/ordered-booking/${locale}-${width}-review.png` });
      await dialog.getByRole("button", { name: copy.confirm, exact: true }).click();
      await expect(dialog.getByText(copy.confirmed, { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: copy.change, exact: true }).click();
      await expect(dialog.getByRole("radio").first()).toBeVisible();
      await dialog.getByRole("radio").last().check(); await dialog.getByLabel(copy.consent, { exact: true }).check();
      await dialog.getByRole("button", { name: copy.confirm, exact: true }).click();
      await expect(dialog.getByText(copy.confirmed, { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: copy.cancel, exact: true }).click();
      await dialog.getByRole("button", { name: copy.cancelConfirm, exact: true }).click();
      await expect(dialog.getByText(copy.cancelled, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    expect(errors).toEqual([]);
  } finally { await admin.dispose(); }
});
