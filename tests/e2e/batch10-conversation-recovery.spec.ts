import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { getClientContent } from "@/content/client-content";
import { getPublicContent } from "@/content/public-content";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

const origin = "http://127.0.0.1:3114";
const evidenceDirectory = resolve(process.cwd(), "docs", "reviews", "2026-09-13", "batch10", "evidence");
const expectedDataDirectory = resolve(process.cwd(), "_workspace", "batch10-postgres", "data");
const enabled = process.env.BATCH10_ISOLATED_DB === "true" && process.env.APP_ENV === "local" && process.env.NODE_ENV !== "production";
let marker = "";
let fixture: Awaited<ReturnType<typeof createFixture>>;

async function assertIdentity() {
  const parsed = new URL(process.env.DATABASE_URL || "");
  expect(parsed).toMatchObject({ hostname: "127.0.0.1", port: "55441", pathname: "/kmt_batch10", username: "kmt_batch10" });
  const [identity] = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; directory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS directory
  `;
  expect(identity).toMatchObject({ database: "kmt_batch10", username: "kmt_batch10", port: 55441 });
  expect(resolve(identity.directory)).toBe(expectedDataDirectory);
  const [environmentMarker] = await prisma.$queryRaw<Array<{ marker: string }>>`
    SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'
  `;
  expect(environmentMarker?.marker).toBe("synthetic-batch10-only");
}

async function createFixture() {
  marker = `[BATCH10:${randomUUID()}]`;
  const suffix = marker.replace(/[^a-f0-9]/gi, "").slice(-18).toLowerCase();
  const password = "Batch10-Disposable-Only!2026";
  const passwordHash = await hashPassword(password);
  const [clientRole, officeRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "Client" } }),
    prisma.role.findUniqueOrThrow({ where: { name: "Office Admin" } })
  ]);
  const [clientUser, officeUser] = await Promise.all([
    prisma.user.create({ data: { name: `${marker} client`, email: `client.${suffix}@example.invalid`, passwordHash, roleId: clientRole.id, status: "ACTIVE", locale: "en" } }),
    prisma.user.create({ data: { name: `${marker} office`, email: `office.${suffix}@example.invalid`, passwordHash, roleId: officeRole.id, status: "ACTIVE", locale: "ar" } })
  ]);
  const client = await prisma.client.create({
    data: { userId: clientUser.id, fullName: `${marker} client`, phone: `201${suffix.replace(/[^0-9]/g, "7").slice(0, 9)}`, status: "ACTIVE", source: marker }
  });
  const thread = await prisma.conversationThread.create({
    data: {
      clientId: client.id,
      subject: `${marker} browser conversation`,
      status: "WAITING_STAFF",
      messages: { create: { senderType: "CLIENT", senderUserId: clientUser.id, body: `${marker} initial browser message` } }
    }
  });
  return { password, clientUser, officeUser, client, thread };
}

async function cleanupFixture() {
  await assertIdentity();
  if (!/^\[BATCH10:[0-9a-f-]{36}\]$/.test(marker)) throw new Error("Refusing cleanup without a valid Batch 10 marker.");
  const users = await prisma.user.findMany({ where: { name: { startsWith: marker } }, select: { id: true } });
  const clients = await prisma.client.findMany({ where: { source: marker }, select: { id: true } });
  const userIds = users.map(({ id }) => id);
  const clientIds = clients.map(({ id }) => id);
  await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { clientId: { in: clientIds } }] } });
  await prisma.conversationThread.deleteMany({ where: { clientId: { in: clientIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  expect(await prisma.user.count({ where: { name: { startsWith: marker } } })).toBe(0);
  expect(await prisma.client.count({ where: { source: marker } })).toBe(0);
}

async function login(page: Page, email: string, destination: string) {
  await page.goto(`/login?next=${encodeURIComponent(destination)}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(fixture.password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === destination),
    page.locator('button[type="submit"]').click()
  ]);
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

async function exerciseContactRecovery(page: Page, locale: "en" | "ar", viewport: { width: number; height: number }) {
  const copy = getPublicContent(locale).contactForm;
  let attempts = 0;
  await page.route("**/api/public/contact?**", async (route) => {
    attempts += 1;
    if (attempts === 1) return route.abort("failed");
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ requestId: `batch10-${locale}-retry` }) });
  });
  await page.setViewportSize(viewport);
  await page.goto(locale === "ar" ? "/ar/contact" : "/contact", { waitUntil: "domcontentloaded" });
  const form = page.getByTestId("contact-form");
  await expect(form).toHaveAttribute("data-hydrated", "true");
  await form.locator('input[name="fullName"]').fill(`${marker} ${locale} contact`);
  await form.locator('input[name="email"]').fill(`contact.${locale}@example.invalid`);
  await form.locator('textarea[name="message"]').fill(`${marker} retained browser message`);
  await form.locator('input[type="checkbox"]').check();
  const submit = form.getByRole("button", { name: copy.submit });
  await submit.focus();
  await submit.press("Enter");
  await expect(form.getByRole("alert")).toHaveText(copy.fallbackError);
  await expect(form.locator('textarea[name="message"]')).toHaveValue(`${marker} retained browser message`);
  await expectNoHorizontalOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ fullPage: true, path: resolve(evidenceDirectory, `contact-${locale}-failure-${viewport.width}.png`) });
  await submit.focus();
  await submit.press("Enter");
  await expect(form.getByRole("status")).toHaveText(copy.success);
  expect(attempts).toBe(2);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await page.screenshot({ fullPage: true, path: resolve(evidenceDirectory, `contact-${locale}-retry-${viewport.width}.png`) });
}

test.describe.serial("Batch 10 browser recovery evidence", () => {
  test.skip(!enabled, "Requires the isolated Batch 10 database only.");
  test.setTimeout(120_000);
  test.beforeAll(async () => {
    await assertIdentity();
    await fs.mkdir(evidenceDirectory, { recursive: true });
    fixture = await createFixture();
  });
  test.afterAll(async () => {
    await cleanupFixture();
    await assertIdentity();
    await prisma.$disconnect();
  });

  test("contact form preserves input and retries in English at 390px", async ({ page }) => {
    await exerciseContactRecovery(page, "en", { width: 390, height: 844 });
  });

  test("contact form preserves input and retries in Arabic at 768px", async ({ page }) => {
    await exerciseContactRecovery(page, "ar", { width: 768, height: 1024 });
  });

  test("client team chat sends from the real page with synthetic database state at 390px", async ({ page }) => {
    const copy = getClientContent("en");
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, fixture.clientUser.email, "/client/assistant");
    await page.getByRole("button", { name: copy.assistant.talkToTeam }).click();
    await expect(page.getByText(`${marker} initial browser message`)).toBeVisible();
    const input = page.getByLabel(copy.teamChat.inputLabel);
    const message = `${marker} client browser reply`;
    await input.fill(message);
    const replyResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/messages"));
    await page.getByRole("button", { name: copy.teamChat.send }).focus();
    await page.getByRole("button", { name: copy.teamChat.send }).press("Enter");
    expect((await replyResponse).status()).toBe(200);
    await expect(page.getByText(message)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(await prisma.conversationMessage.count({ where: { threadId: fixture.thread.id, body: message } })).toBe(1);
    await page.screenshot({ fullPage: true, path: resolve(evidenceDirectory, "client-chat-390.png") });
  });

  test("staff chat sends from the real page with synthetic database state at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page, fixture.officeUser.email, `/admin/messages/${fixture.thread.id}`);
    const input = page.getByPlaceholder("اكتب رد الفريق للعميل...");
    const message = `${marker} staff browser reply`;
    await input.fill(message);
    const submit = input.locator("xpath=ancestor::form").getByRole("button", { name: "إرسال" });
    const replyResponse = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/messages"));
    await submit.focus();
    await submit.press("Enter");
    expect((await replyResponse).status()).toBe(200);
    await expect(page.getByText(message)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(await prisma.conversationMessage.count({ where: { threadId: fixture.thread.id, body: message } })).toBe(1);
    await page.screenshot({ fullPage: true, path: resolve(evidenceDirectory, "admin-chat-1440.png") });
  });
});
