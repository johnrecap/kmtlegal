import { expect, test } from "@playwright/test";
import { conversationCopy } from "../../src/content/conversation-copy";

const appearances = [
  ...(["ar", "en"] as const).flatMap(locale => ["dark", "light"].flatMap(theme => [360, 1440].map(width => ({ locale, theme, width, reduced: false })))),
  { locale: "ar" as const, theme: "dark", width: 360, reduced: true },
  { locale: "en" as const, theme: "light", width: 1440, reduced: true }
];

for (const { locale, theme, width, reduced } of appearances) test(`reply indicator ${locale}-${theme}-${width}${reduced ? "-reduced" : ""}: visible feedback becomes a reply`, async ({ page }) => {
  const copy = conversationCopy[locale], errors: string[] = [];
  const state = { locale, revision: 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false }, turns: [] };
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width, height: 800 });
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.addInitScript(value => localStorage.setItem("kmt-theme", value), theme);
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { data: state } });
    const body = route.request().postDataJSON();
    await pending;
    return route.fulfill({ json: { data: { ...state, revision: 2, turns: [{ messageId: body.messageId, userText: body.message, recipient: body.recipient, status: "COMPLETED", assistantText: "رد تجريبي مكتمل" }] } } });
  });
  await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
  await page.getByLabel(copy.message, { exact: true }).fill(locale === "ar" ? "سؤال تجريبي عن خدمات المكتب" : "A sample question about office services");
  await page.getByRole("button", { name: copy.send, exact: true }).click();
  const bubble = page.locator(".consultation-reply-pending"), log = page.getByRole("log");
  try {
    await expect(bubble).toBeVisible();
    await expect(page.getByText(copy.waiting, { exact: true })).toHaveCount(1);
    await expect(log.getByText(copy.waiting, { exact: true })).toBeInViewport({ ratio: 1 });
    await expect(bubble.locator(".consultation-reply-dots > span")).toHaveCount(3);
    expect(await bubble.evaluate(element => getComputedStyle(element).direction)).toBe(locale === "ar" ? "rtl" : "ltr");
    await expect(bubble.locator(".consultation-reply-dots")).toHaveAttribute("aria-hidden", "true");
    const motion = await bubble.locator(".consultation-reply-dots").evaluate(async element => {
      const dots = [...element.children];
      const first = dots.map(dot => getComputedStyle(dot).opacity);
      await new Promise(resolve => setTimeout(resolve, 200));
      return { first, second: dots.map(dot => getComputedStyle(dot).opacity), names: dots.map(dot => getComputedStyle(dot).animationName), durations: dots.map(dot => getComputedStyle(dot).animationDuration), delays: dots.map(dot => getComputedStyle(dot).animationDelay) };
    });
    if (reduced) {
      expect(motion.names).toEqual(["none", "none", "none"]);
      expect(motion.first).toEqual(["1", "1", "1"]);
      expect(motion.second).toEqual(motion.first);
    } else {
      expect(motion.first).not.toEqual(motion.second);
      expect(motion.durations).toEqual(["1.2s", "1.2s", "1.2s"]);
      expect(motion.delays).toEqual(["0s", "0.16s", "0.32s"]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `_workspace/reply-indicator-20261024/${locale}-${theme}-${width}${reduced ? "-reduced" : ""}.png` });
  } finally { release(); }
  await expect(log.getByText("رد تجريبي مكتمل", { exact: true })).toBeVisible();
  await expect(bubble).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("reply indicator does not pull a reader away from older messages when polling completes", async ({ page }) => {
  const copy = conversationCopy.ar;
  let completed = false;
  const history = Array.from({ length: 20 }, (_, index) => ({ messageId: `saved-${index}`, recipient: "ASSISTANT", userText: `سؤال سابق ${index}`, assistantText: `إجابة سابقة ${index}`, status: "COMPLETED" }));
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route("**/api/analytics/events", route => route.fulfill({ status: 202, json: { data: { accepted: true } } }));
  await page.route("**/api/public/assistant/conversation", route => route.fulfill({ json: { data: {
    locale: "ar", revision: completed ? 2 : 1, handoffState: "NONE", booking: null, draft: {}, accountReady: false, humanOwned: false, submitted: false,
    dialogue: { mode: "INQUIRY", consentAt: null, offerShown: false, accountAccess: false },
    turns: [...history, { messageId: "pending", recipient: "ASSISTANT", userText: "السؤال الحالي", assistantText: completed ? "الإجابة الجديدة" : null, status: completed ? "COMPLETED" : "PENDING" }]
  } } }));
  await page.goto("/ar/book-consultation", { waitUntil: "networkidle" });
  const log = page.getByRole("log");
  await expect(log.getByText(copy.waiting, { exact: true })).toBeInViewport({ ratio: 1 });
  await log.evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event("scroll")); });
  completed = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(log.getByText("الإجابة الجديدة", { exact: true })).toHaveCount(1);
  expect(await log.evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator(".consultation-reply-pending")).toHaveCount(0);
  await page.getByRole("button", { name: copy.latest, exact: true }).click();
  await expect(log.getByText("الإجابة الجديدة", { exact: true })).toBeInViewport({ ratio: 1 });
});
