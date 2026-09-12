import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { savePrivateFile } from "@/server/storage/vps-storage";

const enabled = process.env.BATCH9_ISOLATED_DB === "true" && process.env.APP_ENV === "local" && process.env.NODE_ENV !== "production";
const storageRoot = resolve(process.cwd(), "_workspace", "batch9-storage", "private");
const pdf = Buffer.from("%PDF-1.4\n% Batch 9 synthetic fixture\n%%EOF\n");
let marker = "";
let fixture: Awaited<ReturnType<typeof createFixture>>;

async function assertIdentity() {
  expect(new URL(process.env.DATABASE_URL || "")).toMatchObject({ hostname: "127.0.0.1", port: "55440", pathname: "/kmt_batch9" });
  expect(resolve(process.env.UPLOADS_DIR || "")).toBe(storageRoot);
  const [identity] = await prisma.$queryRaw<Array<{ database: string; user: string; port: string; directory: string }>>`
    SELECT current_database() AS database, current_user AS user, inet_server_port()::text AS port, current_setting('data_directory') AS directory
  `;
  expect(identity).toMatchObject({ database: "kmt_batch9", user: "kmt_batch9", port: "55440" });
  expect(resolve(identity.directory)).toBe(resolve(process.cwd(), "_workspace", "batch9-postgres", "data"));
}

async function login(target: Page | APIRequestContext, email: string, destination = "/admin/documents") {
  if ("goto" in target) {
    await target.goto(`/login?next=${encodeURIComponent(destination)}`, { waitUntil: "domcontentloaded" });
    await target.locator('input[name="email"]').fill(email);
    await target.locator('input[name="password"]').fill("Batch9-Disposable-Only!2026");
    await Promise.all([target.waitForURL((url) => url.pathname.startsWith(destination.split("?")[0])), target.locator('button[type="submit"]').click()]);
    return;
  }
  expect((await target.post("/api/auth/login", { headers: { Origin: "http://127.0.0.1:3113" }, data: { email, password: "Batch9-Disposable-Only!2026" } })).status()).toBe(200);
}

async function createFixture() {
  marker = `[BATCH9:${randomUUID()}]`;
  const suffix = marker.slice(8, -1).replace(/-/g, "").slice(0, 18);
  const passwordHash = await hashPassword("Batch9-Disposable-Only!2026");
  const [clientRole, officeRole, lawyerRole] = await Promise.all(["Client", "Office Admin", "Lawyer"].map((name) => prisma.role.findUniqueOrThrow({ where: { name } })));
  const [ownerUser, otherUser, office, lawyer, otherLawyer] = await Promise.all([
    prisma.user.create({ data: { name: `${marker} owner`, email: `owner.${suffix}@example.invalid`, passwordHash, roleId: clientRole.id, status: "ACTIVE" } }),
    prisma.user.create({ data: { name: `${marker} other`, email: `other.${suffix}@example.invalid`, passwordHash, roleId: clientRole.id, status: "ACTIVE" } }),
    prisma.user.create({ data: { name: `${marker} office`, email: `office.${suffix}@example.invalid`, passwordHash, roleId: officeRole.id, status: "ACTIVE" } }),
    prisma.user.create({ data: { name: `${marker} lawyer`, email: `lawyer.${suffix}@example.invalid`, passwordHash, roleId: lawyerRole.id, status: "ACTIVE" } }),
    prisma.user.create({ data: { name: `${marker} other lawyer`, email: `other-lawyer.${suffix}@example.invalid`, passwordHash, roleId: lawyerRole.id, status: "ACTIVE" } })
  ]);
  const [owner, other] = await Promise.all([
    prisma.client.create({ data: { userId: ownerUser.id, fullName: `${marker} owner`, phone: `201${suffix.slice(0, 9).replace(/[^0-9]/g, "0")}`, assignedLawyerId: lawyer.id, status: "ACTIVE", source: marker } }),
    prisma.client.create({ data: { userId: otherUser.id, fullName: `${marker} other`, phone: `202${suffix.slice(0, 9).replace(/[^0-9]/g, "1")}`, assignedLawyerId: otherLawyer.id, status: "ACTIVE", source: marker } })
  ]);
  const targetCase = await prisma.legalCase.create({ data: { internalFileNumber: `B9-T-${suffix}`, title: `${marker} target`, caseType: "BATCH9", clientId: owner.id, assignedLawyerId: lawyer.id, status: "ACTIVE", priority: "NORMAL" } });
  await prisma.legalCase.createMany({ data: Array.from({ length: 101 }, (_, index) => ({ internalFileNumber: `B9-${suffix}-${index}`, title: `${marker} newer ${index}`, caseType: "BATCH9", clientId: owner.id, assignedLawyerId: lawyer.id, status: "ACTIVE" as const, priority: "NORMAL" as const })) });
  const otherCase = await prisma.legalCase.create({ data: { internalFileNumber: `B9-O-${suffix}`, title: `${marker} other case`, caseType: "BATCH9", clientId: other.id, assignedLawyerId: otherLawyer.id, status: "ACTIVE", priority: "NORMAL" } });
  return { ownerUser, otherUser, office, lawyer, otherLawyer, owner, other, targetCase, otherCase };
}

async function cleanup() {
  await assertIdentity();
  if (!/^\[BATCH9:[0-9a-f-]{36}\]$/.test(marker)) return;
  expect(resolve(process.env.UPLOADS_DIR || "")).toBe(storageRoot);
  const users = await prisma.user.findMany({ where: { name: { startsWith: marker } }, select: { id: true } });
  const userIds = users.map((row) => row.id);
  const clients = await prisma.client.findMany({ where: { source: marker }, select: { id: true } });
  const clientIds = clients.map((row) => row.id);
  const cases = await prisma.legalCase.findMany({ where: { clientId: { in: clientIds } }, select: { id: true } });
  const caseIds = cases.map((row) => row.id);
  await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { clientId: { in: clientIds } }, { caseId: { in: caseIds } }] } });
  await prisma.document.deleteMany({ where: { OR: [{ caseId: { in: caseIds } }, { ownerClientId: { in: clientIds } }, { fileName: { startsWith: marker } }] } });
  await prisma.legalCase.deleteMany({ where: { id: { in: caseIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await fs.rm(storageRoot, { recursive: true, force: true });
}

test.describe("Batch 9 isolated document lifecycle", () => {
  test.skip(!enabled, "Requires the isolated Batch 9 database only.");
  test.setTimeout(180_000);

  test.beforeAll(async () => { await assertIdentity(); fixture = await createFixture(); });
  test.afterAll(async () => { await cleanup(); await assertIdentity(); await prisma.$disconnect(); });

  test("retains the current case outside 100 options and uploads it from the case tab", async ({ page }, testInfo) => {
    await login(page, fixture.office.email, `/admin/cases/${fixture.targetCase.id}?tab=documents`);
    const form = page.locator('form').filter({ has: page.locator('input[type="file"]') });
    await expect(form.locator('select[name="caseId"]')).toHaveValue(fixture.targetCase.id);
    await expect(form.locator('select[name="caseId"] option[value="' + fixture.targetCase.id + '"]')).toHaveCount(1);
    const fileName = `${marker} retained.pdf`;
    await form.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: pdf });
    const pending = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/files/upload");
    await form.locator('button[type="submit"]').click();
    expect((await pending).status()).toBe(201);
    const document = await prisma.document.findFirstOrThrow({ where: { fileName } });
    expect(document).toMatchObject({ caseId: fixture.targetCase.id, ownerClientId: null });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: fileName, exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: testInfo.outputPath("case-upload-390.png") });
    await page.setViewportSize({ width: 768, height: 1024 }); await page.screenshot({ path: testInfo.outputPath("case-upload-768.png") });
    await page.setViewportSize({ width: 1440, height: 1024 }); await page.screenshot({ path: testInfo.outputPath("case-upload-1440.png") });
  });

  test("enforces confirmed deletion, preserves bytes, scopes access, and stays deleted under concurrent actions", async ({ page }) => {
    await login(page, fixture.office.email);
    const fileName = `${marker} lifecycle.pdf`;
    const fileKey = `batch9/${randomUUID()}.pdf`;
    await savePrivateFile({ fileKey, bytes: pdf });
    const document = await prisma.document.create({ data: { fileName, fileKey, fileType: "application/pdf", fileSize: pdf.length, ownerClientId: fixture.owner.id, caseId: fixture.targetCase.id, uploadedById: fixture.office.id, visibility: "CLIENT_VISIBLE" } });
    const valid = { status: "ACCEPTED", category: "OTHER", visibility: "CLIENT_VISIBLE" };
    expect((await page.request.patch(`/api/admin/documents/${document.id}`, { data: { ...valid, status: "DELETED" } })).status()).toBe(400);
    expect((await page.request.post(`/api/admin/documents/${document.id}/delete`, { data: { confirmDelete: false } })).status()).toBe(400);
    expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
    expect((await page.request.patch(`/api/admin/documents/${document.id}`, { data: valid })).status()).toBe(200);
    const beforeDeleteAudits = await prisma.auditLog.count({ where: { documentId: document.id, action: "document.delete" } });
    const deletes = await Promise.all([1, 2].map(() => page.request.post(`/api/admin/documents/${document.id}/delete`, { data: { confirmDelete: true } })));
    expect(deletes.map((response) => response.status()).sort()).toEqual([200, 404]);
    const deleted = await prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(deleted).toMatchObject({ status: "DELETED" }); expect(deleted.deletedAt).not.toBeNull();
    expect(await fs.readFile(resolve(storageRoot, deleted.fileKey))).toEqual(pdf);
    expect((await page.request.get(`/api/files/${document.id}/download`)).status()).toBe(404);
    expect(await prisma.auditLog.count({ where: { documentId: document.id, action: "document.delete" } })).toBe(beforeDeleteAudits + 1);
  });
});
