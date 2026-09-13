import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH13_BROWSER === "true" && Boolean(process.env.DATABASE_URL);
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const marker = "batch13-browser-office-profile";
const password = "Batch13-Browser!2026";
const userId = randomUUID();
let superRoleId = "";

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch13 browser test requires APP_ENV=local.");
  const parsed = new URL(process.env.DATABASE_URL!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") {
    throw new Error("Batch13 browser test requires its authorized isolated connection identity.");
  }
  const identity = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"
  `;
  const current = identity[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) {
    throw new Error("Batch13 browser database identity or data directory verification failed.");
  }
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch13 browser synthetic database marker is missing.");
}

async function deleteOfficeProfile() {
  const office = await prisma.systemSetting.findUnique({ where: { key: "office.profile" }, select: { id: true } });
  if (office) await prisma.auditLog.deleteMany({ where: { resourceId: office.id } });
  await prisma.systemSetting.deleteMany({ where: { key: "office.profile" } });
}

async function login(page: import("@playwright/test").Page, baseURL: string) {
  const response = await page.request.post("/api/auth/login", {
    data: { email: `${userId}@example.test`, password },
    headers: { Origin: new URL(baseURL).origin }
  });
  expect(response.status()).toBe(200);
}

test.describe.serial("batch13 office profile browser recovery", () => {
  test.skip(!enabled, "Requires explicit Batch13 browser opt-in and the authorized disposable PostgreSQL database.");

  test.beforeAll(async () => {
    await assertSyntheticEnvironment();
    const role = await prisma.role.upsert({
      where: { name: "Super Admin" },
      update: { status: "ACTIVE" },
      create: { name: "Super Admin", status: "ACTIVE" }
    });
    superRoleId = role.id;
    await deleteOfficeProfile();
    await prisma.user.create({
      data: {
        id: userId,
        name: `${marker} super`,
        email: `${userId}@example.test`,
        passwordHash: await hashPassword(password),
        roleId: superRoleId,
        status: "ACTIVE",
        locale: "ar"
      }
    });
  });

  test.afterAll(async () => {
    await assertSyntheticEnvironment();
    await deleteOfficeProfile();
    await prisma.auditLog.deleteMany({ where: { actorId: userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  test("saves by keyboard, keeps success through refresh, and recovers from a real stale conflict", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3115");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await login(page, baseURL);
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "حفظ" })).toBeEnabled();

    await page.getByLabel("اسم المكتب").fill("KMT Browser First");
    await page.getByRole("button", { name: "حفظ" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("تم حفظ بيانات المكتب.")).toBeVisible();
    await expect.poll(async () => (await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } })).value).toMatchObject({ firmName: "KMT Browser First" });
    await expect(page.getByText(/بواسطة batch13-browser-office-profile super/)).toBeVisible();
    await expect(page.getByText("تم حفظ بيانات المكتب.")).toBeVisible();
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch13/evidence/office-profile-success-1440.png", fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("اسم المكتب").fill("KMT Browser Retained Draft");
    const current = await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } });
    await prisma.systemSetting.update({
      where: { id: current.id },
      data: {
        value: {
          firmName: "KMT Browser External Latest",
          publicPhone: "+20200000000",
          publicEmail: "external-latest@example.test",
          primaryLocale: "en"
        },
        updatedAt: new Date(current.updatedAt.getTime() + 1_000)
      }
    });
    const auditBeforeConflict = await prisma.auditLog.count({ where: { action: "settings.update", resourceId: current.id } });
    await page.getByRole("button", { name: "حفظ" }).click();

    await expect(page.getByText(/تغيرت بيانات المكتب بعد فتح النموذج/)).toBeVisible();
    await expect(page.getByLabel("اسم المكتب")).toHaveValue("KMT Browser Retained Draft");
    await expect(page.getByLabel("اسم المكتب")).toBeDisabled();
    await expect(page.getByRole("button", { name: "حفظ" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "تحميل أحدث بيانات المكتب" })).toBeVisible();
    expect(await prisma.auditLog.count({ where: { action: "settings.update", resourceId: current.id } })).toBe(auditBeforeConflict);
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch13/evidence/office-profile-conflict-390.png", fullPage: true });

    await page.getByRole("button", { name: "تحميل أحدث بيانات المكتب" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByLabel("اسم المكتب")).toHaveValue("KMT Browser External Latest");
    await expect(page.getByLabel("هاتف عام")).toHaveValue("+20200000000");
    await expect(page.getByLabel("بريد عام")).toHaveValue("external-latest@example.test");
    await page.getByLabel("اسم المكتب").fill("KMT Browser Reviewed Retry");
    await page.getByRole("button", { name: "حفظ" }).click();
    await expect(page.getByText("تم حفظ بيانات المكتب.")).toBeVisible();
    await expect.poll(async () => (await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } })).value).toMatchObject({ firmName: "KMT Browser Reviewed Retry" });

    expect(consoleErrors.filter((message) => !message.includes("409 (Conflict)"))).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("retains the draft after a browser-injected network failure", async ({ page }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3115");
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, baseURL);
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "حفظ" })).toBeEnabled();
    const auditBefore = await prisma.auditLog.count({ where: { action: "settings.update", actorId: userId } });
    let aborted = false;
    await page.route("**/api/admin/settings/office.profile", async (route) => {
      if (!aborted && route.request().method() === "PATCH") {
        aborted = true;
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await page.getByLabel("اسم المكتب").fill("KMT Browser Offline Draft");
    await page.getByRole("button", { name: "حفظ" }).click();
    await expect(page.getByText("لا يمكن الوصول إلى الخادم الآن. احتفظنا بالبيانات المدخلة.")).toBeVisible();
    await expect(page.getByLabel("اسم المكتب")).toHaveValue("KMT Browser Offline Draft");
    await expect(page.getByRole("button", { name: "حفظ" })).toBeEnabled();
    expect(aborted).toBe(true);
    expect(await prisma.auditLog.count({ where: { action: "settings.update", actorId: userId } })).toBe(auditBefore);
  });
});
