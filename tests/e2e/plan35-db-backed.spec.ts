import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { createPlan35AuthenticatedTestState } from "./plan35-auth-state";

const disposableUs4Enabled = Boolean(
  process.env.DATABASE_URL &&
  process.env.PLAN35_ALLOW_DB_FIXTURES === "true" &&
  process.env.PLAN35_DATABASE_CLASS === "disposable" &&
  process.env.PLAN35_US4_E2E === "true" &&
  process.env.APP_ENV !== "production" &&
  process.env.NODE_ENV !== "production"
);

type AuthenticatedState = Awaited<ReturnType<typeof createPlan35AuthenticatedTestState>>;

test.describe.serial("PLAN-35 manual case DB/browser acceptance", () => {
  test.skip(
    !disposableUs4Enabled,
    "Requires explicit PLAN35_US4_E2E opt-in, disposable database classification, and disposable fixture permission."
  );

  let state: AuthenticatedState;

  test.beforeAll(async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    state = await createPlan35AuthenticatedTestState({
      prisma,
      browser,
      baseURL,
      namespace: `plan35-us4-${randomUUID()}`
    });
  });

  test.afterAll(async () => {
    await state?.cleanup();
  });

  test("creates, replays, edits, and reaches list, detail, client history, and audit within three minutes", async ({ browser }, testInfo) => {
    const startedAt = Date.now();
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    const context = await browser.newContext({
      baseURL,
      storageState: state.storage.paths.officeAdmin
    });
    const page = await context.newPage();
    const requestToken = randomUUID();
    const payload = {
      requestToken,
      clientId: state.database.crossAssignments.clientId,
      assignedLawyerId: state.database.personas.lawyer.userId,
      title: `${state.database.marker} قضية يدوية`,
      caseType: "PLAN35_MANUAL",
      courtName: "محكمة اختبار",
      externalCaseNumber: `US4-${Date.now()}`,
      priority: "HIGH",
      summary: "بيانات اختبار اصطناعية قابلة للحذف.",
      parties: [{ name: "طرف اختبار", partyType: "OPPOSING_PARTY", notes: "بيانات اصطناعية" }]
    };

    try {
      const createResponse = await page.request.post("/api/admin/cases", { data: payload });
      expect(createResponse.status()).toBe(201);
      const createdBody = (await createResponse.json()) as {
        data: { case: { id: string; internalFileNumber: string; updatedAt: string }; replayed: boolean };
      };
      expect(createdBody.data).toMatchObject({ replayed: false, case: { id: requestToken } });

      const replayResponse = await page.request.post("/api/admin/cases", { data: payload });
      expect(replayResponse.status()).toBe(200);
      expect(await replayResponse.json()).toMatchObject({ data: { replayed: true, case: { id: requestToken } } });

      const editResponse = await page.request.patch(`/api/admin/cases/${requestToken}`, {
        data: {
          title: `${payload.title} محدثة`,
          priority: "URGENT",
          updatedAt: createdBody.data.case.updatedAt
        }
      });
      expect(editResponse.status()).toBe(200);

      await page.goto(`/admin/cases?q=${encodeURIComponent(createdBody.data.case.internalFileNumber)}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(createdBody.data.case.internalFileNumber, { exact: true }).first()).toBeVisible();
      await page.goto(`/admin/cases/${requestToken}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(`${payload.title} محدثة`, { exact: true }).first()).toBeVisible();
      await page.goto(`/admin/clients/${state.database.crossAssignments.clientId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(createdBody.data.case.internalFileNumber, { exact: true }).first()).toBeVisible();

      const auditRows = await prisma.auditLog.findMany({
        where: { resourceId: requestToken, action: { in: ["case.manual_create", "case.core_update"] } },
        select: { action: true, actorId: true, metadata: true }
      });
      expect(auditRows.map(({ action }) => action).sort()).toEqual(["case.core_update", "case.manual_create"]);
      expect(await prisma.legalCase.count({ where: { id: requestToken } })).toBe(1);
      expect(Date.now() - startedAt).toBeLessThan(180_000);
    } finally {
      await context.close();
    }
  });

  test("denies assigned-only transfer and denied-role creation without partial records", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    const officeContext = await browser.newContext({ baseURL, storageState: state.storage.paths.officeAdmin });
    const lawyerContext = await browser.newContext({ baseURL, storageState: state.storage.paths.lawyer });
    const marketingContext = await browser.newContext({ baseURL, storageState: state.storage.paths.marketingStaff });
    const requestToken = randomUUID();
    const deniedToken = randomUUID();
    try {
      const createResponse = await officeContext.request.post("/api/admin/cases", {
        data: {
          requestToken,
          clientId: state.database.crossAssignments.clientId,
          assignedLawyerId: state.database.personas.lawyer.userId,
          title: `${state.database.marker} نطاق التعديل`,
          caseType: "PLAN35_MANUAL",
          priority: "NORMAL",
          parties: []
        }
      });
      expect(createResponse.status()).toBe(201);
      const created = (await createResponse.json()) as { data: { case: { updatedAt: string } } };

      const transferResponse = await lawyerContext.request.patch(`/api/admin/cases/${requestToken}`, {
        data: {
          assignedLawyerId: state.database.personas.secretary.userId,
          updatedAt: created.data.case.updatedAt
        }
      });
      expect(transferResponse.status()).toBe(403);

      const deniedCreate = await marketingContext.request.post("/api/admin/cases", {
        data: {
          requestToken: deniedToken,
          clientId: state.database.crossAssignments.clientId,
          assignedLawyerId: state.database.personas.lawyer.userId,
          title: `${state.database.marker} مرفوضة`,
          caseType: "PLAN35_MANUAL",
          priority: "NORMAL",
          parties: []
        }
      });
      expect(deniedCreate.status()).toBe(403);
      expect(await prisma.legalCase.count({ where: { id: deniedToken } })).toBe(0);
      expect(await prisma.legalCase.findUnique({ where: { id: requestToken }, select: { assignedLawyerId: true } })).toEqual({
        assignedLawyerId: state.database.personas.lawyer.userId
      });
    } finally {
      await Promise.all([officeContext.close(), lawyerContext.close(), marketingContext.close()]);
    }
  });
});
