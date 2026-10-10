import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";

for (const locale of ["ar", "en"] as const) {
  test(locale + ": guest booking, optional account and responsive presentation", async ({ page }) => {
    test.setTimeout(180_000);
    const copy = conversationCopy[locale], policy = assistantPolicyCopy[locale], direct = directBookingCopy[locale];
    let state: Record<string, any> | null = null;
    let failResponse = false; const keys = new Set<string>();
    const start = new Date(Date.now() + 3 * 86400000).toISOString();
    const end = new Date(Date.parse(start) + 3600000).toISOString();
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: state } });
      const input = route.request().postDataJSON();
      if (input.action === "start") state = { locale, handoffState: "NONE", booking: null, draft: { service: input.service }, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false, turns: [] };
      if (input.action === "begin_booking") state = { ...state, dialogue: { mode: "BOOKING", consentAt: new Date().toISOString(), offerShown: true, accountAccess: false } };
      if (input.action === "return_inquiry") state = { ...state, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: true, accountAccess: false } };
      if (input.action === "account_access") state = { ...state, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: true } };
      if (input.action === "booking_slots") return route.fulfill({ json: { data: { published: true, slots: [{ startsAt: start, endsAt: end }] } } });
      if (input.action === "message") return route.fulfill({ status: 503, json: { error: { code: "AI_PROVIDER_UNAVAILABLE" } } });
      if (input.action === "confirm_booking") {
        expect(input.email).toBeUndefined(); expect(input.confirmed).toBe(true); keys.add(input.key);
        state = { ...state, submitted: true, revision: 2, booking: { confirmationSource: "PUBLISHED_SLOT", publicReference: "CONS-SYNTHETIC", contactChannel: input.contactChannel, fullName: input.fullName, phone: input.phone, appointments: [{ id: "synthetic", startsAt: start, endsAt: end, status: "SCHEDULED", lawyer: { name: "Synthetic Lawyer" } }] } };
        if (failResponse) { failResponse = false; return route.abort("failed"); }
      }
      if (input.action === "cancel_booking") state!.booking.appointments[0].status = "CANCELLED";
      return route.fulfill({ json: { data: state } });
    });
    for (const theme of (process.env.POPUP_SAMPLE ? ["dark"] : ["dark", "light"])) for (const width of (process.env.POPUP_SAMPLE ? [360] : [360, 390, 768, 1024, 1440])) {
      state = null; keys.clear(); failResponse = true;
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
      await page.goto((locale === "ar" ? "/ar" : "") + "/book-consultation?service=company-formation", { waitUntil: "networkidle" });
      await expect(page.getByLabel(direct.name, { exact: true })).toHaveCount(0);
      await expect(page.getByLabel(copy.email, { exact: true })).toHaveCount(0);
      await page.getByLabel(copy.message, { exact: true }).fill(locale === "ar" ? "شركة استيراد وتصدير" : "Import and export company");
      await page.getByRole("button", { name: copy.send, exact: true }).click();
      await expect(page.getByText(copy.unavailable, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: policy.begin, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: copy.review, exact: true });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
      await expect(page.getByLabel(copy.email, { exact: true })).toHaveCount(0);
      await page.getByLabel(direct.channel, { exact: true }).selectOption("WHATSAPP");
      await page.getByRole("radio").first().check();
      await page.getByLabel(direct.name, { exact: true }).fill(locale === "ar" ? "عميل تجريبي" : "Synthetic Customer");
      await page.getByLabel(direct.number, { exact: true }).fill("01012345678");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      expect(keys.size).toBe(0);
      await expect(page.getByRole("button", { name: policy.begin, exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: direct.openForm, exact: true }).click();
      await expect(page.getByLabel(direct.name, { exact: true })).toHaveValue(locale === "ar" ? "عميل تجريبي" : "Synthetic Customer");
      await expect(page.getByLabel(direct.number, { exact: true })).toHaveValue("01012345678");
      await expect(page.getByLabel(direct.channel, { exact: true })).toHaveValue("WHATSAPP");
      await dialog.getByRole("button", { name: direct.closeForm }).click();
      await expect(page.getByRole("button", { name: direct.openForm, exact: true })).toBeFocused();
      await page.getByRole("button", { name: direct.openForm, exact: true }).click();
      await dialog.getByRole("button", { name: direct.closeForm }).focus();
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
      const bounds = await dialog.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(901);
      await expect(page.getByRole("button", { name: direct.confirm, exact: true })).toBeDisabled();
      await page.getByLabel(direct.consent, { exact: true }).check();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: ".playwright/booking-popup/" + locale + "-" + theme + "-" + width + "-review.png" });
      await page.getByRole("button", { name: direct.confirm, exact: true }).click();
      await expect(page.getByText(direct.failed, { exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: direct.retry, exact: true }).click();
      await expect(page.getByText(direct.confirmed, { exact: true })).toBeVisible(); expect(keys.size).toBe(1);
      await expect(page.getByText("CONS-SYNTHETIC", { exact: true })).toBeVisible();
      await expect(page.getByLabel(copy.email, { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: ".playwright/booking-popup/" + locale + "-" + theme + "-" + width + "-confirmed.png" });
      await page.getByRole("button", { name: direct.cancel, exact: true }).click();
      await page.getByRole("button", { name: direct.cancelConfirm, exact: true }).click();
      await expect(page.getByText(direct.cancelled, { exact: true })).toBeVisible();
    }
  });
}

test("saved Arabic dialogue on an English page keeps booking available during staff ownership", async ({ page }) => {
  const locale = "ar", direct = directBookingCopy.ar;
  let state = { locale, handoffState: "CLAIMED", booking: null, draft: {}, dialogue: { mode: "INQUIRY", consentAt: null as string | null, offerShown: false, accountAccess: false }, revision: 0, accountReady: false, humanOwned: true, submitted: false, turns: [] };
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      if (input.action === "begin_booking") state = { ...state, dialogue: { ...state.dialogue, mode: "BOOKING", consentAt: new Date().toISOString() } };
      if (input.action === "booking_slots") return route.fulfill({ json: { data: { published: false, slots: [] } } });
    }
    return route.fulfill({ json: { data: state } });
  });
  await page.goto("/book-consultation", { waitUntil: "networkidle" });
  await expect(page.getByText(direct.claimed, { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: assistantPolicyCopy.ar.begin, exact: true }).click();
  await expect(page.getByLabel(direct.name, { exact: true })).toBeVisible();
  await expect(page.getByText(direct.empty, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: directBookingCopy.en.callback, exact: true })).toHaveCount(0);
});

test("conversation booking entry opens the popup and closing it does not reopen on another reply", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const copy = conversationCopy.ar, direct = directBookingCopy.ar;
  let state = { locale: "ar", handoffState: "NONE", booking: null, draft: {}, dialogue: { mode: "INQUIRY", consentAt: null as string | null, offerShown: false, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false, turns: [] };
  const mutations: string[] = [];
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON(); mutations.push(input.action);
      if (input.action === "message") state = { ...state, dialogue: { ...state.dialogue, mode: "BOOKING", consentAt: "2026-10-10T00:00:00Z" } };
      if (input.action === "booking_slots") return route.fulfill({ json: { data: { published: false, slots: [] } } });
    }
    return route.fulfill({ json: { data: state } });
  });
  await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
  await page.getByLabel(copy.message, { exact: true }).fill("عايز أحجز موعد");
  await page.getByRole("button", { name: copy.send, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(501);
  await page.getByLabel(direct.name, { exact: true }).fill("عميل تجريبي");
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
  await page.getByLabel(copy.message, { exact: true }).fill("عندي سؤال آخر");
  await page.getByRole("button", { name: copy.send, exact: true }).click();
  await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue("");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: direct.openForm, exact: true }).click();
  await expect(page.getByLabel(direct.name, { exact: true })).toHaveValue("عميل تجريبي");
  expect(mutations).not.toContain("confirm_booking"); expect(mutations).not.toContain("request_callback");
});
