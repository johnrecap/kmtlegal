import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { prisma } from "@/server/db/prisma";
import { PLAN35_FIXTURE_PASSWORD } from "../fixtures/plan35-db-fixtures";
import { createPlan35AuthenticatedTestState, loginPlan35Persona } from "./plan35-auth-state";

const disposableUs4Enabled = Boolean(
  process.env.DATABASE_URL &&
  process.env.PLAN35_ALLOW_DB_FIXTURES === "true" &&
  process.env.PLAN35_DATABASE_CLASS === "disposable" &&
  process.env.PLAN35_US4_E2E === "true" &&
  process.env.APP_ENV !== "production" &&
  process.env.NODE_ENV !== "production"
);

const disposableUs5Enabled = Boolean(
  process.env.DATABASE_URL &&
  process.env.PLAN35_ALLOW_DB_FIXTURES === "true" &&
  process.env.PLAN35_DATABASE_CLASS === "disposable" &&
  process.env.PLAN35_US5_E2E === "true" &&
  process.env.APP_ENV !== "production" &&
  process.env.NODE_ENV !== "production"
);

async function restoreRolePermissionKeys(roleId: string, permissionKeys: string[]) {
  await prisma.$transaction(async (tx) => {
    const permissions = permissionKeys.length
      ? await tx.permission.findMany({ where: { key: { in: permissionKeys } }, select: { id: true, key: true } })
      : [];
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (permissions.length) {
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId, permissionId: permission.id }))
      });
    }
    await tx.role.update({ where: { id: roleId }, data: { updatedAt: new Date() } });
  });
}

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

test.describe.serial("PLAN-35 role and user governance DB/browser acceptance", () => {
  test.skip(
    !disposableUs5Enabled,
    "Requires explicit PLAN35_US5_E2E opt-in, disposable database classification, and disposable fixture permission."
  );

  let state: AuthenticatedState;

  test.beforeAll(async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    state = await createPlan35AuthenticatedTestState({
      prisma,
      browser,
      baseURL,
      namespace: `plan35-us5-${randomUUID()}`
    });
  });

  test.afterAll(async () => {
    await state?.cleanup();
  });

  test("persists an empty editable role across repeat seed and rejects stale/protected writes atomically", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    const context = await browser.newContext({ baseURL, storageState: state.storage.paths.superAdmin });
    let secretaryRoleId: string | null = null;
    let originalKeys: string[] = [];
    try {
      const initialResponse = await context.request.get("/api/admin/roles");
      expect(initialResponse.status()).toBe(200);
      const initial = (await initialResponse.json()) as {
        data: { roles: Array<{ id: string; name: string; protected: boolean; permissionKeys: string[]; updatedAt: string }> };
      };
      const secretary = initial.data.roles.find((role) => role.name === "Secretary")!;
      const protectedRole = initial.data.roles.find((role) => role.name === "Super Admin")!;
      secretaryRoleId = secretary.id;
      originalKeys = [...secretary.permissionKeys];

      const emptyResponse = await context.request.patch(`/api/admin/roles/${secretary.id}/permissions`, {
        data: { permissionKeys: [], updatedAt: secretary.updatedAt }
      });
      expect(emptyResponse.status()).toBe(200);
      expect(await emptyResponse.json()).toMatchObject({ data: { permissionKeys: [] } });

      const staleResponse = await context.request.patch(`/api/admin/roles/${secretary.id}/permissions`, {
        data: { permissionKeys: originalKeys, updatedAt: secretary.updatedAt }
      });
      expect(staleResponse.status()).toBe(409);
      const protectedResponse = await context.request.patch(`/api/admin/roles/${protectedRole.id}/permissions`, {
        data: { permissionKeys: [], updatedAt: protectedRole.updatedAt }
      });
      expect(protectedResponse.status()).toBe(409);

      execFileSync(process.execPath, ["prisma/seed.mjs"], { cwd: process.cwd(), env: process.env, stdio: "pipe" });
      execFileSync(process.execPath, ["prisma/seed.mjs"], { cwd: process.cwd(), env: process.env, stdio: "pipe" });
      const afterSeed = (await (await context.request.get("/api/admin/roles")).json()) as typeof initial;
      const persisted = afterSeed.data.roles.find((role) => role.id === secretary.id)!;
      expect(persisted.permissionKeys).toEqual([]);
      expect(await prisma.auditLog.count({ where: { action: "role.permissions_replace", resourceId: secretary.id } })).toBe(1);

    } finally {
      if (secretaryRoleId) await restoreRolePermissionKeys(secretaryRoleId, originalKeys);
      await context.close();
    }
  });

  test("keeps user DTOs secret-free, denies delegated amplification, and revokes inactive access", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    const superContext = await browser.newContext({ baseURL, storageState: state.storage.paths.superAdmin });
    const officeContext = await browser.newContext({ baseURL, storageState: state.storage.paths.officeAdmin });
    const marketingContext = await browser.newContext({ baseURL, storageState: state.storage.paths.marketingStaff });
    let officeRoleSnapshot: { id: string; permissionKeys: string[] } | null = null;
    let marketingUserSnapshot: { id: string; status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DELETED"; deletedAt: Date | null } | null = null;
    try {
      const roleEnvelope = (await (await superContext.request.get("/api/admin/roles")).json()) as {
        data: { roles: Array<{ id: string; name: string; permissionKeys: string[]; updatedAt: string }> };
      };
      const officeRole = roleEnvelope.data.roles.find((role) => role.name === "Office Admin")!;
      const marketingRole = roleEnvelope.data.roles.find((role) => role.name === "Marketing Staff")!;
      officeRoleSnapshot = { id: officeRole.id, permissionKeys: [...officeRole.permissionKeys] };
      marketingUserSnapshot = await prisma.user.findUniqueOrThrow({
        where: { id: state.database.personas.marketingStaff.userId },
        select: { id: true, status: true, deletedAt: true }
      });
      const delegatedKeys = [...new Set([...officeRole.permissionKeys, "user.manage.any"])];
      const grantResponse = await superContext.request.patch(`/api/admin/roles/${officeRole.id}/permissions`, {
        data: { permissionKeys: delegatedKeys, updatedAt: officeRole.updatedAt }
      });
      expect(grantResponse.status()).toBe(200);

      const listResponse = await officeContext.request.get("/api/admin/users");
      expect(listResponse.status()).toBe(200);
      const listJson = JSON.stringify(await listResponse.json());
      expect(listJson).not.toMatch(/passwordHash|secretEncrypted|recoveryCodes|tokenHash/);
      expect((await officeContext.request.get(`/api/admin/users/${state.database.personas.superAdmin.userId}`)).status()).toBe(404);

      const secretaryDetail = (await (await officeContext.request.get(`/api/admin/users/${state.database.personas.secretary.userId}`)).json()) as {
        data: { name: string; phone: string | null; locale: string; status: string; updatedAt: string };
      };
      const amplified = await officeContext.request.patch(`/api/admin/users/${state.database.personas.secretary.userId}`, {
        data: {
          name: secretaryDetail.data.name,
          phone: secretaryDetail.data.phone ?? "",
          roleId: marketingRole.id,
          status: secretaryDetail.data.status,
          locale: secretaryDetail.data.locale,
          updatedAt: secretaryDetail.data.updatedAt
        }
      });
      expect(amplified.status()).toBe(403);

      const marketingDetail = (await (await superContext.request.get(`/api/admin/users/${state.database.personas.marketingStaff.userId}`)).json()) as typeof secretaryDetail;
      const suspendResponse = await superContext.request.patch(`/api/admin/users/${state.database.personas.marketingStaff.userId}`, {
        data: {
          name: marketingDetail.data.name,
          phone: marketingDetail.data.phone ?? "",
          roleId: marketingRole.id,
          status: "SUSPENDED",
          locale: marketingDetail.data.locale,
          updatedAt: marketingDetail.data.updatedAt
        }
      });
      expect(suspendResponse.status()).toBe(200);
      const suspended = (await suspendResponse.json()) as typeof marketingDetail;
      expect((await marketingContext.request.get("/api/admin/notifications")).status()).toBe(401);
      expect((await marketingContext.request.post("/api/auth/login", {
        data: { email: state.database.personas.marketingStaff.email, password: PLAN35_FIXTURE_PASSWORD }
      })).status()).toBe(401);

      const restoreUser = await superContext.request.patch(`/api/admin/users/${state.database.personas.marketingStaff.userId}`, {
        data: {
          name: suspended.data.name,
          phone: suspended.data.phone ?? "",
          roleId: marketingRole.id,
          status: "ACTIVE",
          locale: suspended.data.locale,
          updatedAt: suspended.data.updatedAt
        }
      });
      expect(restoreUser.status()).toBe(200);

    } finally {
      if (marketingUserSnapshot) {
        await prisma.user.update({
          where: { id: marketingUserSnapshot.id },
          data: { status: marketingUserSnapshot.status, deletedAt: marketingUserSnapshot.deletedAt }
        });
      }
      if (officeRoleSnapshot) {
        await restoreRolePermissionKeys(officeRoleSnapshot.id, officeRoleSnapshot.permissionKeys);
      }
      await Promise.all([superContext.close(), officeContext.close(), marketingContext.close()]);
    }
  });

  test("allows only one of two concurrent final-Super demotions", async ({ browser }, testInfo) => {
    const baseURL = String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000");
    const bootstrapContext = await browser.newContext({ baseURL, storageState: state.storage.paths.superAdmin });
    const firstContext = await browser.newContext({ baseURL });
    const secondContext = await browser.newContext({ baseURL });
    const originalSupers: Array<{ id: string; status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DELETED"; deletedAt: Date | null }> = [];
    const createdUserIds: string[] = [];
    try {
      const roleEnvelope = (await (await bootstrapContext.request.get("/api/admin/roles")).json()) as {
        data: { roles: Array<{ id: string; name: string }> };
      };
      const superRole = roleEnvelope.data.roles.find((role) => role.name === "Super Admin")!;
      const lawyerRole = roleEnvelope.data.roles.find((role) => role.name === "Lawyer")!;
      const createdUsers: Array<{ id: string; name: string; email: string; phone: string | null; locale: string; updatedAt: string }> = [];
      for (const suffix of ["first", "second"] as const) {
        const email = `governance-${suffix}.${state.database.namespace}@example.invalid`;
        const response = await bootstrapContext.request.post("/api/admin/users", {
          data: {
            name: `PLAN-35 ${suffix} Super`,
            email,
            phone: "",
            roleId: superRole.id,
            status: "ACTIVE",
            locale: "ar",
            password: PLAN35_FIXTURE_PASSWORD
          }
        });
        expect(response.status()).toBe(201);
        createdUsers.push((await response.json()).data);
        createdUserIds.push(createdUsers.at(-1)!.id);
      }

      await loginPlan35Persona(await firstContext.newPage(), {
        key: "superAdmin",
        userId: createdUsers[0].id,
        roleId: superRole.id,
        roleName: "Super Admin",
        displayName: createdUsers[0].name,
        email: createdUsers[0].email,
        password: PLAN35_FIXTURE_PASSWORD
      }, { baseURL });
      await loginPlan35Persona(await secondContext.newPage(), {
        key: "superAdmin",
        userId: createdUsers[1].id,
        roleId: superRole.id,
        roleName: "Super Admin",
        displayName: createdUsers[1].name,
        email: createdUsers[1].email,
        password: PLAN35_FIXTURE_PASSWORD
      }, { baseURL });

      originalSupers.push(...await prisma.user.findMany({
        where: { roleId: superRole.id, id: { notIn: createdUsers.map(({ id }) => id) } },
        select: { id: true, status: true, deletedAt: true }
      }));
      await prisma.user.updateMany({
        where: { id: { in: originalSupers.map(({ id }) => id) } },
        data: { status: "SUSPENDED" }
      });

      const [firstDetail, secondDetail] = await Promise.all([
        firstContext.request.get(`/api/admin/users/${createdUsers[0].id}`).then((response) => response.json()),
        secondContext.request.get(`/api/admin/users/${createdUsers[1].id}`).then((response) => response.json())
      ]) as Array<{ data: { name: string; phone: string | null; locale: string; updatedAt: string } }>;
      const [firstMutation, secondMutation] = await Promise.all([
        firstContext.request.patch(`/api/admin/users/${createdUsers[1].id}`, {
          data: { name: secondDetail.data.name, phone: secondDetail.data.phone ?? "", roleId: lawyerRole.id, status: "ACTIVE", locale: secondDetail.data.locale, updatedAt: secondDetail.data.updatedAt }
        }),
        secondContext.request.patch(`/api/admin/users/${createdUsers[0].id}`, {
          data: { name: firstDetail.data.name, phone: firstDetail.data.phone ?? "", roleId: lawyerRole.id, status: "ACTIVE", locale: firstDetail.data.locale, updatedAt: firstDetail.data.updatedAt }
        })
      ]);
      expect([firstMutation.status(), secondMutation.status()].sort()).toEqual([200, 409]);
      expect(await prisma.user.count({ where: { roleId: superRole.id, status: "ACTIVE", deletedAt: null } })).toBe(1);
    } finally {
      for (const user of originalSupers) {
        await prisma.user.update({ where: { id: user.id }, data: { status: user.status, deletedAt: user.deletedAt } });
      }
      if (createdUserIds.length) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
      await Promise.all([bootstrapContext.close(), firstContext.close(), secondContext.close()]);
    }
  });
});
