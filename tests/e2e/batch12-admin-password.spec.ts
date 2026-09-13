import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/prisma";

const enabled = Boolean(
  process.env.RUN_BATCH12_BROWSER === "true" &&
  process.env.DATABASE_URL &&
  process.env.APP_ENV === "local" &&
  process.env.NODE_ENV !== "production"
);
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const marker = `batch12-browser-${randomUUID()}`;
const initialPassword = "Batch12-Browser-Initial!2026";
const firstPassword = "Batch12-Browser-First!2026";
const stalePassword = "Batch12-Browser-Stale!2026";
const finalPassword = "Batch12-Browser-Final!2026";
const ids = { superAdmin: randomUUID(), target: randomUUID() };
let superRoleId = "";
let lawyerRoleId = "";

async function assertSyntheticEnvironment() {
  const parsed = new URL(process.env.DATABASE_URL!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") {
    throw new Error("Batch12 browser test requires its authorized isolated connection identity.");
  }
  const identity = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"
  `;
  const current = identity[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) {
    throw new Error("Batch12 browser database identity or data directory verification failed.");
  }
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch12 browser synthetic database marker is missing.");
}

test.describe.serial("batch12 admin password conflict recovery", () => {
  test.skip(!enabled, "Requires explicit Batch12 browser opt-in and the authorized disposable PostgreSQL database.");

  test.beforeAll(async () => {
    await assertSyntheticEnvironment();
    const [superRole, lawyerRole] = await Promise.all([
      prisma.role.upsert({ where: { name: "Super Admin" }, update: { status: "ACTIVE" }, create: { name: "Super Admin", status: "ACTIVE" } }),
      prisma.role.upsert({ where: { name: "Lawyer" }, update: { status: "ACTIVE" }, create: { name: "Lawyer", status: "ACTIVE" } })
    ]);
    superRoleId = superRole.id;
    lawyerRoleId = lawyerRole.id;
    const initialHash = await hashPassword(initialPassword);
    await prisma.user.createMany({
      data: [
        { id: ids.superAdmin, name: `${marker} super`, email: `${ids.superAdmin}@example.test`, passwordHash: initialHash, roleId: superRoleId, status: "ACTIVE", locale: "ar" },
        { id: ids.target, name: `${marker} target`, email: `${ids.target}@example.test`, passwordHash: initialHash, roleId: lawyerRoleId, status: "ACTIVE", locale: "ar" }
      ]
    });
  });

  test.afterAll(async () => {
    await assertSyntheticEnvironment();
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: Object.values(ids) } }, { resourceId: ids.target }] } });
    await prisma.session.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    await prisma.$disconnect();
  });

  test("succeeds on desktop and recovers explicitly from a stale mobile form", async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.setViewportSize({ width: 1440, height: 1000 });
    const login = await page.request.post("/api/auth/login", {
      data: { email: `${ids.superAdmin}@example.test`, password: initialPassword },
      headers: { Origin: new URL(String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3115")).origin }
    });
    expect(login.status()).toBe(200);
    await page.goto(`/admin/users/${ids.target}`, { waitUntil: "domcontentloaded" });

    await page.getByLabel("كلمة المرور الجديدة").fill(firstPassword);
    await page.getByLabel("تأكيد كلمة المرور").fill(firstPassword);
    await page.getByRole("button", { name: "تغيير كلمة المرور" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("تم تغيير كلمة المرور وتسجيل العملية.")).toBeVisible();
    expect(await verifyPassword(firstPassword, (await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } })).passwordHash)).toBe(true);
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch12/evidence/password-success-1440.png", fullPage: true });

    const auditBeforeConflict = await prisma.auditLog.count({ where: { action: "user.password.update", resourceId: ids.target } });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel("كلمة المرور الجديدة").fill(stalePassword);
    await page.getByLabel("تأكيد كلمة المرور").fill(stalePassword);
    await prisma.user.update({ where: { id: ids.target }, data: { name: `${marker} target edited` } });
    await page.getByRole("button", { name: "تغيير كلمة المرور" }).click();

    await expect(page.getByText(/تغيرت بيانات المستخدم بعد فتح الصفحة/)).toBeVisible();
    await expect(page.getByLabel("كلمة المرور الجديدة")).toHaveValue(stalePassword);
    await expect(page.getByRole("button", { name: "تغيير كلمة المرور" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "تحميل أحدث نسخة" })).toBeVisible();
    expect(await verifyPassword(stalePassword, (await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } })).passwordHash)).toBe(false);
    expect(await prisma.auditLog.count({ where: { action: "user.password.update", resourceId: ids.target } })).toBe(auditBeforeConflict);
    await page.screenshot({ path: "docs/reviews/2026-09-13/batch12/evidence/password-conflict-390.png", fullPage: true });

    await page.getByRole("button", { name: "تحميل أحدث نسخة" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByLabel("كلمة المرور الجديدة")).toHaveValue("");
    await page.getByLabel("كلمة المرور الجديدة").fill(finalPassword);
    await page.getByLabel("تأكيد كلمة المرور").fill(finalPassword);
    await page.getByRole("button", { name: "تغيير كلمة المرور" }).click();
    await expect(page.getByText("تم تغيير كلمة المرور وتسجيل العملية.")).toBeVisible();
    expect(await verifyPassword(finalPassword, (await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } })).passwordHash)).toBe(true);
    expect(consoleErrors.filter((message) => !message.includes("409 (Conflict)"))).toEqual([]);
    expect(consoleErrors.some((message) => message.includes("409 (Conflict)"))).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
