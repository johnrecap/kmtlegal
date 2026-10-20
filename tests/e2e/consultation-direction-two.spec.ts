import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { conversationCopy } from "../../src/content/conversation-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import messages from "../fixtures/consultation/messages.json";

// The same fixed sample as the selected HTML authority, never production data.
const context = { window: {} as Record<string, any> };
vm.runInNewContext(readFileSync("tests/fixtures/consultation/availability.js", "utf8"), context);
const fixture = context.window.KMT_FIXTURE;

for (const locale of ["ar", "en"] as const) for (const theme of ["light", "dark"]) for (const width of [390, 1440]) {
  test(`direction-02 ${locale}-${theme}-${width}: selected appearance and protected booking controls`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const copy = conversationCopy[locale], direct = directBookingCopy[locale], policy = assistantPolicyCopy[locale], preview = messages[locale];
    const state: Record<string, any> = { locale, handoffState: "NONE", booking: null, draft: {}, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: true, accountAccess: false }, revision: 0, accountReady: false, humanOwned: false, submitted: false,
      turns: [{ messageId: "sample-a", status: "COMPLETED", userText: preview.question, assistantText: preview.answer, createdAt: fixture.now }, { messageId: "sample-b", status: "COMPLETED", userText: preview.followup, assistantText: preview.response, createdAt: "2026-10-15T06:00:02Z" }] };
    const errors: string[] = []; const writes: any[] = []; const guestSessionChecks: number[] = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("response", response => {
      if (new URL(response.url()).pathname === "/api/auth/me") guestSessionChecks.push(response.status());
    });
    page.on("console", message => {
      if (message.type() !== "error") return;
      // Opening the account panel checks guest identity; the real API returns 401.
      if (message.location().url.endsWith("/api/auth/me") && /status of 401/.test(message.text())) return;
      errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", route => {
      if (route.request().method() === "POST") {
        const input = route.request().postDataJSON();
        if (input.action === "begin_booking") state.dialogue = { ...state.dialogue, mode: "BOOKING", consentAt: fixture.now };
        if (input.action === "booking_slots") return route.fulfill({ json: { data: fixture.availability(input.date) } });
        if (["confirm_booking", "request_callback", "reschedule_booking", "cancel_booking"].includes(input.action)) writes.push(input);
      }
      return route.fulfill({ json: { data: state } });
    });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const chat = page.locator(".kmt-consultation"), log = page.getByRole("log");
    await expect(chat.locator(".consultation-message")).toHaveCount(4);
    expect((await log.boundingBox())!.height).toBeGreaterThan(width === 390 ? 250 : 350);
    const composer = await page.locator(".consultation-composer").boundingBox(); expect(composer!.y + composer!.height).toBeLessThanOrEqual(900);
    await chat.screenshot({ path: `.playwright/direction-02/${locale}-${theme}-${width}-chat.png` });
    await page.getByRole("button", { name: policy.begin, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: direct.dialogTitle, exact: true }); await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("radio").first()).toBeVisible();
    await expect(dialog.locator("details")).not.toHaveAttribute("open");
    await dialog.screenshot({ path: `.playwright/direction-02/${locale}-${theme}-${width}-booking.png` });
    await dialog.getByLabel(direct.name, { exact: true }).fill(preview.syntheticName);
    await dialog.getByLabel(direct.number, { exact: true }).fill("01000000000");
    await dialog.getByLabel(direct.date, { exact: true }).fill(fixture.closedDate);
    await expect(dialog.getByRole("status").filter({ hasText: direct.availabilityReasons.CLOSED_WEEKLY })).toBeVisible();
    await expect(dialog.getByRole("radio")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: direct.callback, exact: true })).toHaveCount(0);
    await dialog.getByRole("button", { name: direct.chooseNearest, exact: true }).click();
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    await expect(dialog.getByLabel(direct.name, { exact: true })).toHaveValue(preview.syntheticName);
    await dialog.getByLabel(direct.consent, { exact: true }).check();
    await dialog.getByLabel(direct.date, { exact: true }).fill(fixture.fullDate);
    await expect(dialog.getByLabel(direct.consent, { exact: true })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: direct.confirm, exact: true })).toBeDisabled();
    await dialog.getByRole("button", { name: direct.chooseNearest, exact: true }).click();
    await expect(dialog.getByRole("radio").first()).toBeChecked();
    await dialog.getByLabel(direct.consent, { exact: true }).check();
    await expect(dialog.getByRole("button", { name: direct.confirm, exact: true })).toBeEnabled();
    const footer = await dialog.locator(".consultation-dialog-actions").boundingBox(); expect(footer!.y + footer!.height).toBeLessThanOrEqual(900);
    await dialog.getByText(direct.review, { exact: true }).scrollIntoViewIfNeeded();
    await dialog.screenshot({ path: `.playwright/direction-02/${locale}-${theme}-${width}-review.png` });
    await dialog.getByRole("button", { name: direct.closeForm, exact: true }).focus();
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true);
    for (let n = 0; n < 25; n++) { await page.keyboard.press("Tab"); expect(await dialog.evaluate(d => d.contains(document.activeElement))).toBe(true); }
    await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
    await page.getByRole("button", { name: direct.openForm, exact: true }).click();
    await expect(dialog.getByLabel(direct.number, { exact: true })).toHaveValue("01000000000");
    await dialog.getByRole("button", { name: direct.closeForm, exact: true }).click();
    await expect(page.getByRole("button", { name: direct.openForm, exact: true })).toBeFocused();
    for (const size of [{ width: 360, height: 780 }, { width: 390, height: 600 }]) {
      await page.setViewportSize(size); await page.getByRole("button", { name: direct.openForm, exact: true }).click();
      const box = await dialog.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(size.width); expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.keyboard.press("Escape");
    }
    expect(writes).toEqual([]); expect(errors).toEqual([]);
    expect(guestSessionChecks.length).toBeGreaterThan(0);
    expect(guestSessionChecks.every(status => status === 401)).toBe(true);
    await testInfo.attach("scope", { body: "Real production UI, intercepted synthetic API. No booking writes or real AI calls.", contentType: "text/plain" });
  });
}

for (const locale of ["ar", "en"] as const) test(`${locale}: long messages stay inside the log and polling respects reading position`, async ({ page }) => {
  const copy = conversationCopy[locale], width = locale === "ar" ? 390 : 1440;
  let polls = 0;
  const state: Record<string, any> = { locale, handoffState: "CLAIMED", booking: null, draft: {}, dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false }, revision: 0, accountReady: false, humanOwned: true, submitted: false,
    turns: [{ messageId: "long-a", status: "COMPLETED", userText: "Synthetic question", assistantText: (locale === "ar" ? "شرح تجريبي طويل لخدمات المكتب. " : "A long sample explanation of office services. ").repeat(250) }], staffMessages: [] };
  await page.setViewportSize({ width, height: 900 }); await page.clock.install();
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", route => {
    polls++;
    if (polls > 1) state.staffMessages = [{ id: "staff-new", body: "Synthetic staff follow-up", createdAt: new Date().toISOString() }];
    return route.fulfill({ json: { data: state } });
  });
  await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
  const log = page.getByRole("log"); await expect(log.locator(".consultation-message")).toHaveCount(2);
  const before = await page.evaluate(() => ({ page: document.documentElement.scrollHeight, card: document.querySelector(".consultation-chat")!.getBoundingClientRect().height, input: document.querySelector("textarea")!.getBoundingClientRect().top }));
  expect(await log.evaluate(e => e.scrollHeight > e.clientHeight * 4)).toBe(true);
  await log.evaluate(e => { e.scrollTop = 40; e.dispatchEvent(new Event("scroll")); });
  await page.clock.fastForward(15_100);
  await expect(log.locator(".consultation-message-staff")).toHaveCount(1);
  await expect(page.getByRole("button", { name: copy.latest, exact: true })).toBeVisible();
  expect(await log.evaluate(e => e.scrollTop)).toBeLessThan(80);
  const after = await page.evaluate(() => ({ page: document.documentElement.scrollHeight, card: document.querySelector(".consultation-chat")!.getBoundingClientRect().height, input: document.querySelector("textarea")!.getBoundingClientRect().top }));
  expect(after).toEqual(before);
  await page.getByRole("button", { name: copy.latest, exact: true }).click();
  expect(await log.evaluate(e => e.scrollHeight - e.clientHeight - e.scrollTop)).toBeLessThan(5);
});
