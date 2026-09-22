import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../../src/server/db/prisma";
import { createClientAccountSetupToken } from "../../src/server/portal/client-account-setup-service";

let setupUrl: string;
let clientId: string;
let userId: string;
const email = `setup-${randomUUID()}@example.test`;

test.describe("isolated sensitive form hydration", () => {
  test.skip(process.env.BATCH2_ISOLATED_DB !== "true", "Disposable database only");
  test.beforeAll(async ({ baseURL }) => {
    const database = new URL(process.env.DATABASE_URL || "");
    expect([database.hostname, database.port, database.pathname]).toEqual(["127.0.0.1", "55437", "/kmt_batch2"]);
    expect(process.env.APP_ENV).toBe("local");
    expect(baseURL).toBe("http://127.0.0.1:3109");
    expect(path.resolve(process.env.UPLOADS_DIR || "")).toBe(path.resolve("_workspace/batch2-postgres/uploads"));
    const rows = await prisma.$queryRaw<Array<{ directory: string }>>`SELECT current_setting('data_directory') AS directory`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch2-postgres/data"));
    const client = await prisma.client.create({ data: { fullName: "Setup Test Client", phone: `+201${Date.now().toString().slice(-9)}`, email } });
    clientId = client.id;
    const consultation = await prisma.consultationRequest.create({ data: { clientId, fullName: client.fullName, phone: client.phone, email, serviceCategory: "legal-consultation", summary: "Disposable account setup test", preferredMode: "ONLINE", locale: "en", status: "SCHEDULED" } });
    const token = createClientAccountSetupToken({ clientId, consultationId: consultation.id, email, locale: "en" });
    setupUrl = `/client-account/setup?token=${encodeURIComponent(token.value)}`;
    userId = (await prisma.user.findUniqueOrThrow({ where: { email: "client@kmt.local" } })).id;
  });
  test.afterAll(async () => { await prisma.$disconnect(); });

  test("valid setup invitation and installer are inert without JavaScript", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      for (const url of [setupUrl, "/install"]) {
        await page.goto(url);
        const form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
        await expect(form).toHaveCount(1);
        await expect(form).toHaveAttribute("method", "post");
        await expect(form.locator('input[name="password"]')).toBeDisabled();
        await expect(form.locator('input[name="confirmPassword"]')).toBeDisabled();
        await expect(form.locator('button[type="submit"]')).toBeDisabled();
      }
      // The installer token is outside the password form, not a successful form control.
      expect(await page.locator('input[name="token"]').evaluate((input: HTMLInputElement) => input.form === null)).toBe(true);
    } finally { await context.close(); }
  });

  test("staff credential forms rendered on first load are inert without JavaScript", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
    try {
      expect((await context.request.post("/api/auth/login", { headers: { Origin: baseURL! }, data: { email: "superadmin@kmt.local", password: "KmtLocalDev!2026" } })).status()).toBe(200);
      const page = await context.newPage();
      const linked = await prisma.client.findFirstOrThrow({ where: { userId } });
      for (const url of ["/admin/users", `/admin/users/${userId}`, `/admin/clients/${clientId}`, `/admin/clients/${linked.id}`]) {
        await page.goto(url);
        const form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
        await expect(form).toHaveCount(1);
        await expect(form).toHaveAttribute("method", "post");
        await expect(form.locator('input[name="password"]')).toBeDisabled();
        await expect(form.locator('button[type="submit"]')).toBeDisabled();
      }
    } finally { await context.close(); }
  });

  test("valid setup submits JSON and creates a working client session", async ({ page }) => {
    await page.goto(setupUrl, { waitUntil: "domcontentloaded" });
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("SetupFixture!2026");
    await page.locator('input[name="confirmPassword"]').fill("SetupFixture!2026");
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === "/api/public/client-account/setup");
    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;
    expect(response.request().method()).toBe("POST");
    expect(response.request().headers()["content-type"]).toContain("application/json");
    expect(response.ok()).toBe(true);
    await expect(page).toHaveURL(/\/client$/);
    expect((await page.request.get("/api/auth/me")).status()).toBe(200);
  });
});
