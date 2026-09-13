import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authSnapshotGate = vi.hoisted(() => {
  type Gate = {
    reached: Promise<void>;
    release: Promise<void>;
    markReached: () => void;
    releaseAll: () => void;
  };
  let activeGate: Gate | null = null;

  return {
    arm() {
      let markReached: () => void = () => undefined;
      let releaseAll: () => void = () => undefined;
      const reached = new Promise<void>((resolve) => { markReached = resolve; });
      const release = new Promise<void>((resolve) => { releaseAll = resolve; });
      activeGate = { reached, release, markReached, releaseAll };
      return {
        reached,
        release() {
          activeGate = null;
          releaseAll();
        }
      };
    },
    async waitAfterRealSnapshot<T>(context: T) {
      const gate = activeGate;
      if (!gate) return context;
      gate.markReached();
      await gate.release;
      return context;
    }
  };
});

vi.mock("@/server/auth/session-store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/session-store")>();
  return {
    ...actual,
    async getAuthContextFromRequest(...args: Parameters<typeof actual.getAuthContextFromRequest>) {
      const context = await actual.getAuthContextFromRequest(...args);
      return authSnapshotGate.waitAfterRealSnapshot(context);
    }
  };
});

import { GET as listAdminSettingsRoute } from "@/app/api/admin/settings/route";
import { PATCH as updateAdminSettingRoute } from "@/app/api/admin/settings/[key]/route";
import { updateAdminSetting } from "@/server/admin/governance-service";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH13_POSTGRES === "true";
const databaseUrl = process.env.DATABASE_URL;
const describePostgres = enabled && databaseUrl ? describe : describe.skip;
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const marker = "batch13-synthetic-office-profile";
const ids = { firstSuper: randomUUID(), secondSuper: randomUUID(), officeAdmin: randomUUID() };

let superRoleId = "";
let officeRoleId = "";
let settingsPermissionId = "";
let officePermissionExisted = false;
let firstSuperSession: { id: string; cookie: string };
let secondSuperSession: { id: string; cookie: string };
let officeSession: { id: string; cookie: string };

async function createActiveSession(userId: string) {
  const token = createSessionToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    },
    select: { id: true }
  });
  return { id: session.id, cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}` };
}

function patchRequest(key: string, cookie: string | null, body: Record<string, unknown>) {
  return new Request(`http://127.0.0.1:3115/api/admin/settings/${key}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {})
    },
    body: JSON.stringify(body)
  });
}

function officePayload(firmName: string, updatedAt: string | null) {
  return {
    key: "office.profile",
    firmName,
    publicPhone: "+201000000000",
    publicEmail: `${firmName.toLowerCase().replaceAll(" ", "-")}@example.test`,
    primaryLocale: "ar",
    updatedAt
  };
}

async function patch(key: string, cookie: string | null, body: Record<string, unknown>) {
  return updateAdminSettingRoute(patchRequest(key, cookie, body), { params: Promise.resolve({ key }) });
}

async function responseData(response: Response) {
  return response.json() as Promise<{ data?: Record<string, unknown>; error?: { code: string; message: string } }>;
}

async function requireAuthBarrier(reached: Promise<void>, request: Promise<Response>) {
  const outcome = await Promise.race([
    reached.then(() => ({ kind: "reached" as const })),
    request.then((response) => ({ kind: "resolved" as const, status: response.status }))
  ]);
  if (outcome.kind === "resolved") {
    throw new Error(`Request resolved with status ${outcome.status} before reaching the real auth snapshot barrier.`);
  }
}

async function grantOfficePermission() {
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: officeRoleId, permissionId: settingsPermissionId } },
    update: {},
    create: { roleId: officeRoleId, permissionId: settingsPermissionId }
  });
}

async function denyOfficePermission() {
  await prisma.rolePermission.deleteMany({ where: { roleId: officeRoleId, permissionId: settingsPermissionId } });
}

async function resetOfficeProfile() {
  const existing = await prisma.systemSetting.findUnique({ where: { key: "office.profile" }, select: { id: true } });
  if (existing) await prisma.auditLog.deleteMany({ where: { resourceId: existing.id } });
  await prisma.systemSetting.deleteMany({ where: { key: "office.profile" } });
  await prisma.auditLog.deleteMany({ where: { action: "settings.update", actorId: { in: Object.values(ids) } } });
}

async function restoreFirstSuperSession() {
  await prisma.session.update({
    where: { id: firstSuperSession.id },
    data: { status: "ACTIVE", revokedAt: null, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
  });
}

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch13 database test requires APP_ENV=local.");
  const parsed = new URL(databaseUrl!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") {
    throw new Error("Batch13 database test requires its authorized isolated connection identity.");
  }
  const identity = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"
  `;
  const current = identity[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) {
    throw new Error("Batch13 database identity or data directory verification failed.");
  }
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch13 synthetic database marker is missing.");
}

describePostgres.sequential("batch13 office profile consistency and live authorization", () => {
  beforeAll(async () => {
    await assertSyntheticEnvironment();
    const [superRole, officeRole, permission] = await Promise.all([
      prisma.role.upsert({ where: { name: "Super Admin" }, update: { status: "ACTIVE" }, create: { name: "Super Admin", status: "ACTIVE" } }),
      prisma.role.upsert({ where: { name: "Office Admin" }, update: { status: "ACTIVE" }, create: { name: "Office Admin", status: "ACTIVE" } }),
      prisma.permission.upsert({ where: { key: "settings.manage.any" }, update: {}, create: { key: "settings.manage.any" } })
    ]);
    superRoleId = superRole.id;
    officeRoleId = officeRole.id;
    settingsPermissionId = permission.id;
    officePermissionExisted = Boolean(await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: officeRoleId, permissionId: settingsPermissionId } }
    }));
    await denyOfficePermission();
    await prisma.user.createMany({
      data: [
        { id: ids.firstSuper, name: `${marker} first super`, email: `${ids.firstSuper}@example.test`, roleId: superRoleId, status: "ACTIVE" },
        { id: ids.secondSuper, name: `${marker} second super`, email: `${ids.secondSuper}@example.test`, roleId: superRoleId, status: "ACTIVE" },
        { id: ids.officeAdmin, name: `${marker} office admin`, email: `${ids.officeAdmin}@example.test`, roleId: officeRoleId, status: "ACTIVE" }
      ]
    });
    [firstSuperSession, secondSuperSession, officeSession] = await Promise.all([
      createActiveSession(ids.firstSuper),
      createActiveSession(ids.secondSuper),
      createActiveSession(ids.officeAdmin)
    ]);
  });

  beforeEach(async () => {
    await resetOfficeProfile();
    await denyOfficePermission();
    await restoreFirstSuperSession();
  });

  afterAll(async () => {
    await assertSyntheticEnvironment();
    await resetOfficeProfile();
    const security = await prisma.systemSetting.findUnique({ where: { key: "security.staff2fa" }, select: { id: true } });
    if (security) await prisma.auditLog.deleteMany({ where: { resourceId: security.id, actorId: { in: Object.values(ids) } } });
    await prisma.systemSetting.deleteMany({ where: { key: "security.staff2fa", updatedById: { in: Object.values(ids) } } });
    await prisma.session.deleteMany({ where: { userId: { in: Object.values(ids) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    if (officePermissionExisted) await grantOfficePermission();
    else await denyOfficePermission();
    await prisma.$disconnect();
  });

  it("lists an absent office profile with defaults and a null version", async () => {
    const response = await listAdminSettingsRoute(new Request("http://127.0.0.1:3115/api/admin/settings", {
      headers: { cookie: firstSuperSession.cookie }
    }));
    expect(response.status).toBe(200);
    const body = await responseData(response);
    const settings = (body.data?.settings ?? []) as Array<{ key: string; updatedAt: string | null; value: Record<string, unknown> }>;
    expect(settings.find(({ key }) => key === "office.profile")).toMatchObject({
      key: "office.profile",
      updatedAt: null,
      value: { firmName: "KMT Legal", primaryLocale: "ar" }
    });
  });

  it("allows exactly one first create and audits only the winner", async () => {
    const responses = await Promise.all([
      patch("office.profile", firstSuperSession.cookie, officePayload("First winner A", null)),
      patch("office.profile", secondSuperSession.cookie, officePayload("First winner B", null))
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    const winnerIndex = responses.findIndex(({ status }) => status === 200);
    const expectedName = winnerIndex === 0 ? "First winner A" : "First winner B";
    const expectedActor = winnerIndex === 0 ? ids.firstSuper : ids.secondSuper;
    const setting = await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } });
    expect(setting.value).toMatchObject({ firmName: expectedName });
    expect(setting.updatedById).toBe(expectedActor);
    expect(await prisma.auditLog.count({ where: { action: "settings.update", resourceId: setting.id } })).toBe(1);
  });

  it("allows one same-version update and keeps the value, actor, version, and audit aligned with its response", async () => {
    const initial = await patch("office.profile", firstSuperSession.cookie, officePayload("Observed profile", null));
    const initialBody = await responseData(initial);
    const version = String(initialBody.data?.updatedAt);
    const responses = await Promise.all([
      patch("office.profile", firstSuperSession.cookie, officePayload("Update winner A", version)),
      patch("office.profile", secondSuperSession.cookie, officePayload("Update winner B", version))
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    const winnerIndex = responses.findIndex(({ status }) => status === 200);
    const winnerBody = await responseData(responses[winnerIndex]!);
    const setting = await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } });
    expect(setting.value).toMatchObject({ firmName: winnerIndex === 0 ? "Update winner A" : "Update winner B" });
    expect(setting.updatedById).toBe(winnerIndex === 0 ? ids.firstSuper : ids.secondSuper);
    expect(setting.updatedAt.toISOString()).toBe(winnerBody.data?.updatedAt);
    expect(await prisma.auditLog.count({ where: { action: "settings.update", resourceId: setting.id } })).toBe(2);
  });

  it("rejects stale and null claims on an existing row, then accepts the returned current version", async () => {
    const created = await patch("office.profile", firstSuperSession.cookie, officePayload("Created", null));
    const createdBody = await responseData(created);
    const firstVersion = String(createdBody.data?.updatedAt);
    const changed = await patch("office.profile", firstSuperSession.cookie, officePayload("Changed", firstVersion));
    const changedBody = await responseData(changed);
    const currentVersion = String(changedBody.data?.updatedAt);

    expect((await patch("office.profile", secondSuperSession.cookie, officePayload("Stale", firstVersion))).status).toBe(409);
    expect((await patch("office.profile", secondSuperSession.cookie, officePayload("Null overwrite", null))).status).toBe(409);
    const retry = await patch("office.profile", secondSuperSession.cookie, officePayload("Reviewed retry", currentVersion));
    expect(retry.status).toBe(200);
    expect((await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } })).value).toMatchObject({ firmName: "Reviewed retry" });
  });

  it("advances the version even when the supplied clock equals or trails the observed version", async () => {
    const created = await patch("office.profile", firstSuperSession.cookie, officePayload("Clock seed", null));
    const createdBody = await responseData(created);
    const observed = String(createdBody.data?.updatedAt);
    const result = await updateAdminSetting({
      actor: { id: ids.firstSuper, roleName: "Super Admin", permissions: [] },
      actorSessionId: firstSuperSession.id,
      key: "office.profile",
      body: officePayload("Clock safe", observed),
      now: new Date(new Date(observed).getTime() - 60_000)
    });
    expect(new Date(result.updatedAt).getTime()).toBe(new Date(observed).getTime() + 1);
  });

  it("requires an explicit valid version without changing data", async () => {
    const missing = officePayload("Missing version", null);
    delete (missing as { updatedAt?: string | null }).updatedAt;
    const [missingResponse, malformedResponse] = await Promise.all([
      patch("office.profile", firstSuperSession.cookie, missing),
      patch("office.profile", firstSuperSession.cookie, { ...officePayload("Malformed version", null), updatedAt: "yesterday" })
    ]);
    expect([missingResponse.status, malformedResponse.status]).toEqual([400, 400]);
    expect(await prisma.systemSetting.count({ where: { key: "office.profile" } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "settings.update", actorId: ids.firstSuper } })).toBe(0);
  });

  it("preserves guest denial, default Office Admin denial, and delegated Office Admin access", async () => {
    expect((await patch("office.profile", null, officePayload("Guest", null))).status).toBe(401);
    expect((await patch("office.profile", officeSession.cookie, officePayload("Default office", null))).status).toBe(403);
    await grantOfficePermission();
    const delegated = await patch("office.profile", officeSession.cookie, officePayload("Delegated office", null));
    expect(delegated.status).toBe(200);
    expect((await prisma.systemSetting.findUniqueOrThrow({ where: { key: "office.profile" } })).updatedById).toBe(ids.officeAdmin);
  });

  it("rejects a write when the actual session is revoked after the route captured its real auth snapshot", async () => {
    const gate = authSnapshotGate.arm();
    let request: Promise<Response> | null = null;
    try {
      request = patch("office.profile", firstSuperSession.cookie, officePayload("Revoked session", null));
      await requireAuthBarrier(gate.reached, request);
      await prisma.session.update({ where: { id: firstSuperSession.id }, data: { status: "REVOKED", revokedAt: new Date() } });
      gate.release();
      expect((await request).status).toBe(403);
      expect(await prisma.systemSetting.count({ where: { key: "office.profile" } })).toBe(0);
      expect(await prisma.auditLog.count({ where: { action: "settings.update", actorId: ids.firstSuper } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      await restoreFirstSuperSession();
    }
  });

  it("rejects a write when delegated permission is removed after the route captured its real auth snapshot", async () => {
    await grantOfficePermission();
    const gate = authSnapshotGate.arm();
    let request: Promise<Response> | null = null;
    try {
      request = patch("office.profile", officeSession.cookie, officePayload("Removed permission", null));
      await requireAuthBarrier(gate.reached, request);
      await denyOfficePermission();
      gate.release();
      expect((await request).status).toBe(403);
      expect(await prisma.systemSetting.count({ where: { key: "office.profile" } })).toBe(0);
      expect(await prisma.auditLog.count({ where: { action: "settings.update", actorId: ids.officeAdmin } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      await denyOfficePermission();
    }
  });

  it("preserves the email, storage, and staff-2FA setting contracts", async () => {
    const email = await patch("email.policy", firstSuperSession.cookie, {
      key: "email.policy",
      mode: "disabled",
      fromLabel: "KMT Legal",
      staffNotificationsEnabled: false,
      appointmentRemindersEnabled: false
    });
    const storage = await patch("storage.policy", firstSuperSession.cookie, { key: "storage.policy" });
    const security = await patch("security.staff2fa", firstSuperSession.cookie, {
      key: "security.staff2fa",
      requiredForStaff: true,
      totpPrimary: true,
      emailOtpFallback: true,
      superAdminResetOnly: true
    });
    expect(email.status).toBe(403);
    expect(storage.status).toBe(409);
    expect(security.status).toBe(200);
    const securityBody = await responseData(security);
    expect(securityBody.data?.value).toEqual({
      requiredForStaff: false,
      totpPrimary: false,
      emailOtpFallback: false,
      superAdminResetOnly: true
    });
  });
});
