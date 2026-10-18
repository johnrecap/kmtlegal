import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { conversationCopy } from "../../src/content/conversation-copy";
import { legalAssistantCopy } from "../../src/content/legal-assistant-copy";
test.beforeEach(async ({ baseURL }) => {
  test.skip(process.env.RUN_LEGAL_FIXTURES !== "true", "Requires isolated synthetic SQL and provider.");
  expect(new URL(baseURL!).hostname).toBe("127.0.0.1");
});
async function send(page: Page, locale: "ar" | "en", message: string) {
  const response = page.waitForResponse(r => r.url().endsWith("/api/public/assistant/conversation") && r.request().method() === "POST" && r.request().postDataJSON().action === "message");
  await page.getByPlaceholder(conversationCopy[locale].placeholder).fill(message);
  await page.locator(".consultation-composer").getByRole("button", { name: conversationCopy[locale].send, exact: true }).click();
  const result = await response; expect(result.status()).toBe(200); return (await result.json()).data;
}
for (const [locale, width] of [["ar", 1440], ["ar", 390], ["en", 1440], ["en", 390]] as const) test(`${locale} ${width}: legal sources, continuation, draft and internal booking`, async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.setExtraHTTPHeaders({ "x-real-ip": `192.0.2.${locale === "ar" ? "30" : "40"}${width === 390 ? "1" : "2"}` });
  if (width === 1440) {
    const fixture = JSON.parse(readFileSync(".playwright/phase-five/fixtures.json", "utf8"));
    await page.context().addCookies([{ name: "kmt_session", value: fixture.users[locale].token, url: baseURL! }]);
    await page.goto("/client/assistant", { waitUntil: "networkidle" });
  } else await page.goto(`${locale === "ar" ? "/ar" : ""}/book-consultation`, { waitUntil: "networkidle" });
  const first = await send(page, locale, locale === "ar" ? "ما حقوق المستأجر في عقد الإيجار؟" : "What are a tenant's rights under a lease?");
  expect(first.turns.at(-1).assistantText).toContain(legalAssistantCopy[locale].assumed);
  const sources = page.getByRole("navigation", { name: legalAssistantCopy[locale].sources }).last();
  await expect(sources.getByRole("link")).toHaveAttribute("href", "https://elpai.idsc.gov.eg/");
  await expect(sources.getByRole("link")).toHaveAttribute("rel", "noopener noreferrer");
  await page.keyboard.press("Tab");
  await send(page, locale, locale === "ar" ? "ولو رفض؟" : "What if they refuse?");
  const draft = await send(page, locale, locale === "ar" ? "اكتب مسودة عقد إيجار" : "Write a tenancy draft");
  expect(draft.turns.at(-1).assistantText).toContain(legalAssistantCopy[locale].draft);
  await page.screenshot({ path: `.playwright/legal-assistant/browser-${locale}-${width}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const booking = await send(page, locale, locale === "ar" ? "عايز احجز استشارة مع المكتب" : "I want to book with the office");
  expect(booking.dialogue.mode).toBe("BOOKING"); expect(booking.submitted).toBe(false);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
