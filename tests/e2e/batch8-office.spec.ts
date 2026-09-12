import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { hashPassword } from "@/server/auth/password";

const enabled = Boolean(
  process.env.BATCH8_ISOLATED_DB === "true" &&
  process.env.DATABASE_URL &&
  process.env.APP_ENV === "local" &&
  process.env.NODE_ENV !== "production"
);

type Fixture = Awaited<ReturnType<typeof createFixture>>;
let fixture: Fixture;
let fixtureMarker: string | undefined;

async function assertIsolatedDatabaseIdentity() {
  const [identity] = await prisma.$queryRaw<Array<{ dataDirectory: string; port: string; database: string }>>`
    SELECT current_setting('data_directory') AS "dataDirectory", inet_server_port()::text AS port, current_database() AS database
  `;
  expect(identity.port).toBe("55439");
  expect(identity.database).toBe("kmt_batch8");
  expect(identity.dataDirectory.replace(/\\/g, "/")).toBe(resolve(process.cwd(), "_workspace", "batch8-postgres", "data").replace(/\\/g, "/"));
}

async function login(page: import("@playwright/test").Page, email: string, destination: string) {
  const destinationPath = new URL(destination, "http://batch8.local").pathname;
  await page.goto(`/login?next=${encodeURIComponent(destination)}`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("Batch8-Disposable-Only!2026");
  await Promise.all([
    page.waitForURL((url) => url.pathname === destinationPath || url.pathname.startsWith(`${destinationPath}/`)),
    page.locator('button[type="submit"]').click()
  ]);
}

function taskPayload(task: {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedToId: string;
  caseId: string | null;
  dueDate: Date | null;
  updatedAt: Date;
}, overrides: Record<string, unknown> = {}) {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    assignedToId: task.assignedToId,
    caseId: task.caseId,
    dueDate: task.dueDate?.toISOString() ?? "",
    updatedAt: task.updatedAt.toISOString(),
    ...overrides
  };
}

async function createFixture() {
  const marker = `[BATCH8:${randomUUID()}]`;
  fixtureMarker = marker;
  const passwordHash = await hashPassword("Batch8-Disposable-Only!2026");
  const [clientRole, officeRole, lawyerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: "Client" }, select: { id: true } }),
    prisma.role.findUniqueOrThrow({ where: { name: "Office Admin" }, select: { id: true } }),
    prisma.role.findUniqueOrThrow({ where: { name: "Lawyer" }, select: { id: true } })
  ]);
  const suffix = marker.slice(8, -1).replace(/-/g, "").slice(0, 20);
  const phoneDigits = Array.from(suffix).map((character) => character.charCodeAt(0) % 10).join("").slice(0, 8);
  const [primaryUser, otherUser, office, lawyer, otherLawyer] = await Promise.all([
    prisma.user.create({ data: { name: `${marker} owner`, email: `owner.${suffix}@example.invalid`, passwordHash, roleId: clientRole.id, status: "ACTIVE", locale: "en" } }),
    prisma.user.create({ data: { name: `${marker} other`, email: `other.${suffix}@example.invalid`, passwordHash, roleId: clientRole.id, status: "ACTIVE", locale: "ar" } }),
    prisma.user.create({ data: { name: `${marker} office admin`, email: `office.${suffix}@example.invalid`, passwordHash, roleId: officeRole.id, status: "ACTIVE", locale: "ar" } }),
    prisma.user.create({ data: { name: `${marker} lawyer`, email: `lawyer.${suffix}@example.invalid`, passwordHash, roleId: lawyerRole.id, status: "ACTIVE", locale: "ar" } }),
    prisma.user.create({ data: { name: `${marker} other lawyer`, email: `other-lawyer.${suffix}@example.invalid`, passwordHash, roleId: lawyerRole.id, status: "ACTIVE", locale: "ar" } })
  ]);
  await Promise.all([
    prisma.lawyerProfile.create({ data: { userId: lawyer.id, publicSlug: `batch8-${suffix}-lawyer`, title: "محامي اختبار", bio: "Synthetic Batch 8 fixture.", specialties: ["BATCH8"], languages: ["ar"], isPublic: false, bookingEnabled: false } }),
    prisma.lawyerProfile.create({ data: { userId: otherLawyer.id, publicSlug: `batch8-${suffix}-other-lawyer`, title: "محامي اختبار ثان", bio: "Synthetic Batch 8 fixture.", specialties: ["BATCH8"], languages: ["ar"], isPublic: false, bookingEnabled: false } })
  ]);
  const [owner, other] = await Promise.all([
    prisma.client.create({ data: { userId: primaryUser.id, fullName: `${marker} owner`, phone: `+2018${phoneDigits}`, source: marker, status: "ACTIVE", assignedLawyerId: lawyer.id } }),
    prisma.client.create({ data: { userId: otherUser.id, fullName: `${marker} other`, phone: `+2017${phoneDigits}`, source: marker, status: "ACTIVE", assignedLawyerId: otherLawyer.id } })
  ]);
  const [activeCase, archivedCase, deletedCase, otherLawyerCase] = await Promise.all([
    prisma.legalCase.create({ data: { internalFileNumber: `B8-A-${suffix}`, clientId: owner.id, assignedLawyerId: lawyer.id, title: `${marker} active case`, caseType: "BATCH8", status: "ACTIVE", priority: "NORMAL" } }),
    prisma.legalCase.create({ data: { internalFileNumber: `B8-R-${suffix}`, clientId: owner.id, assignedLawyerId: lawyer.id, title: `${marker} archived case`, caseType: "BATCH8", status: "ARCHIVED", priority: "NORMAL" } }),
    prisma.legalCase.create({ data: { internalFileNumber: `B8-D-${suffix}`, clientId: owner.id, assignedLawyerId: lawyer.id, title: `${marker} deleted case`, caseType: "BATCH8", status: "ACTIVE", priority: "NORMAL" } }),
    prisma.legalCase.create({ data: { internalFileNumber: `B8-O-${suffix}`, clientId: other.id, assignedLawyerId: otherLawyer.id, title: `${marker} other-lawyer case`, caseType: "BATCH8", status: "ACTIVE", priority: "NORMAL" } })
  ]);
  const startsAt = new Date("2035-01-15T08:00:00.000Z");
  await prisma.appointment.createMany({
    data: [
      { clientId: owner.id, lawyerId: lawyer.id, caseId: activeCase.id, title: `${marker} active appointment`, type: "COURT_SESSION", mode: "COURT", startsAt, endsAt: new Date("2035-01-15T09:00:00.000Z"), status: "SCHEDULED" },
      { clientId: owner.id, lawyerId: lawyer.id, caseId: archivedCase.id, title: `${marker} archived appointment`, type: "COURT_SESSION", mode: "COURT", startsAt, endsAt: new Date("2035-01-15T09:00:00.000Z"), status: "SCHEDULED" },
      { clientId: owner.id, lawyerId: lawyer.id, caseId: deletedCase.id, title: `${marker} deleted appointment`, type: "COURT_SESSION", mode: "COURT", startsAt, endsAt: new Date("2035-01-15T09:00:00.000Z"), status: "SCHEDULED" },
      { clientId: owner.id, lawyerId: null, caseId: null, title: `${marker} consultation`, type: "CONSULTATION", mode: "PHONE", startsAt, endsAt: new Date("2035-01-15T09:00:00.000Z"), status: "SCHEDULED" },
      { clientId: other.id, lawyerId: otherLawyer.id, caseId: otherLawyerCase.id, title: `${marker} other lawyer appointment`, type: "COURT_SESSION", mode: "COURT", startsAt, endsAt: new Date("2035-01-15T09:00:00.000Z"), status: "SCHEDULED" }
    ]
  });
  await prisma.appointment.createMany({
    data: Array.from({ length: 105 }, (_, index) => ({
      clientId: owner.id,
      lawyerId: lawyer.id,
      caseId: activeCase.id,
      title: `${marker} calendar ${String(index + 1).padStart(3, "0")}`,
      type: "COURT_SESSION" as const,
      mode: "COURT" as const,
      startsAt: new Date("2035-01-16T08:00:00.000Z"),
      endsAt: new Date("2035-01-16T09:00:00.000Z"),
      status: "SCHEDULED" as const
    }))
  });
  const [task, draftTask, refreshTask, scopeTask, caseFormTask] = await Promise.all(
    ["api", "draft", "refresh", "scope", "case-form"].map((name) => prisma.task.create({
      data: { title: `${marker} ${name} task`, description: `synthetic ${name} task`, status: "NEW", priority: "NORMAL", assignedToId: lawyer.id, caseId: activeCase.id, createdById: office.id }
    }))
  );
  const [document, payment] = await Promise.all([
    prisma.document.create({ data: { caseId: deletedCase.id, uploadedById: office.id, fileName: `${marker} historical-document.pdf`, fileKey: `batch8/${suffix}/historical-document.pdf`, fileType: "application/pdf", fileSize: 128, category: "COURT_FILE", status: "ACCEPTED", visibility: "CLIENT_VISIBLE" } }),
    prisma.payment.create({ data: { invoiceNumber: `B8-${suffix}`, clientId: owner.id, caseId: deletedCase.id, issueDate: new Date("2034-12-01T00:00:00.000Z"), amount: "250.00", currency: "EGP", status: "ISSUED", createdById: office.id } })
  ]);
  return { marker, primaryUser, otherUser, owner, other, office, lawyer, otherLawyer, activeCase, deletedCase, otherLawyerCase, task, draftTask, refreshTask, scopeTask, caseFormTask, document, payment };
}

async function cleanupFixture(value: Fixture | undefined, marker = fixtureMarker) {
  if (!marker || !/^\[BATCH8:[0-9a-f-]{36}\]$/.test(marker)) return;
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany({ where: { name: { startsWith: marker } }, select: { id: true } });
    const userIds = users.map((user) => user.id);
    const clients = await tx.client.findMany({ where: { source: marker }, select: { id: true } });
    const clientIds = clients.map((client) => client.id);
    const cases = await tx.legalCase.findMany({ where: { clientId: { in: clientIds } }, select: { id: true } });
    const caseIds = cases.map((legalCase) => legalCase.id);
    const knownTaskIds = value ? [value.task.id, value.draftTask.id, value.refreshTask.id, value.scopeTask.id, value.caseFormTask.id] : [];
    const tasks = await tx.task.findMany({ where: { OR: [{ id: { in: knownTaskIds } }, { title: { startsWith: marker } }] }, select: { id: true } });
    const taskIds = tasks.map((task) => task.id);
    await tx.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { clientId: { in: clientIds } }, { caseId: { in: caseIds } }, { resourceId: { in: [...taskIds, ...clientIds, ...caseIds] } }] } });
    await tx.payment.deleteMany({ where: { OR: [{ clientId: { in: clientIds } }, { caseId: { in: caseIds } }] } });
    await tx.document.deleteMany({ where: { OR: [{ ownerClientId: { in: clientIds } }, { caseId: { in: caseIds } }, { fileName: { startsWith: marker } }] } });
    await tx.appointment.deleteMany({ where: { OR: [{ clientId: { in: clientIds } }, { title: { startsWith: marker } }] } });
    await tx.task.deleteMany({ where: { id: { in: taskIds } } });
    await tx.legalCase.deleteMany({ where: { id: { in: caseIds } } });
    await tx.client.deleteMany({ where: { id: { in: clientIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });
}

test.describe("Batch 8 isolated DB/browser acceptance", () => {
  test.setTimeout(180_000);
  test.skip(!enabled, "Requires the explicitly isolated Batch 8 local PostgreSQL database.");

  test.beforeAll(async () => {
    expect(new URL(process.env.DATABASE_URL!).hostname).toBe("127.0.0.1");
    expect(new URL(process.env.DATABASE_URL!).port).toBe("55439");
    expect(new URL(process.env.DATABASE_URL!).pathname).toBe("/kmt_batch8");
    await assertIsolatedDatabaseIdentity();
    fixture = await createFixture();
  });

  test.afterAll(async () => {
    await assertIsolatedDatabaseIdentity();
    await cleanupFixture(fixture);
  });

  test("client pages hide soft-deleted linked cases, retain archived and consultation appointments, then restore", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const ownerContext = await browser.newContext({ baseURL });
    const otherContext = await browser.newContext({ baseURL });
    const ownerPage = await ownerContext.newPage();
    const otherPage = await otherContext.newPage();
    let caseWasDeleted = false;
    try {
      await login(ownerPage, fixture.primaryUser.email, "/client/court-dates");
      await expect(ownerPage.locator("html")).toHaveAttribute("lang", "en");
      await expect(ownerPage.locator("html")).toHaveAttribute("dir", "ltr");
      await expect(ownerPage.getByRole("table").getByText(`${fixture.marker} deleted appointment`, { exact: true })).toBeVisible();
      await ownerPage.goto("/client", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByText(`${fixture.marker} deleted appointment`, { exact: true })).toBeVisible();

      await prisma.legalCase.update({ where: { id: fixture.deletedCase.id }, data: { deletedAt: new Date() } });
      caseWasDeleted = true;
      await ownerPage.goto("/client/court-dates", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByText(`${fixture.marker} deleted appointment`, { exact: true })).toHaveCount(0);
      await expect(ownerPage.getByRole("table").getByText(`${fixture.marker} archived appointment`, { exact: true })).toBeVisible();
      await expect(ownerPage.getByRole("table").getByText(`${fixture.marker} consultation`, { exact: true })).toBeVisible();
      await ownerPage.goto("/client", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByText(`${fixture.marker} deleted appointment`, { exact: true })).toHaveCount(0);
      await ownerPage.goto("/client/files", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByRole("link", { name: `${fixture.marker} historical-document.pdf`, exact: true }).filter({ visible: true }).first()).toBeVisible();
      await ownerPage.goto("/client/payments", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByText(fixture.payment.invoiceNumber, { exact: true }).filter({ visible: true }).first()).toBeVisible();

      await login(otherPage, fixture.otherUser.email, "/client/court-dates");
      await expect(otherPage.locator("html")).toHaveAttribute("lang", "ar");
      await expect(otherPage.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(otherPage.getByRole("table").getByText(`${fixture.marker} other lawyer appointment`, { exact: true })).toBeVisible();
      await expect(otherPage.getByText(`${fixture.marker} deleted appointment`, { exact: true })).toHaveCount(0);
      await otherPage.goto("/client", { waitUntil: "domcontentloaded" });
      await expect(otherPage.getByText(`${fixture.marker} other lawyer appointment`, { exact: true })).toBeVisible();

      await prisma.legalCase.update({ where: { id: fixture.deletedCase.id }, data: { deletedAt: null } });
      caseWasDeleted = false;
      await ownerPage.goto("/client/court-dates", { waitUntil: "domcontentloaded" });
      await expect(ownerPage.getByRole("table").getByText(`${fixture.marker} deleted appointment`, { exact: true })).toBeVisible();
      await ownerPage.setViewportSize({ width: 390, height: 844 });
      await ownerPage.screenshot({ path: testInfo.outputPath("client-390.png"), fullPage: true });
      await ownerPage.setViewportSize({ width: 768, height: 1024 });
      await ownerPage.screenshot({ path: testInfo.outputPath("client-768.png"), fullPage: true });
      await ownerPage.setViewportSize({ width: 1440, height: 1024 });
      await ownerPage.screenshot({ path: testInfo.outputPath("client-1440.png"), fullPage: true });
      await otherPage.setViewportSize({ width: 390, height: 844 });
      await otherPage.goto("/client/court-dates", { waitUntil: "domcontentloaded" });
      await otherPage.screenshot({ path: testInfo.outputPath("client-ar-390.png"), fullPage: true });
    } finally {
      if (caseWasDeleted) {
        await prisma.legalCase.update({ where: { id: fixture.deletedCase.id }, data: { deletedAt: null } }).catch(() => undefined);
      }
      await Promise.all([ownerContext.close(), otherContext.close()]);
    }
  });

  test("calendar paginates 105 same-day rows without gaps or duplicates and keeps Cairo filters in keyboard navigation", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const officeContext = await browser.newContext({ baseURL });
    const officePage = await officeContext.newPage();
    const query = "from=2035-01-16&to=2035-01-17&pageSize=50";
    try {
      await login(officePage, fixture.office.email, "/admin/calendar");
      const first = await officePage.request.get(`/api/admin/calendar?${query}&page=1`);
      const second = await officePage.request.get(`/api/admin/calendar?${query}&page=2`);
      const third = await officePage.request.get(`/api/admin/calendar?${query}&page=3`);
      expect(first.status()).toBe(200);
      const [firstBody, secondBody, thirdBody] = await Promise.all([first.json(), second.json(), third.json()]) as Array<{ data: { total: number; page: number; pageSize: number; from: string; to: string; items: Array<{ id: string; title: string; startsAt: string }> } }>;
      expect(firstBody.data.total).toBe(105);
      expect(firstBody.data.items).toHaveLength(50);
      expect(secondBody.data.items).toHaveLength(50);
      expect(thirdBody.data.items).toHaveLength(5);
      expect(new Set([...firstBody.data.items, ...secondBody.data.items, ...thirdBody.data.items].map((item) => item.id)).size).toBe(firstBody.data.total);
      expect([...firstBody.data.items, ...secondBody.data.items, ...thirdBody.data.items].every((item, index, rows) => index === 0 || `${rows[index - 1].startsAt}|${rows[index - 1].id}` <= `${item.startsAt}|${item.id}`)).toBeTruthy();
      const repeatedFirst = await officePage.request.get(`/api/admin/calendar?${query}&page=1`);
      expect((await repeatedFirst.json() as { data: { items: Array<{ id: string }> } }).data.items.map((item) => item.id)).toEqual(firstBody.data.items.map((item) => item.id));
      const outOfRange = await officePage.request.get(`/api/admin/calendar?${query}&page=999`);
      const outOfRangeBody = await outOfRange.json() as { data: { page: number; items: Array<{ id: string }> } };
      expect(outOfRangeBody.data.page).toBe(3);
      expect(outOfRangeBody.data.items.map((item) => item.id)).toEqual(thirdBody.data.items.map((item) => item.id));

      await officePage.goto(`/admin/calendar?${query}&page=1`, { waitUntil: "domcontentloaded" });
      await expect(officePage.getByText("50 موعد معروض في هذه الصفحة", { exact: true })).toBeVisible();
      const nextLink = officePage.getByRole("link", { name: "التالي" });
      await expect(nextLink).toHaveAttribute("href", /from=2035-01-16/);
      await expect(nextLink).toHaveAttribute("href", /to=2035-01-17/);
      await nextLink.focus();
      await officePage.keyboard.press("Enter");
      await expect(officePage).toHaveURL(/page=2/);
      const filterForm = officePage.locator('form[action="/admin/calendar"]');
      await expect(filterForm.locator('input[name="page"]')).toHaveCount(0);
      await filterForm.getByLabel("الطريقة").selectOption("COURT");
      await Promise.all([
        officePage.waitForURL((url) => url.pathname === "/admin/calendar" && url.searchParams.get("mode") === "COURT" && !url.searchParams.has("page")),
        filterForm.getByRole("button", { name: "تطبيق" }).click()
      ]);
      await officePage.setViewportSize({ width: 768, height: 1024 });
      await officePage.screenshot({ path: testInfo.outputPath("calendar-768.png"), fullPage: true });
    } finally {
      await officeContext.close();
    }
  });

  test("calendar applies filters, returns a real empty page, and distinguishes office from assigned-lawyer scope", async ({ browser }) => {
    const baseURL = String(test.info().project.use.baseURL);
    const officeContext = await browser.newContext({ baseURL });
    const lawyerContext = await browser.newContext({ baseURL });
    const officePage = await officeContext.newPage();
    const lawyerPage = await lawyerContext.newPage();
    const query = "from=2035-01-15&to=2035-01-16&pageSize=100";
    try {
      await login(officePage, fixture.office.email, "/admin/calendar");
      await login(lawyerPage, fixture.lawyer.email, "/admin/calendar");
      const [officeResponse, lawyerResponse, phoneResponse, emptyResponse] = await Promise.all([
        officePage.request.get(`/api/admin/calendar?${query}`),
        lawyerPage.request.get(`/api/admin/calendar?${query}`),
        officePage.request.get(`/api/admin/calendar?${query}&mode=PHONE`),
        officePage.request.get(`/api/admin/calendar?${query}&mode=ONLINE`)
      ]);
      const officeBody = await officeResponse.json() as { data: { total: number; items: Array<{ title: string }> } };
      const lawyerBody = await lawyerResponse.json() as { data: { total: number; items: Array<{ title: string }> } };
      const phoneBody = await phoneResponse.json() as { data: { total: number; items: Array<{ title: string }> } };
      const emptyBody = await emptyResponse.json() as { data: { total: number; page: number; items: unknown[] } };
      expect(officeBody.data.total).toBe(5);
      expect(lawyerBody.data.total).toBe(3);
      expect(lawyerBody.data.items.some((item) => item.title === `${fixture.marker} other lawyer appointment`)).toBeFalsy();
      expect(lawyerBody.data.items.some((item) => item.title === `${fixture.marker} consultation`)).toBeFalsy();
      expect(phoneBody.data.items.map((item) => item.title)).toEqual([`${fixture.marker} consultation`]);
      expect(emptyBody.data).toMatchObject({ total: 0, page: 1, items: [] });
    } finally {
      await Promise.all([officeContext.close(), lawyerContext.close()]);
    }
  });

  test("task API accepts one simultaneous editor and rejects stale, missing, and invalid versions without extra success audit", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const officeContext = await browser.newContext({ baseURL });
    const lawyerContext = await browser.newContext({ baseURL });
    const officePage = await officeContext.newPage();
    const lawyerPage = await lawyerContext.newPage();
    try {
      await login(officePage, fixture.office.email, "/admin/tasks");
      await login(lawyerPage, fixture.lawyer.email, "/admin/tasks");
      const current = await prisma.task.findUniqueOrThrow({ where: { id: fixture.task.id } });
      const auditBefore = await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.task.id } });
      const payload = taskPayload(current, { title: `${fixture.marker} office winner` });
      const [winner, loser] = await Promise.all([
        officePage.request.patch(`/api/admin/tasks/${fixture.task.id}`, { data: payload }),
        lawyerPage.request.patch(`/api/admin/tasks/${fixture.task.id}`, { data: { ...payload, title: `${fixture.marker} lawyer winner` } })
      ]);
      expect([winner.status(), loser.status()].sort()).toEqual([200, 409]);
      const acceptedResponse = winner.status() === 200 ? winner : loser;
      const acceptedBody = await acceptedResponse.json() as { data: { title: string; updatedAt: string } };
      const stored = await prisma.task.findUniqueOrThrow({ where: { id: fixture.task.id } });
      expect(acceptedBody.data.title).toBe(stored.title);
      expect(new Date(acceptedBody.data.updatedAt).toISOString()).toBe(stored.updatedAt.toISOString());
      expect(stored.updatedAt.getTime()).toBeGreaterThan(current.updatedAt.getTime());
      expect(await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.task.id } })).toBe(auditBefore + 1);

      const rejectedSnapshot = await prisma.task.findUniqueOrThrow({ where: { id: fixture.task.id } });
      const rejectedAuditCount = await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.task.id } });
      expect((await officePage.request.patch(`/api/admin/tasks/${fixture.task.id}`, { data: { ...taskPayload(rejectedSnapshot), updatedAt: undefined } })).status()).toBe(400);
      expect((await officePage.request.patch(`/api/admin/tasks/${fixture.task.id}`, { data: { ...taskPayload(rejectedSnapshot), updatedAt: "invalid" } })).status()).toBe(400);
      expect((await officePage.request.patch(`/api/admin/tasks/${fixture.task.id}`, { data: payload })).status()).toBe(409);
      expect(await prisma.task.findUniqueOrThrow({ where: { id: fixture.task.id } })).toEqual(rejectedSnapshot);
      expect(await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.task.id } })).toBe(rejectedAuditCount);
    } finally {
      await Promise.all([officeContext.close(), lawyerContext.close()]);
    }
  });

  test("task permission remains direct-assignee OR case-lawyer and rejects a reassigned actor without writing", async ({ browser }) => {
    const baseURL = String(test.info().project.use.baseURL);
    const lawyerContext = await browser.newContext({ baseURL });
    const lawyerPage = await lawyerContext.newPage();
    const originalCaseLawyerId = fixture.activeCase.assignedLawyerId;
    try {
      await login(lawyerPage, fixture.lawyer.email, "/admin/tasks");

      await prisma.legalCase.update({ where: { id: fixture.activeCase.id }, data: { assignedLawyerId: fixture.otherLawyer.id } });
      let current = await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } });
      const directResponse = await lawyerPage.request.patch(`/api/admin/tasks/${current.id}`, { data: taskPayload(current, { title: `${fixture.marker} direct-assignee allowed` }) });
      expect(directResponse.status()).toBe(200);

      const deniedCaseSnapshot = await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } });
      const deniedCaseAuditCount = await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.scopeTask.id } });
      const deniedCase = await lawyerPage.request.patch(`/api/admin/tasks/${deniedCaseSnapshot.id}`, {
        data: taskPayload(deniedCaseSnapshot, { caseId: fixture.otherLawyerCase.id })
      });
      expect(deniedCase.status()).toBe(404);
      expect(await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } })).toEqual(deniedCaseSnapshot);
      expect(await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.scopeTask.id } })).toBe(deniedCaseAuditCount);

      await lawyerPage.goto(`/admin/tasks?q=${encodeURIComponent(fixture.marker)}`, { waitUntil: "domcontentloaded" });
      let scopeCard = lawyerPage.locator(`article[data-task-id="${fixture.scopeTask.id}"]`);
      await expect(scopeCard.locator('input[name="title"]')).toBeEnabled();
      await scopeCard.locator("summary").click();
      let scopeForm = scopeCard.locator("form");
      await expect(scopeForm.locator('select[name="caseId"]')).toHaveValue(fixture.activeCase.id);
      await expect(scopeForm.locator(`option[value="${fixture.activeCase.id}"]`)).toContainText("مرتبطة حاليًا");
      await scopeForm.locator('input[name="title"]').fill(`${fixture.marker} browser title-only save`);
      const titleOnlySave = lawyerPage.waitForResponse((response) => response.url().endsWith(`/api/admin/tasks/${fixture.scopeTask.id}`) && response.request().method() === "PATCH");
      await scopeForm.getByRole("button", { name: "حفظ المهمة" }).click();
      expect((await titleOnlySave).status()).toBe(200);
      expect((await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } })).caseId).toBe(fixture.activeCase.id);

      await prisma.task.update({ where: { id: fixture.scopeTask.id }, data: { assignedToId: fixture.office.id } });
      await prisma.legalCase.update({ where: { id: fixture.activeCase.id }, data: { assignedLawyerId: fixture.lawyer.id } });
      current = await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } });
      const caseResponse = await lawyerPage.request.patch(`/api/admin/tasks/${current.id}`, { data: taskPayload(current, { title: `${fixture.marker} case-lawyer allowed`, assignedToId: fixture.lawyer.id }) });
      expect(caseResponse.status()).toBe(200);

      await prisma.task.update({ where: { id: fixture.scopeTask.id }, data: { assignedToId: fixture.office.id } });
      await prisma.legalCase.update({ where: { id: fixture.activeCase.id }, data: { assignedLawyerId: fixture.otherLawyer.id } });
      const deniedSnapshot = await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } });
      const deniedAuditCount = await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.scopeTask.id } });
      const denied = await lawyerPage.request.patch(`/api/admin/tasks/${deniedSnapshot.id}`, { data: taskPayload(deniedSnapshot, { title: `${fixture.marker} denied`, assignedToId: fixture.lawyer.id }) });
      expect(denied.status()).toBe(403);
      expect(await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } })).toEqual(deniedSnapshot);
      expect(await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.scopeTask.id } })).toBe(deniedAuditCount);
    } finally {
      await prisma.legalCase.update({ where: { id: fixture.activeCase.id }, data: { assignedLawyerId: originalCaseLawyerId } }).catch(() => undefined);
      await lawyerContext.close();
    }
  });

  test("task forms retain and create against the current case beyond the 100-option query cap", async ({ browser }, testInfo) => {
    const baseURL = String(test.info().project.use.baseURL);
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    let createdTaskId: string | undefined;
    try {
      await prisma.task.update({ where: { id: fixture.scopeTask.id }, data: { assignedToId: fixture.lawyer.id, caseId: fixture.activeCase.id } });
      await prisma.legalCase.update({
        where: { id: fixture.activeCase.id },
        data: { assignedLawyerId: fixture.lawyer.id, updatedAt: new Date("2020-01-01T00:00:00.000Z") }
      });
      await prisma.legalCase.createMany({
        data: Array.from({ length: 101 }, (_, index) => ({
          internalFileNumber: `B8-F-${String(index + 1).padStart(3, "0")}-${fixture.marker.slice(8, 16)}`,
          clientId: fixture.owner.id,
          assignedLawyerId: fixture.lawyer.id,
          title: `${fixture.marker} option filler ${String(index + 1).padStart(3, "0")}`,
          caseType: "BATCH8",
          status: "ACTIVE" as const,
          priority: "NORMAL" as const
        }))
      });

      await login(page, fixture.lawyer.email, "/admin/tasks");
      await page.goto(`/admin/tasks?q=${encodeURIComponent(fixture.marker)}`, { waitUntil: "domcontentloaded" });
      const scopeCard = page.locator(`article[data-task-id="${fixture.scopeTask.id}"]`);
      await expect(scopeCard.locator('input[name="title"]')).toBeEnabled();
      await scopeCard.locator("summary").click();
      const scopeForm = scopeCard.locator("form");
      await expect(scopeForm.locator('select[name="caseId"]')).toHaveValue(fixture.activeCase.id);
      await expect(scopeForm.locator(`option[value="${fixture.activeCase.id}"]`)).toContainText("مرتبطة حاليًا");
      await scopeForm.locator('input[name="title"]').fill(`${fixture.marker} capped-options title save`);
      const response = page.waitForResponse((candidate) => candidate.url().endsWith(`/api/admin/tasks/${fixture.scopeTask.id}`) && candidate.request().method() === "PATCH");
      await scopeForm.getByRole("button", { name: "حفظ المهمة" }).click();
      expect((await response).status()).toBe(200);
      expect((await prisma.task.findUniqueOrThrow({ where: { id: fixture.scopeTask.id } })).caseId).toBe(fixture.activeCase.id);

      await page.goto(`/admin/cases/${fixture.activeCase.id}?tab=tasks`, { waitUntil: "domcontentloaded" });
      const createForm = page.getByRole("form", { name: "إنشاء مهمة" });
      await expect(createForm.locator('input[name="title"]')).toBeEnabled();
      await expect(createForm.locator('select[name="caseId"]')).toHaveValue(fixture.activeCase.id);
      await expect(createForm.locator(`option[value="${fixture.activeCase.id}"]`)).toContainText("مرتبطة حاليًا");
      const createdTitle = `${fixture.marker} case-page capped create`;
      await createForm.locator('input[name="title"]').fill(createdTitle);
      const createResponse = page.waitForResponse((candidate) => candidate.url().endsWith("/api/admin/tasks") && candidate.request().method() === "POST");
      await createForm.getByRole("button", { name: "إنشاء المهمة" }).click();
      const created = await createResponse;
      expect(created.status()).toBe(201);
      const createdTask = await prisma.task.findFirstOrThrow({ where: { title: createdTitle, createdById: fixture.lawyer.id } });
      createdTaskId = createdTask.id;
      expect(createdTask.caseId).toBe(fixture.activeCase.id);
      await expect(page.locator(`article[data-task-id="${createdTaskId}"]`)).toContainText(createdTitle);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: testInfo.outputPath("case-create-cap-390.png"), fullPage: true });
    } finally {
      if (createdTaskId) {
        await prisma.auditLog.deleteMany({ where: { resourceId: createdTaskId } }).catch(() => undefined);
        await prisma.task.deleteMany({ where: { id: createdTaskId } }).catch(() => undefined);
      }
      await context.close();
    }
  });

  test("task forms stay inert before hydration on both task list and case detail placements", async ({ browser }) => {
    const baseURL = String(test.info().project.use.baseURL);
    const context = await browser.newContext({ baseURL });
    const loginPage = await context.newPage();
    try {
      await login(loginPage, fixture.office.email, "/admin/tasks");
      const page = await context.newPage();
      await page.route("**/_next/static/**", (route) => route.abort());
      await page.goto(`/admin/tasks?q=${encodeURIComponent(fixture.marker)}`, { waitUntil: "domcontentloaded" });
      let taskCard = page.locator(`article[data-task-id="${fixture.caseFormTask.id}"]`);
      await taskCard.locator("summary").click();
      await expect(taskCard.locator('input[name="title"]')).toBeDisabled();
      await expect(taskCard.getByRole("button", { name: "حفظ المهمة" })).toBeDisabled();

      await page.goto(`/admin/cases/${fixture.activeCase.id}?tab=tasks`, { waitUntil: "domcontentloaded" });
      taskCard = page.locator(`article[data-task-id="${fixture.caseFormTask.id}"]`);
      await taskCard.locator("summary").click();
      await expect(taskCard.locator('input[name="title"]')).toBeDisabled();
      await expect(taskCard.getByRole("button", { name: "حفظ المهمة" })).toBeDisabled();
    } finally {
      await context.close();
    }
  });

  test("task list preserves draft and version through another task refresh, then explicitly loads the winner after 409", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const officeContext = await browser.newContext({ baseURL });
    const lawyerContext = await browser.newContext({ baseURL });
    const officePage = await officeContext.newPage();
    const lawyerPage = await lawyerContext.newPage();
    try {
      await login(officePage, fixture.office.email, "/admin/tasks");
      await login(lawyerPage, fixture.lawyer.email, "/admin/tasks");
      await officePage.goto(`/admin/tasks?q=${encodeURIComponent(fixture.marker)}`, { waitUntil: "domcontentloaded" });

      const draftCard = officePage.locator(`article[data-task-id="${fixture.draftTask.id}"]`);
      const refreshCard = officePage.locator(`article[data-task-id="${fixture.refreshTask.id}"]`);
      await expect(draftCard.locator('input[name="title"]')).toBeEnabled();
      await expect(refreshCard.locator('input[name="title"]')).toBeEnabled();
      await draftCard.locator("summary").click();
      await refreshCard.locator("summary").click();
      const draftForm = draftCard.locator("form");
      const refreshForm = refreshCard.locator("form");
      await expect(draftForm).toBeVisible();
      await expect(refreshForm).toBeVisible();
      const staleVersion = await draftForm.locator('input[name="updatedAt"]').inputValue();
      const userDraft = `${fixture.marker} preserved user draft`;
      await draftForm.locator('input[name="title"]').fill(userDraft);

      const freshDraft = await prisma.task.findUniqueOrThrow({ where: { id: fixture.draftTask.id } });
      const externalTitle = `${fixture.marker} external winner`;
      const external = await lawyerPage.request.patch(`/api/admin/tasks/${freshDraft.id}`, { data: taskPayload(freshDraft, { title: externalTitle }) });
      expect(external.status()).toBe(200);

      const refreshSave = officePage.waitForResponse((response) => response.url().endsWith(`/api/admin/tasks/${fixture.refreshTask.id}`) && response.request().method() === "PATCH");
      await refreshForm.locator('input[name="title"]').fill(`${fixture.marker} refresh task saved`);
      await refreshForm.getByRole("button", { name: "حفظ المهمة" }).click();
      expect((await refreshSave).status()).toBe(200);
      await expect(refreshForm.getByText("تم حفظ المهمة.", { exact: true })).toBeVisible();
      await expect(draftForm.locator('input[name="title"]')).toHaveValue(userDraft);
      await expect(draftForm.locator('input[name="updatedAt"]')).toHaveValue(staleVersion);

      const rejectedAuditCount = await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.draftTask.id } });
      const staleSave = officePage.waitForResponse((response) => response.url().endsWith(`/api/admin/tasks/${fixture.draftTask.id}`) && response.request().method() === "PATCH");
      await draftForm.getByRole("button", { name: "حفظ المهمة" }).click();
      expect((await staleSave).status()).toBe(409);
      await expect(draftForm.getByText("تغيرت المهمة بعد فتح النموذج. حدّث الصفحة ثم راجع آخر نسخة قبل الحفظ.", { exact: true })).toBeVisible();
      await expect(draftForm.locator('input[name="title"]')).toHaveValue(userDraft);
      await expect(draftForm.locator('input[name="updatedAt"]')).toHaveValue(staleVersion);
      expect(await prisma.auditLog.count({ where: { action: "task.update", resourceId: fixture.draftTask.id } })).toBe(rejectedAuditCount);

      await Promise.all([
        officePage.waitForNavigation({ waitUntil: "domcontentloaded" }),
        draftForm.getByRole("button", { name: "تحديث البيانات للمراجعة" }).click()
      ]);
      const reloadedCard = officePage.locator(`article[data-task-id="${fixture.draftTask.id}"]`);
      await expect(reloadedCard.locator('input[name="title"]')).toBeEnabled();
      await reloadedCard.locator("summary").click();
      await expect(reloadedCard.locator('input[name="title"]')).toHaveValue(externalTitle);
      await officePage.setViewportSize({ width: 1440, height: 1024 });
      await officePage.screenshot({ path: testInfo.outputPath("task-recovery-1440.png"), fullPage: true });
    } finally {
      await Promise.all([officeContext.close(), lawyerContext.close()]);
    }
  });

  test("case task tab sends the current version and supports keyboard editing at mobile width", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL);
    const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await login(page, fixture.office.email, `/admin/cases/${fixture.activeCase.id}?tab=tasks`);
      const taskCard = page.locator(`article[data-task-id="${fixture.caseFormTask.id}"]`);
      await expect(taskCard.locator('input[name="title"]')).toBeEnabled();
      await taskCard.locator("summary").click();
      const form = taskCard.locator("form");
      await expect(form.locator('input[name="updatedAt"]')).toHaveValue(/.+/);
      await form.locator('input[name="title"]').focus();
      await page.keyboard.press("Tab");
      await expect(form.locator('textarea[name="description"]')).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath("case-task-390.png"), fullPage: true });
    } finally {
      await context.close();
    }
  });
});
