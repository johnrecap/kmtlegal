import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { conversationCopy } from "../../src/content/conversation-copy";
import { directBookingCopy } from "../../src/content/direct-booking-copy";
import { getClientContent } from "../../src/content/client-content";

type Locale = "ar" | "en";
const output = ".playwright/client-layout";

test.beforeEach(async ({ baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires the disposable synthetic client database.");
  if (!baseURL || new URL(baseURL).hostname !== "127.0.0.1") throw new Error("Local synthetic target required.");
});

async function prepare(page: Page, baseURL: string, locale: Locale, width: number, theme = "dark") {
  const fixture = JSON.parse(readFileSync(".playwright/phase-five/fixtures.json", "utf8"));
  await page.context().addCookies([{ name: "kmt_session", value: fixture.users[locale].token, url: baseURL }]);
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !/503/.test(message.text())) errors.push(message.text());
  });
  const state = {
    locale, handoffState: "NONE", booking: null as null | Record<string, unknown>,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: true, accountAccess: false },
    draft: {}, revision: 0, accountReady: true, humanOwned: false, submitted: false,
    turns: [{ messageId: "layout-sample", userText: locale === "ar" ? "سؤال تجريبي" : "Sample question", assistantText: (locale === "ar" ? "شرح تجريبي لخدمات المكتب. " : "Sample office services explanation. ").repeat(120), status: "COMPLETED" }],
    staffMessages: [] as Array<{ id: string; body: string; createdAt: string }>, officeThreadStatus: null as string | null
  };
  let failMessage = false;
  await page.route("**/api/public/assistant/conversation", route => {
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      if (input.action === "set_locale") state.locale = input.locale;
      if (input.action === "message" && failMessage) return route.fulfill({ status: 503, json: { error: { code: "AI_UNAVAILABLE" } } });
    }
    return route.fulfill({ json: { data: state } });
  });
  return { state, errors, failNextMessage: () => { failMessage = true; } };
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  expect(await page.getByTestId("client-portal-main").evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

async function composerVisible(page: Page) {
  const box = await page.locator(".consultation-composer").boundingBox();
  const shell = await page.getByTestId("client-portal-shell").boundingBox();
  expect(box!.y).toBeGreaterThan(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(shell!.y + shell!.height + 1);
  expect(await page.getByRole("log").evaluate(element => element.clientHeight)).toBeGreaterThan(40);
}

async function verifyPages(page: Page, locale: Locale, width: number, theme: string) {
  await page.goto("/client", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const sidebar = page.getByTestId("client-portal-sidebar");
  const main = page.getByTestId("client-portal-main");
  const header = page.locator(".client-portal-shell > header");
  const before = await header.boundingBox();
  if (width >= 1024) {
    await expect(sidebar).toBeVisible();
    const box = (await sidebar.boundingBox())!;
    expect(box.width).toBe(300);
    expect(box.y).toBe(before!.height);
    expect(locale === "ar" ? box.x + box.width : box.x).toBe(locale === "ar" ? width : 0);
    await sidebar.hover();
    await sidebar.getByRole("link").last().focus();
    await page.mouse.move(width / 2, 20);
    expect(await sidebar.boundingBox()).toEqual(box);
    await expect(sidebar.getByRole("link", { name: getClientContent(locale).nav.home, exact: true })).toBeVisible();
    expect((await main.boundingBox())!.width).toBe(width - 300);
  } else {
    await expect(sidebar).not.toBeVisible();
    expect((await main.boundingBox())!.width).toBe(width);
  }
  await main.evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await header.boundingBox()).toEqual(before);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await noOverflow(page);
  await main.evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: `${output}/${locale}-${theme}-${width}-home.png` });

  await page.goto("/client/assistant", { waitUntil: "networkidle" });
  await expect(page.getByRole("log").locator(".consultation-message")).toHaveCount(2);
  await expect(page.locator(".consultation-welcome")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  expect((await page.getByRole("log").boundingBox())!.height).toBeGreaterThanOrEqual(350);
  await composerVisible(page);
  await noOverflow(page);
  await page.screenshot({ path: `${output}/${locale}-${theme}-${width}-assistant.png` });
}

test("representative Arabic desktop: home and assistant", async ({ page, baseURL }) => {
  const { errors } = await prepare(page, baseURL!, "ar", 1920);
  await verifyPages(page, "ar", 1920, "dark");
  expect(errors).toEqual([]);
});

for (const locale of ["ar", "en"] as const) for (const theme of ["light", "dark"]) for (const width of [390, 768, 1024, 1440, 1920]) {
  test(`layout ${locale}-${theme}-${width}`, async ({ page, baseURL }) => {
    const { errors } = await prepare(page, baseURL!, locale, width, theme);
    await verifyPages(page, locale, width, theme);
    expect(errors).toEqual([]);
  });
}

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: keyboard navigation and all client destinations`, async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    const { errors } = await prepare(page, baseURL!, locale, 390, "light");
    await page.goto("/client", { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: getClientContent(locale).shell.navigation, exact: true });
    await trigger.focus(); await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Tab");
    expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
    await trigger.click();
    await menu.getByRole("link", { name: getClientContent(locale).nav.files, exact: true }).click();
    await expect(menu).not.toBeVisible();
    for (const width of [390, 1440]) for (const path of ["/client/requests", "/client/cases", "/client/court-dates", "/client/files", "/client/payments", "/client/profile"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.getByTestId("client-portal-shell")).toBeVisible();
      await noOverflow(page);
    }
    expect(errors).toEqual([]);
  });

  test(`${locale}: message scrolling, errors, booking details and office team`, async ({ page, baseURL }) => {
    const { state, errors, failNextMessage } = await prepare(page, baseURL!, locale, 1440);
    const copy = conversationCopy[locale];
    state.officeThreadStatus = "OPEN";
    await page.clock.install();
    await page.goto("/client/assistant", { waitUntil: "networkidle" });
    const log = page.getByRole("log");
    const height = (await log.boundingBox())!.height;
    expect(await log.evaluate(element => element.scrollHeight > element.clientHeight * 2)).toBe(true);
    await log.evaluate(element => { element.scrollTop = 20; element.dispatchEvent(new Event("scroll")); });
    state.staffMessages.push({ id: "new-office-reply", body: "Synthetic office update", createdAt: new Date().toISOString() });
    await page.clock.fastForward(15_100);
    await expect(page.getByText("Synthetic office update", { exact: true })).toBeAttached();
    await page.getByRole("button", { name: copy.latest, exact: true }).click();
    expect(await log.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight)).toBeLessThan(5);
    expect((await log.boundingBox())!.height).toBe(height);
    failNextMessage();
    await page.getByLabel(copy.message, { exact: true }).fill("Synthetic failed message");
    await page.getByRole("button", { name: copy.send, exact: true }).click();
    await expect(page.getByText(copy.unavailable, { exact: true })).toBeVisible();
    await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue("Synthetic failed message");
    await composerVisible(page);
    await page.getByRole("button", { name: copy.staff, exact: true }).click();
    await expect(page.getByRole("heading", { name: getClientContent(locale).teamChat.title, exact: true })).toBeVisible();
    await page.getByRole("button", { name: getClientContent(locale).teamChat.back, exact: true }).click();
    await expect(page.locator(".kmt-consultation--portal")).toBeVisible();
    state.submitted = true;
    state.booking = { confirmationSource: "CLIENT_REQUEST", contactChannel: "PHONE", publicReference: "LAYOUT-SYNTHETIC", fullName: "Synthetic Client", phone: "01000000000", serviceCategory: "GENERAL", status: "PENDING", appointments: [] };
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: directBookingCopy[locale].openDetails, exact: true }).click();
    const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
    await expect(dialog.getByText("LAYOUT-SYNTHETIC", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
    await composerVisible(page); await noOverflow(page);
    await page.screenshot({ path: `${output}/${locale}-booking-details-closed.png` });
    expect(errors).toEqual([]);
  });
}

test("short viewport, keyboard resize, orientation and enlarged text", async ({ page, baseURL }) => {
  const { errors } = await prepare(page, baseURL!, "ar", 390);
  await page.goto("/client/assistant", { waitUntil: "networkidle" });
  await page.getByLabel(conversationCopy.ar.message, { exact: true }).focus();
  // Simulate the VisualViewport keyboard event; a physical mobile keyboard remains a device check.
  await page.evaluate(() => { Object.defineProperty(visualViewport!, "height", { configurable: true, get: () => 440 }); visualViewport!.dispatchEvent(new Event("resize")); });
  await expect.poll(async () => (await page.getByTestId("client-portal-shell").boundingBox())!.height).toBe(440);
  await composerVisible(page); await noOverflow(page);
  await page.evaluate(() => { delete (visualViewport as unknown as { height?: number }).height; visualViewport!.dispatchEvent(new Event("resize")); });
  await page.setViewportSize({ width: 900, height: 500 });
  await composerVisible(page); await noOverflow(page);
  await page.setViewportSize({ width: 768, height: 900 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await composerVisible(page); await noOverflow(page);
  const logout = await page.getByRole("button", { name: getClientContent("ar").shell.logout, exact: true }).boundingBox();
  expect(logout!.x).toBeGreaterThanOrEqual(0);
  expect(logout!.x + logout!.width).toBeLessThanOrEqual(768);
  await page.screenshot({ path: `${output}/ar-enlarged-text.png` });
  expect(errors).toEqual([]);
});

test("short desktop: sidebar links scroll independently and remain reachable", async ({ page, baseURL }) => {
  const { errors } = await prepare(page, baseURL!, "en", 1440);
  await page.setViewportSize({ width: 1440, height: 360 });
  await page.goto("/client", { waitUntil: "networkidle" });
  const sidebar = page.getByTestId("client-portal-sidebar");
  const links = sidebar.getByRole("list");
  expect(await links.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await sidebar.getByRole("link").last().focus();
  const last = (await sidebar.getByRole("link").last().boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(360);
  expect((await sidebar.boundingBox())!.width).toBe(300);
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("client links reset the page scroller when changing destinations", async ({ page, baseURL }) => {
  const { errors } = await prepare(page, baseURL!, "en", 1440);
  await page.goto("/client", { waitUntil: "networkidle" });
  await page.getByTestId("client-portal-main").evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.getByTestId("client-portal-sidebar").getByRole("link", { name: getClientContent("en").nav.files, exact: true }).click();
  await expect(page).toHaveURL(/\/client\/files$/);
  await expect(page.getByRole("heading", { name: getClientContent("en").files.title, exact: true })).toBeVisible();
  expect(await page.getByTestId("client-portal-main").evaluate(element => element.scrollTop)).toBe(0);
  expect(errors).toEqual([]);
});
