import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { conversationCopy } from "../../src/content/conversation-copy";

let db: PrismaClient;
let fixture: { databaseUrl: string; users: Record<string, { id: string; clientId: string; token: string }> };
const records: Record<string, { id: string; reference: string }> = {};
test.beforeAll(async () => {
  if (process.env.RUN_PHASE_FIVE_FIXTURES !== "true") return;
  fixture = JSON.parse(readFileSync(".playwright/phase-five/fixtures.json", "utf8"));
  if (new URL(fixture.databaseUrl).hostname !== "127.0.0.1" || new URL(fixture.databaseUrl).port !== "55469") throw new Error("Disposable local fixture required");
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: fixture.databaseUrl, max: 1 }) });
  const marker = await db.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM phase_five_fixture_marker`;
  expect(marker[0]?.marker).toBe("synthetic-memory-only");
  for (const locale of ["ar", "en"]) {
    await db.serviceRequest.deleteMany({ where: { clientId: fixture.users[locale].clientId, reference: { startsWith: "CONTRACT-" } } });
    await db.user.update({ where: { id: fixture.users[locale].id }, data: { emailVerifiedAt: null } });
    records[locale] = await db.serviceRequest.create({ data: { reference: `CONTRACT-${randomUUID()}`, clientId: fixture.users[locale].clientId, kind: "CONTRACT_REVIEW", locale, status: "RECEIVED", intake: {}, idempotencyKey: randomUUID() } });
  }
});
test.afterAll(async () => { if (db) { await db.serviceRequest.deleteMany({ where: { id: { in: Object.values(records).map(r => r.id) } } }); await db.$disconnect(); } });
test.beforeEach(async ({ baseURL }) => {
  test.skip(process.env.RUN_PHASE_FIVE_FIXTURES !== "true", "Requires disposable SQL and a local application with AI unavailable.");
  expect(new URL(baseURL!).hostname).toBe("127.0.0.1");
});

async function send(page: Page, locale: "ar" | "en", message: string) {
  const firstResponse = page.waitForResponse(response => response.url().endsWith("/api/public/assistant/conversation") && response.request().method() === "POST");
  const response = page.waitForResponse(response => response.url().endsWith("/api/public/assistant/conversation") && response.request().method() === "POST" && response.request().postDataJSON().action === "message");
  await page.getByPlaceholder(conversationCopy[locale].placeholder).fill(message);
  await page.locator(".consultation-composer").getByRole("button", { name: conversationCopy[locale].send, exact: true }).click();
  expect((await firstResponse).status()).toBe(200);
  const result = await response; expect(result.status()).toBe(200);
  return (await result.json()).data;
}

for (const [locale, width] of [["ar", 1440], ["ar", 390], ["en", 1440], ["en", 390]] as const) test(`${locale} ${width}: old request/new conversation, short follow-up, fresh office update and auth loss`, async ({ page, baseURL }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await db.serviceRequest.update({ where: { id: records[locale].id }, data: { status: "RECEIVED" } });
  await page.context().addCookies([{ name: "kmt_session", value: fixture.users[locale].token, url: baseURL! }]);
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/client/assistant", { waitUntil: "networkidle" });
  await expect(page.getByPlaceholder(conversationCopy[locale].placeholder)).toBeVisible();
  const first = await send(page, locale, locale === "ar" ? "عايز أتابع الطلب بتاعي" : "I want to follow up my request");
  expect(first.turns.at(-1).assistantText).toContain(records[locale].reference);
  await expect(page.getByRole("log")).toContainText(locale === "ar" ? "مستلم" : "Received");
  const next = await send(page, locale, locale === "ar" ? "هل اتقبل ولا لا؟" : "Was it accepted?");
  expect(next.dialogue.followup.selected.id).toBe(records[locale].id);
  await db.serviceRequest.update({ where: { id: records[locale].id }, data: { status: "IN_PROGRESS" } });
  await send(page, locale, locale === "ar" ? "هل اتقبل ولا لا؟" : "Was it accepted?");
  await expect(page.locator(".consultation-message-assistant").last()).toContainText(locale === "ar" ? "قيد العمل" : "In progress");
  await page.screenshot({ path: `.playwright/client-context/browser-${locale}-${width}.png`, fullPage: true });
  await page.context().addCookies([{ name: "kmt_session", value: fixture.users.other.token, url: baseURL! }]);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("log")).not.toContainText(records[locale].reference);
  expect(errors).toEqual([]);
});
