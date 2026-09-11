import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "../../src/server/db/prisma";

test.describe("isolated staff credential submissions", () => {
  test.skip(process.env.BATCH2_ISOLATED_DB !== "true", "Disposable database only");
  test.afterAll(async () => { await prisma.$disconnect(); });
  test("create and reset user and client passwords through hydrated forms", async ({ page, baseURL }) => {
    test.setTimeout(120000);
    const database = new URL(process.env.DATABASE_URL || "");
    expect([database.hostname, database.port, database.pathname, process.env.APP_ENV, baseURL]).toEqual(["127.0.0.1", "55437", "/kmt_batch2", "local", "http://127.0.0.1:3109"]);
    const rows = await prisma.$queryRaw<Array<{ directory: string }>>`SELECT current_setting('data_directory') AS directory`;
    expect(path.resolve(rows[0].directory)).toBe(path.resolve("_workspace/batch2-postgres/data"));
    expect((await page.request.post("/api/auth/login", { headers: { Origin: baseURL! }, data: { email: "superadmin@kmt.local", password: "KmtLocalDev!2026" } })).status()).toBe(200);
    const email = `staff-${randomUUID()}@example.test`;
    const role = await prisma.user.findUniqueOrThrow({ where: { email: "office.admin@kmt.local" }, select: { roleId: true } });
    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    let form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
    await form.locator('input[name="name"]').fill("Disposable Staff User");
    await form.locator('input[name="email"]').fill(email);
    await form.locator('select[name="roleId"]').selectOption(role.roleId);
    await form.locator('input[name="password"]').fill("StaffFixture!2026");
    await form.locator('input[name="confirmPassword"]').fill("StaffFixture!2026");
    await submit(page, "/api/admin/users");
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await page.goto(`/admin/users/${user.id}`, { waitUntil: "domcontentloaded" });
    form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
    await form.locator('input[name="password"]').fill("StaffUpdated!2026");
    await form.locator('input[name="confirmPassword"]').fill("StaffUpdated!2026");
    await submit(page, `/api/admin/users/${user.id}/password`);
    const clientEmail = `crm-${randomUUID()}@example.test`;
    const client = await prisma.client.create({ data: { fullName: "Disposable CRM Client", email: clientEmail, phone: `+201${Date.now().toString().slice(-9)}` } });
    await page.goto(`/admin/clients/${client.id}`, { waitUntil: "domcontentloaded" });
    form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
    await form.locator('input[name="password"]').fill("ClientFixture!2026");
    await submit(page, `/api/admin/clients/${client.id}/account`);
    await page.reload({ waitUntil: "domcontentloaded" });
    form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
    await form.locator('input[name="password"]').fill("ClientUpdated!2026");
    await submit(page, `/api/admin/clients/${client.id}/account/password`);
    for (const [loginEmail, password] of [[email, "StaffUpdated!2026"], [clientEmail, "ClientUpdated!2026"]]) {
      expect((await page.request.post("/api/auth/login", { headers: { Origin: baseURL! }, data: { email: loginEmail, password } })).status()).toBe(200);
    }
  });
});

async function submit(page: Page, endpoint: string) {
  const form = page.locator('form').filter({ has: page.locator('input[name="password"]') });
  const promise = page.waitForResponse(response => new URL(response.url()).pathname === endpoint && response.request().method() === "POST");
  await form.locator('button[type="submit"]').click();
  const response = await promise;
  expect(response.ok()).toBe(true);
  expect(response.request().headers()["content-type"]).toContain("application/json");
  expect(new URL(page.url()).searchParams.has("password")).toBe(false);
}
