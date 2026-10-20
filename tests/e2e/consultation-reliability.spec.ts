import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";
import { fixtureBookingAvailability } from "./helpers/booking-availability";
import { assistantPolicyCopy } from "../../src/content/assistant-policy-copy";
import { publicOfficeProfile } from "../../src/content/public-office-profile";
import { getPublicContent } from "../../src/content/public-content";

for (const locale of ["ar", "en"] as const) for (const theme of ["light", "dark"]) for (const width of [320, 360, 390, 430, 768, 1440]) {
  test(`PLAN40 matrix ${locale}-${theme}-${width}: viewport, text zoom and retained data`, async ({ page }) => {
    const copy = directBookingCopy[locale], errors: string[] = [], unexpected: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error" && !(message.text().includes("401") && message.location().url.endsWith("/api/auth/me"))) errors.push(message.text());
    });
    page.on("response", response => { if (response.status() >= 400 && !response.url().endsWith("/api/auth/me")) unexpected.push(`${response.status()} ${new URL(response.url()).pathname}`); });
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
    const snapshot = { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
      dialogue: { mode: "BOOKING", offerShown: false, consentAt: new Date().toISOString(), accountAccess: false }, turns: [] };
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { error: { code: "UNAUTHORIZED" } } }));
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", route => {
      const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
      return route.fulfill({ json: { data: body?.action === "booking_slots" ? fixtureBookingAvailability({ date: body.date }) : snapshot } });
    });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
    const dialog = page.getByRole("dialog", { name: copy.dialogTitle, exact: true });
    await expect(dialog).toBeVisible(); await expect(dialog.getByRole("radio").first()).toBeVisible();
    const name = dialog.getByLabel(copy.name, { exact: true });
    await name.fill(locale === "ar" ? "اسم محفوظ لاختبار المقاسات" : "Retained responsive test name");
    const before = (await dialog.boundingBox())!;
    expect(before.width).toBeLessThanOrEqual(width); expect(before.width).toBeLessThanOrEqual(width <= 700 ? width : 780);
    if (width <= 700) { expect(before.x).toBeCloseTo(0, 0); expect(before.width).toBeCloseTo(width, 0); expect(before.height).toBeCloseTo(900, 0); }
    expect(await dialog.evaluate(element => getComputedStyle(element).direction)).toBe(locale === "ar" ? "rtl" : "ltr");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `.playwright/plan40/t013-${locale}-${theme}-${width}-normal.png` });
    await dialog.evaluate(element => {
      const nodes = [...element.querySelectorAll("*")].filter((node): node is HTMLElement => node instanceof HTMLElement).map(node => [node, parseFloat(getComputedStyle(node).fontSize)] as const);
      for (const [node, size] of nodes) node.style.fontSize = `${size * 2}px`;
    });
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1 && [...element.children].every(child => child.scrollWidth <= child.clientWidth + 1))).toBe(true);
    const confirm = dialog.getByRole("button", { name: copy.confirm, exact: true });
    await expect(confirm).toBeVisible();
    const action = (await confirm.boundingBox())!;
    expect(action.y + action.height).toBeLessThanOrEqual(901);
    await page.screenshot({ path: `.playwright/plan40/t013-${locale}-${theme}-${width}-text200.png` });
    await dialog.evaluate(element => { for (const node of element.querySelectorAll<HTMLElement>("[style]")) node.style.removeProperty("font-size"); });
    if (width <= 700) {
      await page.evaluate(() => { Object.defineProperty(visualViewport!, "height", { configurable: true, value: 420 }); Object.defineProperty(visualViewport!, "offsetTop", { configurable: true, value: 24 }); visualViewport!.dispatchEvent(new Event("resize")); });
      await expect.poll(async () => (await dialog.boundingBox())!.height).toBeLessThanOrEqual(421);
      expect((await dialog.boundingBox())!.y).toBeCloseTo(24, 0);
      await page.evaluate(() => { delete (visualViewport as any).height; delete (visualViewport as any).offsetTop; });
      await page.setViewportSize({ width: 640, height: 360 });
      await expect.poll(async () => (await dialog.boundingBox())!.height).toBeLessThanOrEqual(361);
    }
    const retained = await name.inputValue(); await page.keyboard.press("Escape");
    const trigger = page.getByRole("button", { name: copy.openForm, exact: true }); await expect(trigger).toBeFocused();
    await trigger.click(); await expect(name).toHaveValue(retained);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]); expect(unexpected).toEqual([]);
  });
}

for (const locale of ["ar", "en"] as const) for (const width of [360, 1440]) {
  test(`PLAN40 office ${locale}-${width}: exact address and map contact/footer`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${locale === "ar" ? "/ar" : ""}/contact`, { waitUntil: "networkidle" });
    if (width <= 700) await page.getByTestId("contact-branches-accordion").getByRole("button", { name: getPublicContent(locale).branches[0].name, exact: true }).click();
    const footerMap = page.locator("footer").getByRole("link", { name: publicOfficeProfile.address[locale], exact: true });
    await footerMap.scrollIntoViewIfNeeded(); await expect(footerMap).toBeVisible();
    await expect(footerMap).toHaveAttribute("href", "https://maps.app.goo.gl/muoNe1hNgw2QNWtb9");
    await footerMap.focus(); await expect(footerMap).toBeFocused();
    const branchMap = page.locator("aside").getByRole("link", { name: publicOfficeProfile.address[locale], exact: true }).filter({ visible: true });
    await branchMap.scrollIntoViewIfNeeded(); await expect(branchMap).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.playwright/plan40/t013-office-${locale}-${width}.png`, fullPage: true });
  });
}

test("PLAN40 mobile representative ar-dark-360: full viewport, keyboard, retained values and focus", async ({ page }) => {
  const copy = directBookingCopy.ar;
  let snapshot = { locale: "ar", revision: 0, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null as string | null, accountAccess: false }, turns: [] };
  const writes: string[] = [], errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem("kmt-theme", "dark"));
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON(); writes.push(body.action);
      if (body.action === "booking_slots") return route.fulfill({ json: { data: fixtureBookingAvailability({ date: body.date }) } });
      if (body.action === "begin_booking") snapshot = { ...snapshot, revision: 1, dialogue: { ...snapshot.dialogue, mode: "BOOKING", consentAt: new Date().toISOString() } };
    }
    return route.fulfill({ json: { data: snapshot } });
  });
  await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: assistantPolicyCopy.ar.begin, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: copy.dialogTitle, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.playwright/plan40/${process.env.PLAN40_CAPTURE_PHASE ?? "mobile"}-ar-dark-360-initial.png` });
  const initial = (await dialog.boundingBox())!;
  expect.soft(initial.x).toBeCloseTo(0, 0); expect.soft(initial.y).toBeCloseTo(0, 0);
  expect.soft(initial.width).toBeCloseTo(360, 0); expect.soft(initial.height).toBeCloseTo(800, 0);
  const metrics = await dialog.evaluate(element => ({
    inputs: [...element.querySelectorAll<HTMLInputElement>("input:not([type=radio]):not([type=checkbox]),select")].map(input => parseFloat(getComputedStyle(input).fontSize)),
    helpers: [...element.querySelectorAll(".consultation-selection-hint,.consultation-weekday,.consultation-date-status,.consultation-footer-summary")].map(item => parseFloat(getComputedStyle(item).fontSize)),
    targets: [...element.querySelectorAll("button,.consultation-time")].map(item => { const box = item.getBoundingClientRect(); return [box.width, box.height]; })
  }));
  expect.soft(Math.min(...metrics.inputs)).toBeGreaterThanOrEqual(16);
  expect.soft(Math.min(...metrics.helpers)).toBeGreaterThanOrEqual(14);
  expect.soft(metrics.targets.every(([width, height]) => width >= 43.5 && height >= 43.5)).toBe(true);
  await dialog.getByLabel(copy.name, { exact: true }).fill("اسم تجريبي محفوظ عند الإغلاق");
  await dialog.getByRole("radio").first().check();
  await dialog.getByLabel(copy.number, { exact: true }).fill("01012345678");
  // Native browser layout with a deterministic visualViewport resize/scroll event;
  // this tests keyboard geometry, not an actual hardware keyboard opening.
  await page.evaluate(() => {
    const viewport = window.visualViewport!;
    Object.defineProperty(viewport, "height", { configurable: true, value: 400 });
    Object.defineProperty(viewport, "offsetTop", { configurable: true, value: 48 });
    viewport.dispatchEvent(new Event("resize")); viewport.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(async () => (await dialog.boundingBox())!.height).toBeLessThanOrEqual(401);
  expect.soft((await dialog.boundingBox())!.y).toBeCloseTo(48, 0);
  const close = dialog.getByRole("button", { name: copy.closeForm, exact: true });
  const confirm = dialog.getByRole("button", { name: copy.confirm, exact: true });
  expect.soft((await close.boundingBox())!.y).toBeGreaterThanOrEqual(48);
  const action = (await confirm.boundingBox())!; expect.soft(action.y + action.height).toBeLessThanOrEqual(449);
  await page.screenshot({ path: `.playwright/plan40/${process.env.PLAN40_CAPTURE_PHASE ?? "mobile"}-ar-dark-360-keyboard.png` });
  await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
  const trigger = page.getByRole("button", { name: copy.openForm, exact: true });
  await expect(trigger).toBeFocused(); await trigger.click();
  await expect(dialog.getByLabel(copy.name, { exact: true })).toHaveValue("اسم تجريبي محفوظ عند الإغلاق");
  await expect(dialog.getByLabel(copy.number, { exact: true })).toHaveValue("01012345678");
  await expect(dialog.getByRole("radio").first()).toBeChecked();
  for (let step = 0; step < 18; step++) { await page.keyboard.press("Tab"); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
  await page.evaluate(() => { delete (visualViewport as any).height; delete (visualViewport as any).offsetTop; });
  await page.setViewportSize({ width: 640, height: 360 });
  await expect.poll(async () => (await dialog.boundingBox())!.width).toBeGreaterThanOrEqual(639);
  expect.soft(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  expect.soft(writes.some(action => ["confirm_booking", "request_callback"].includes(action))).toBe(false);
  expect.soft(errors).toEqual([]);
});

test("PLAN40 shows a pending bubble before start completes and coalesces duplicate submits", async ({ page }) => {
  const copy = conversationCopy.ar;
  const message = "رسالة تجريبية أثناء بدء المحادثة";
  let starts = 0, sends = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const state = { locale: "ar", revision: 0, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", offerShown: false, consentAt: null, accountAccess: false }, turns: [] };
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { data: null } });
    const body = route.request().postDataJSON();
    if (body.action === "start") { starts++; await gate; return route.fulfill({ json: { data: state } }); }
    sends++;
    return route.fulfill({ json: { data: { ...state, revision: 1, turns: [{ messageId: body.messageId, userText: body.message, recipient: body.recipient, status: "COMPLETED", assistantText: "رد تجريبي واحد" }] } } });
  });
  await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
  await page.getByLabel(copy.message, { exact: true }).fill(message);
  await page.locator("form.consultation-composer").evaluate(form => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  try {
    await expect(page.getByRole("log").getByText(message, { exact: true })).toBeVisible();
    await expect.poll(() => starts).toBe(1);
  } finally { release(); }
  await expect(page.getByText("رد تجريبي واحد", { exact: true })).toBeVisible();
  expect(sends).toBe(1);
  expect(starts).toBe(1);
  await expect(page.getByRole("log").getByText(message, { exact: true })).toHaveCount(1);
});

for (const scenario of ["FAILED", "COMPLETED", "PENDING", "ABSENT", "EDITED", "BOOKING"] as const) {
  const savedStatus = scenario === "EDITED" || scenario === "BOOKING" ? "FAILED" : scenario;
  test(`PLAN40 recovery ${scenario}: non-JSON502 preserves one message and truthful delivery`, async ({ page }) => {
    const copy = conversationCopy.ar;
    const message = "اشرح خدمات تأسيس الشركات التجريبية";
    let saved: Record<string, any> | null = null;
    const sent: Array<Record<string, any>> = [];
    const initial = () => ({ locale: "ar", revision: 0, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
      dialogue: { mode: scenario === "BOOKING" ? "BOOKING" : "INQUIRY", offerShown: false, consentAt: scenario === "BOOKING" ? new Date().toISOString() : null, accountAccess: false }, turns: [] });
    if (scenario === "BOOKING") saved = initial();
    await page.setViewportSize({ width: 360, height: 800 });
    await page.addInitScript(() => localStorage.setItem("kmt-theme", "dark"));
    await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
    await page.route("**/api/public/assistant/conversation", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { data: saved } });
      const body = route.request().postDataJSON();
      if (body.action === "booking_slots") {
        const start = new Date(Date.now() + 3 * 86400000).toISOString();
        return route.fulfill({ json: { data: fixtureBookingAvailability({ start, end: new Date(Date.parse(start) + 3600000).toISOString(), date: body.date }) } });
      }
      if (body.action === "start") { saved = initial(); return route.fulfill({ json: { data: saved } }); }
      if (body.action === "message") {
        sent.push(body);
        if (savedStatus !== "ABSENT") saved = { ...initial(), revision: sent.length, turns: [...(saved?.turns ?? []).filter((turn: { messageId: string }) => turn.messageId !== body.messageId), { messageId: body.messageId, userText: body.message, recipient: body.recipient, status: sent.length > 1 ? "COMPLETED" : savedStatus, assistantText: sent.length > 1 || savedStatus === "COMPLETED" ? "رد تجريبي مكتمل" : null }] };
        if (sent.length === 1) return route.fulfill({ status: 502, contentType: "text/html", body: "<html>synthetic upstream failure</html>" });
        return route.fulfill({ json: { data: saved } });
      }
      return route.fulfill({ json: { data: saved } });
    });
    await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
    if (scenario === "BOOKING") {
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByLabel(directBookingCopy.ar.name, { exact: true }).fill("اسم تجريبي محفوظ");
      await page.keyboard.press("Escape");
    }
    await page.getByLabel(copy.message, { exact: true }).fill(message);
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    try {
      await expect(page.getByRole("log").getByText(message, { exact: true })).toBeVisible();
      await expect(page.getByRole("log").getByText(message, { exact: true })).toHaveCount(1);
      await expect(page.getByText(/بياناتك محفوظة|Your saved data is retained/)).toHaveCount(0);
      if (savedStatus === "COMPLETED") {
        await expect(page.getByText("رد تجريبي مكتمل", { exact: true })).toBeVisible();
        expect(sent).toHaveLength(1);
      } else if (savedStatus === "FAILED") {
        if (scenario === "EDITED") {
          await page.getByLabel(copy.message, { exact: true }).fill(message + " تعديل");
          await page.getByRole("button", { name: copy.send, exact: true }).click();
        } else await page.getByRole("button", { name: copy.retry, exact: true }).click();
        await expect(page.getByText("رد تجريبي مكتمل", { exact: true })).toBeVisible();
        expect(sent).toHaveLength(2);
        if (scenario === "EDITED") {
          expect(sent[1].messageId).not.toBe(sent[0].messageId);
          expect(sent[1].message).toBe(message + " تعديل");
          await expect(page.getByRole("log").getByText(message + " تعديل", { exact: true })).toHaveCount(1);
        } else {
          expect(sent[1].messageId).toBe(sent[0].messageId);
          expect(sent[1].message).toBe(sent[0].message);
        }
        if (scenario === "BOOKING") {
          await page.getByRole("button", { name: directBookingCopy.ar.openForm, exact: true }).click();
          await expect(page.getByLabel(directBookingCopy.ar.name, { exact: true })).toHaveValue("اسم تجريبي محفوظ");
        }
      } else if (savedStatus === "PENDING") {
        await expect(page.getByRole("button", { name: copy.retry, exact: true })).toBeDisabled();
        await page.reload({ waitUntil: "networkidle" });
        await expect(page.getByRole("button", { name: copy.retry, exact: true })).toBeDisabled();
        saved = { ...saved, revision: 2, turns: saved!.turns.map((turn: object) => ({ ...turn, status: "COMPLETED", assistantText: "رد تجريبي مكتمل" })) };
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await expect(page.getByText("رد تجريبي مكتمل", { exact: true })).toBeVisible();
        expect(sent).toHaveLength(1);
      } else await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue(message);
    } finally {
      await page.screenshot({ path: `.playwright/plan40/${process.env.PLAN40_CAPTURE_PHASE ?? "t007"}-recovery-${scenario}.png`, fullPage: true });
    }
  });
}
