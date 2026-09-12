import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type APIRequestContext, type APIResponse, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";
import { savePrivateFile } from "@/server/storage/vps-storage";

const origin = "http://127.0.0.1:3113";
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

async function loginRequest(target: APIRequestContext, email: string) {
  const response = await target.post("/api/auth/login", { headers: { Origin: origin }, data: { email, password: "Batch9-Disposable-Only!2026" } });
  expect(response.status()).toBe(200);
}

async function loginPage(page: Page, email: string, destination: string) {
  await page.goto(`/login?next=${encodeURIComponent(destination)}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("Batch9-Disposable-Only!2026");
  await Promise.all([page.waitForURL((url) => url.pathname === destination.split("?")[0]), page.locator('button[type="submit"]').click()]);
}

async function contextFor(browser: Browser, email?: string) {
  const context = await browser.newContext({ baseURL: origin });
  if (email) await loginRequest(context.request, email);
  return context;
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
  const targetCase = await prisma.legalCase.create({ data: { internalFileNumber: `B9-T-${suffix}`, title: `${marker} target`, caseType: "BATCH9", clientId: owner.id, assignedLawyerId: lawyer.id, status: "ACTIVE", priority: "NORMAL", updatedAt: new Date("2000-01-01T00:00:00.000Z") } });
  await prisma.legalCase.createMany({ data: Array.from({ length: 101 }, (_, index) => ({ internalFileNumber: `B9-${suffix}-${index}`, title: `${marker} newer ${index}`, caseType: "BATCH9", clientId: owner.id, assignedLawyerId: lawyer.id, status: "ACTIVE" as const, priority: "NORMAL" as const })) });
  const otherCase = await prisma.legalCase.create({ data: { internalFileNumber: `B9-O-${suffix}`, title: `${marker} other case`, caseType: "BATCH9", clientId: other.id, assignedLawyerId: otherLawyer.id, status: "ACTIVE", priority: "NORMAL" } });
  return { ownerUser, otherUser, office, lawyer, otherLawyer, owner, other, targetCase, otherCase };
}

async function createDocument(input: { name: string; ownerClientId?: string | null; caseId?: string | null; visibility: "CLIENT_VISIBLE" | "STAFF_ONLY" }) {
  const fileKey = `batch9/${randomUUID()}.pdf`;
  await savePrivateFile({ fileKey, bytes: pdf });
  return prisma.document.create({ data: { fileName: `${marker} ${input.name}.pdf`, fileKey, fileType: "application/pdf", fileSize: pdf.length, ownerClientId: input.ownerClientId ?? null, caseId: input.caseId ?? null, uploadedById: fixture.office.id, visibility: input.visibility } });
}

async function fileCount(directory = storageRoot): Promise<number> {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => []);
  let count = 0;
  for (const entry of entries) count += entry.isDirectory() ? await fileCount(resolve(directory, entry.name)) : 1;
  return count;
}

async function waitForBlockedDocumentWrites(minimum: number) {
  await expect.poll(async () => {
    const [row] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*)::bigint AS count FROM pg_stat_activity
      WHERE datname = current_database() AND wait_event_type = 'Lock' AND query ILIKE '%documents%' AND state = 'active'
    `;
    return Number(row.count);
  }, { timeout: 15_000 }).toBeGreaterThanOrEqual(minimum);
}

async function cleanup() {
  await assertIdentity();
  if (!/^\[BATCH9:[0-9a-f-]{36}\]$/.test(marker)) return;
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

test.describe.serial("Batch 9 isolated document acceptance", () => {
  test.skip(!enabled, "Requires the isolated Batch 9 database only.");
  test.setTimeout(180_000);
  test.beforeAll(async () => { await assertIdentity(); fixture = await createFixture(); });
  test.afterAll(async () => { await cleanup(); await assertIdentity(); await prisma.$disconnect(); });

  test("retains an old current case outside the first 100 and refreshes the case tab after upload", async ({ page }, testInfo) => {
    await loginPage(page, fixture.office.email, `/admin/cases/${fixture.targetCase.id}?tab=documents`);
    const form = page.locator('form').filter({ has: page.locator('input[type="file"]') });
    const caseSelect = form.locator('select[name="caseId"]');
    await expect(caseSelect).toHaveValue(fixture.targetCase.id);
    await expect(caseSelect.locator(`option[value="${fixture.targetCase.id}"]`)).toHaveText(/مرتبطة حاليًا/);
    expect(await caseSelect.locator("option").count()).toBe(102);
    const fileName = `${marker} retained.pdf`;
    await form.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: pdf });
    const pending = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/files/upload");
    await form.locator('button[type="submit"]').click();
    expect((await pending).status()).toBe(201);
    await expect(page.getByText("تم رفع المستند.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: fileName, exact: true })).toBeVisible();
    expect(await prisma.document.findFirstOrThrow({ where: { fileName } })).toMatchObject({ caseId: fixture.targetCase.id, ownerClientId: null });
    await page.setViewportSize({ width: 1440, height: 1024 });
    await form.screenshot({ path: testInfo.outputPath("case-upload-1440.png") });
  });

  test("uploads from the general library and rejects mismatched or foreign targets without residue", async ({ page }) => {
    await loginPage(page, fixture.office.email, "/admin/documents");
    const form = page.locator('form').filter({ has: page.locator('input[type="file"]') });
    const caseId = await form.locator('select[name="caseId"] option:not([value=""])').first().getAttribute("value");
    expect(caseId).toBeTruthy();
    await form.locator('select[name="caseId"]').selectOption(caseId!);
    const fileName = `${marker} library.pdf`;
    await form.locator('input[type="file"]').setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: pdf });
    const pending = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/files/upload");
    await form.locator('button[type="submit"]').click();
    expect((await pending).status()).toBe(201);
    expect(await prisma.document.findFirstOrThrow({ where: { fileName } })).toMatchObject({ caseId, ownerClientId: null });
    const beforeRows = await prisma.document.count({ where: { fileName: { startsWith: marker } } });
    const beforeFiles = await fileCount();
    const mismatch = await page.request.post("/api/files/upload", { multipart: { file: { name: `${marker} mismatch.pdf`, mimeType: "application/pdf", buffer: pdf }, ownerClientId: fixture.owner.id, caseId: fixture.otherCase.id, category: "OTHER", visibility: "CLIENT_VISIBLE" } });
    expect(mismatch.status()).toBe(400);
    const clientContext = await page.context().browser()!.newContext({ baseURL: origin });
    try {
      await loginRequest(clientContext.request, fixture.ownerUser.email);
      const foreign = await clientContext.request.post("/api/files/upload", { multipart: { file: { name: `${marker} foreign.pdf`, mimeType: "application/pdf", buffer: pdf }, caseId: fixture.otherCase.id, category: "OTHER", visibility: "CLIENT_VISIBLE" } });
      expect(foreign.status()).toBe(403);
    } finally { await clientContext.close(); }
    expect(await prisma.document.count({ where: { fileName: { startsWith: marker } } })).toBe(beforeRows);
    expect(await fileCount()).toBe(beforeFiles);
  });

  test("enforces independent office, lawyer, client, and guest document scopes", async ({ browser }) => {
    const visible = await createDocument({ name: "case-visible", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
    const staff = await createDocument({ name: "case-staff", ownerClientId: fixture.owner.id, caseId: fixture.targetCase.id, visibility: "STAFF_ONLY" });
    const other = await createDocument({ name: "other-visible", caseId: fixture.otherCase.id, visibility: "CLIENT_VISIBLE" });
    const sessions: Array<{ name: string; email?: string; list: number; visible: number; staff: number; mutate: number }> = [
      { name: "office", email: fixture.office.email, list: 200, visible: 200, staff: 200, mutate: 200 },
      { name: "assigned lawyer", email: fixture.lawyer.email, list: 200, visible: 200, staff: 200, mutate: 403 },
      { name: "other lawyer", email: fixture.otherLawyer.email, list: 200, visible: 403, staff: 403, mutate: 403 },
      { name: "owner client", email: fixture.ownerUser.email, list: 403, visible: 200, staff: 403, mutate: 403 },
      { name: "other client", email: fixture.otherUser.email, list: 403, visible: 403, staff: 403, mutate: 403 },
      { name: "guest", list: 401, visible: 401, staff: 401, mutate: 401 }
    ];
    const contexts: BrowserContext[] = [];
    try {
      for (const expected of sessions) {
        const context = await contextFor(browser, expected.email); contexts.push(context);
        const list = await context.request.get("/api/admin/documents?pageSize=80");
        expect(list.status(), `${expected.name} list`).toBe(expected.list);
        if (expected.list === 200) {
          const ids = ((await list.json()).data.items as Array<{ id: string }>).map((item) => item.id);
          expect(ids.includes(visible.id), `${expected.name} target scope`).toBe(expected.name !== "other lawyer");
          expect(ids.includes(other.id), `${expected.name} other scope`).toBe(expected.name !== "assigned lawyer");
        }
        expect((await context.request.get(`/api/files/${visible.id}/download`)).status(), `${expected.name} visible download`).toBe(expected.visible);
        expect((await context.request.get(`/api/files/${staff.id}/download`)).status(), `${expected.name} staff download`).toBe(expected.staff);
        if (expected.name !== "office") {
          expect((await context.request.patch(`/api/admin/documents/${visible.id}`, { data: { status: "ACCEPTED", category: "OTHER", visibility: "CLIENT_VISIBLE" } })).status(), `${expected.name} patch`).toBe(expected.mutate);
          expect((await context.request.post(`/api/admin/documents/${visible.id}/delete`, { data: { confirmDelete: true } })).status(), `${expected.name} delete`).toBe(expected.mutate);
        }
      }
      expect((await prisma.document.findUniqueOrThrow({ where: { id: visible.id } })).deletedAt).toBeNull();
      await prisma.legalCase.update({ where: { id: fixture.targetCase.id }, data: { deletedAt: new Date() } });
      try {
        const ownerPage = await contexts[3].newPage(); await ownerPage.goto("/client/files", { waitUntil: "domcontentloaded" });
        await expect(ownerPage.getByRole("link", { name: visible.fileName, exact: true }).first()).toBeVisible();
        await expect(ownerPage.getByText(staff.fileName, { exact: true })).toHaveCount(0);
        const otherPage = await contexts[4].newPage(); await otherPage.goto("/client/files", { waitUntil: "domcontentloaded" });
        await expect(otherPage.getByText(visible.fileName, { exact: true })).toHaveCount(0);
        expect((await contexts[1].request.get(`/api/files/${visible.id}/download`)).status()).toBe(200);
      } finally { await prisma.legalCase.update({ where: { id: fixture.targetCase.id }, data: { deletedAt: null } }); }
    } finally { await Promise.all(contexts.map((context) => context.close())); }
  });

  test("serializes update-first, delete-first, and double-delete outcomes with one audit per success", async ({ page }) => {
    await loginPage(page, fixture.office.email, "/admin/documents");
    const valid = { status: "ACCEPTED", category: "OTHER", visibility: "CLIENT_VISIBLE" };
    const first = await createDocument({ name: "update-first", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
    let releaseFirst!: () => void;
    let firstLocked!: () => void;
    const firstLockedPromise = new Promise<void>((done) => { firstLocked = done; });
    const releaseFirstPromise = new Promise<void>((done) => { releaseFirst = done; });
    const firstBlocker = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM documents WHERE id = ${first.id}::uuid FOR UPDATE`;
      firstLocked();
      await releaseFirstPromise;
    }, { timeout: 30_000 });
    const firstRequests: Array<Promise<APIResponse>> = [];
    let firstCoordinationError: unknown;
    try {
      await firstLockedPromise;
      firstRequests.push(page.request.patch(`/api/admin/documents/${first.id}`, { data: valid }));
      await waitForBlockedDocumentWrites(1);
      firstRequests.push(page.request.post(`/api/admin/documents/${first.id}/delete`, { data: { confirmDelete: true } }));
      await waitForBlockedDocumentWrites(2);
    } catch (error) {
      firstCoordinationError = error;
    } finally {
      releaseFirst();
      await firstBlocker;
      if (firstCoordinationError) await Promise.allSettled(firstRequests);
    }
    if (firstCoordinationError) throw firstCoordinationError;
    const [updateFirst, deleteSecond] = await Promise.all(firstRequests);
    expect(updateFirst.status()).toBe(200);
    expect((await updateFirst.json()).data).toMatchObject({ id: first.id, status: "ACCEPTED" });
    expect(deleteSecond.status()).toBe(200);
    expect((await deleteSecond.json()).data).toMatchObject({ id: first.id, status: "DELETED" });
    expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.update" } })).toBe(1);
    expect(await prisma.auditLog.count({ where: { documentId: first.id, action: "document.delete" } })).toBe(1);
    expect((await prisma.document.findUniqueOrThrow({ where: { id: first.id } })).deletedAt).not.toBeNull();
    const second = await createDocument({ name: "delete-first", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
    let locked!: () => void; let release!: () => void;
    const lockedPromise = new Promise<void>((done) => { locked = done; });
    const releasePromise = new Promise<void>((done) => { release = done; });
    const blocker = prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT id FROM documents WHERE id = ${second.id}::uuid FOR UPDATE`; locked(); await releasePromise; }, { timeout: 30_000 });
    const secondRequests: Array<Promise<APIResponse>> = [];
    let secondCoordinationError: unknown;
    try {
      await lockedPromise;
      secondRequests.push(page.request.post(`/api/admin/documents/${second.id}/delete`, { data: { confirmDelete: true } }));
      await waitForBlockedDocumentWrites(1);
      secondRequests.push(page.request.patch(`/api/admin/documents/${second.id}`, { data: valid }));
      await waitForBlockedDocumentWrites(2);
    } catch (error) {
      secondCoordinationError = error;
    } finally {
      release();
      await blocker;
      if (secondCoordinationError) await Promise.allSettled(secondRequests);
    }
    if (secondCoordinationError) throw secondCoordinationError;
    const [deleteFirst, updateSecond] = await Promise.all(secondRequests);
    expect(deleteFirst.status()).toBe(200);
    expect((await deleteFirst.json()).data).toMatchObject({ id: second.id, status: "DELETED" });
    expect(updateSecond.status()).toBe(404);
    expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.update" } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { documentId: second.id, action: "document.delete" } })).toBe(1);
    const third = await createDocument({ name: "double-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
    const deletes = await Promise.all([1, 2].map(() => page.request.post(`/api/admin/documents/${third.id}/delete`, { data: { confirmDelete: true } })));
    expect(deletes.map((response) => response.status()).sort()).toEqual([200, 404]);
    expect(await prisma.auditLog.count({ where: { documentId: third.id, action: "document.delete" } })).toBe(1);
  });

  test("requires keyboard confirmation, sends one delete, hides the row, and preserves bytes", async ({ page }, testInfo) => {
    const document = await createDocument({ name: "ui-delete", caseId: fixture.targetCase.id, visibility: "CLIENT_VISIBLE" });
    let deleteRequests = 0;
    page.on("request", (request) => { if (request.method() === "POST" && new URL(request.url()).pathname === `/api/admin/documents/${document.id}/delete`) deleteRequests += 1; });
    await loginPage(page, fixture.office.email, `/admin/documents?q=${encodeURIComponent(document.fileName)}`);
    await page.setViewportSize({ width: 390, height: 844 });
    const card = page.locator("details:visible").filter({ hasText: document.fileName }).first();
    await card.locator("summary").click();
    const deleteForm = card.locator('form').filter({ has: page.locator('input[name="confirmDelete"]') });
    const checkbox = deleteForm.locator('input[name="confirmDelete"]');
    await deleteForm.locator('button[type="submit"]').click();
    await expect(checkbox).toBeFocused();
    expect(deleteRequests).toBe(0);
    expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
    await checkbox.press("Space"); await expect(checkbox).toBeChecked();
    await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-390.png") });
    await card.locator("summary").click();
    await expect(deleteForm).toBeHidden();
    expect(deleteRequests).toBe(0);
    expect((await prisma.document.findUniqueOrThrow({ where: { id: document.id } })).deletedAt).toBeNull();
    await page.setViewportSize({ width: 768, height: 1024 });
    await card.locator("summary").click();
    await expect(deleteForm).toBeVisible();
    await checkbox.focus();
    await checkbox.press("Space");
    await expect(checkbox).toBeChecked();
    await deleteForm.screenshot({ path: testInfo.outputPath("delete-confirmation-768.png") });
    const response = page.waitForResponse((candidate) => new URL(candidate.url()).pathname === `/api/admin/documents/${document.id}/delete`);
    await deleteForm.locator('button[type="submit"]').click();
    expect((await response).status()).toBe(200);
    expect(deleteRequests).toBe(1);
    await expect(page.getByRole("link", { name: document.fileName, exact: true })).toHaveCount(0);
    const deleted = await prisma.document.findUniqueOrThrow({ where: { id: document.id } });
    expect(deleted.deletedAt).not.toBeNull();
    expect(await fs.readFile(resolve(storageRoot, deleted.fileKey))).toEqual(pdf);
    expect((await page.request.get(`/api/files/${document.id}/download`)).status()).toBe(404);
  });
});
