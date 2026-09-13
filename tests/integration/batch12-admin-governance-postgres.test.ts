import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const passwordHashGate = vi.hoisted(() => {
  type Gate = {
    expected: number;
    claimed: number;
    reached: Promise<void>;
    release: Promise<void>;
    markReached: () => void;
    releaseAll: () => void;
  };
  let activeGate: Gate | null = null;

  return {
    arm(expected: number) {
      let markReached: () => void = () => undefined;
      let releaseAll: () => void = () => undefined;
      const reached = new Promise<void>((resolve) => { markReached = resolve; });
      const release = new Promise<void>((resolve) => { releaseAll = resolve; });
      activeGate = { expected, claimed: 0, reached, release, markReached, releaseAll };
      return {
        reached,
        release() {
          activeGate = null;
          releaseAll();
        }
      };
    },
    async waitAfterRealHash() {
      const gate = activeGate;
      if (!gate || gate.claimed >= gate.expected) return;
      gate.claimed += 1;
      if (gate.claimed === gate.expected) gate.markReached();
      await gate.release;
    }
  };
});

vi.mock("@/server/auth/password", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/password")>();
  return {
    ...actual,
    async hashPassword(password: string) {
      const hash = await actual.hashPassword(password);
      await passwordHashGate.waitAfterRealHash();
      return hash;
    }
  };
});

import { POST as createAdminUserRoute } from "@/app/api/admin/users/route";
import { POST as updateAdminUserPasswordRoute } from "@/app/api/admin/users/[userId]/password/route";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

const enabled = process.env.RUN_BATCH12_POSTGRES === "true";
const databaseUrl = process.env.DATABASE_URL;
const describePostgres = enabled && databaseUrl ? describe : describe.skip;
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const marker = "batch12-synthetic-admin-governance";
const passwordA = "Batch12-Synthetic-A!2026";
const passwordB = "Batch12-Synthetic-B!2026";

const ids = {
  firstSuper: randomUUID(),
  secondSuper: randomUUID(),
  delegate: randomUUID(),
  target: randomUUID(),
  inactiveTarget: randomUUID()
};

let superRoleId = "";
let officeRoleId = "";
let lawyerRoleId = "";
let firstSuperSession: { id: string; cookie: string };
let secondSuperSession: { id: string; cookie: string };
let delegateSession: { id: string; cookie: string };
const createdUserIds: string[] = [];

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

function postRequest(path: string, cookie: string, body: Record<string, unknown>) {
  return new Request(`http://127.0.0.1:3115${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body)
  });
}

async function requireHashBarrier(reached: Promise<void>, request: Promise<Response>) {
  const outcome = await Promise.race([
    reached.then(() => ({ kind: "reached" as const })),
    request.then((response) => ({ kind: "resolved" as const, status: response.status }))
  ]);
  if (outcome.kind === "resolved") {
    throw new Error(`Request resolved with status ${outcome.status} before reaching the password hash barrier.`);
  }
}

function createPayload(email: string) {
  return {
    name: `${marker} created user`,
    email,
    phone: "",
    roleId: lawyerRoleId,
    status: "ACTIVE",
    locale: "ar",
    password: passwordA
  };
}

async function passwordPayload(userId: string, password: string, revokeSessions = true) {
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { updatedAt: true } });
  return { password, revokeSessions, updatedAt: target.updatedAt.toISOString() };
}

async function resetFirstSuperAccess() {
  await prisma.user.update({
    where: { id: ids.firstSuper },
    data: { roleId: superRoleId, status: "ACTIVE", deletedAt: null }
  });
  await prisma.session.updateMany({
    where: { userId: ids.firstSuper },
    data: { status: "ACTIVE", revokedAt: null, expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
  });
}

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch12 database test requires APP_ENV=local.");
  const parsed = new URL(databaseUrl!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") {
    throw new Error("Batch12 database test requires its authorized isolated connection identity.");
  }
  const identity = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"
  `;
  const current = identity[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) {
    throw new Error("Batch12 database identity or data directory verification failed.");
  }
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch12 synthetic database marker is missing.");
}

describePostgres("batch12 live admin authorization and password concurrency", () => {
  beforeAll(async () => {
    await assertSyntheticEnvironment();
    const [superRole, officeRole, lawyerRole, userManagePermission] = await Promise.all([
      prisma.role.upsert({ where: { name: "Super Admin" }, update: { status: "ACTIVE" }, create: { name: "Super Admin", status: "ACTIVE" } }),
      prisma.role.upsert({ where: { name: "Office Admin" }, update: { status: "ACTIVE" }, create: { name: "Office Admin", status: "ACTIVE" } }),
      prisma.role.upsert({ where: { name: "Lawyer" }, update: { status: "ACTIVE" }, create: { name: "Lawyer", status: "ACTIVE" } }),
      prisma.permission.upsert({ where: { key: "user.manage.any" }, update: {}, create: { key: "user.manage.any" } })
    ]);
    superRoleId = superRole.id;
    officeRoleId = officeRole.id;
    lawyerRoleId = lawyerRole.id;
    await prisma.rolePermission.createMany({
      data: [
        { roleId: superRoleId, permissionId: userManagePermission.id },
        { roleId: officeRoleId, permissionId: userManagePermission.id }
      ],
      skipDuplicates: true
    });
    const initialHash = await hashPassword("Batch12-Initial!2026");
    await prisma.user.createMany({
      data: [
        { id: ids.firstSuper, name: `${marker} first super`, email: `${ids.firstSuper}@example.test`, passwordHash: initialHash, roleId: superRoleId, status: "ACTIVE" },
        { id: ids.secondSuper, name: `${marker} second super`, email: `${ids.secondSuper}@example.test`, passwordHash: initialHash, roleId: superRoleId, status: "ACTIVE" },
        { id: ids.delegate, name: `${marker} delegate`, email: `${ids.delegate}@example.test`, passwordHash: initialHash, roleId: officeRoleId, status: "ACTIVE" },
        { id: ids.target, name: `${marker} target`, email: `${ids.target}@example.test`, passwordHash: initialHash, roleId: lawyerRoleId, status: "ACTIVE" },
        { id: ids.inactiveTarget, name: `${marker} inactive target`, email: `${ids.inactiveTarget}@example.test`, passwordHash: initialHash, roleId: lawyerRoleId, status: "SUSPENDED" }
      ]
    });
    [firstSuperSession, secondSuperSession, delegateSession] = await Promise.all([
      createActiveSession(ids.firstSuper),
      createActiveSession(ids.secondSuper),
      createActiveSession(ids.delegate)
    ]);
  });

  afterAll(async () => {
    await assertSyntheticEnvironment();
    const syntheticUsers = await prisma.user.findMany({
      where: { OR: [{ id: { in: [...Object.values(ids), ...createdUserIds] } }, { name: { startsWith: marker } }] },
      select: { id: true }
    });
    const userIds = syntheticUsers.map(({ id }) => id);
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { resourceId: { in: userIds } }] } });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("rejects account creation when the actor loses live authority while the real hash is paused", async () => {
    const email = `lost-create-${randomUUID()}@example.test`;
    const gate = passwordHashGate.arm(1);
    let request: Promise<Response> | null = null;
    try {
      request = createAdminUserRoute(postRequest("/api/admin/users", firstSuperSession.cookie, createPayload(email)));
      await requireHashBarrier(gate.reached, request);
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: ids.firstSuper }, data: { status: "SUSPENDED" } });
        await tx.session.updateMany({ where: { userId: ids.firstSuper }, data: { status: "REVOKED", revokedAt: new Date() } });
      });
      gate.release();
      const response = await request;

      expect(response.status).toBe(403);
      expect(await prisma.user.count({ where: { email } })).toBe(0);
      expect(await prisma.auditLog.count({ where: { actorId: ids.firstSuper, action: "user.create" } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      const created = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (created) {
        await prisma.auditLog.deleteMany({ where: { resourceId: created.id } });
        await prisma.user.delete({ where: { id: created.id } });
      }
      await resetFirstSuperAccess();
    }
  });

  it("rejects password reset when the actor session is revoked while the real hash is paused", async () => {
    const payload = await passwordPayload(ids.target, passwordA);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } });
    const gate = passwordHashGate.arm(1);
    let request: Promise<Response> | null = null;
    try {
      request = updateAdminUserPasswordRoute(
        postRequest(`/api/admin/users/${ids.target}/password`, firstSuperSession.cookie, payload),
        { params: Promise.resolve({ userId: ids.target }) }
      );
      await requireHashBarrier(gate.reached, request);
      await prisma.session.update({ where: { id: firstSuperSession.id }, data: { status: "REVOKED", revokedAt: new Date() } });
      gate.release();
      const response = await request;

      expect(response.status).toBe(403);
      const after = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } });
      expect(after.passwordHash === before.passwordHash).toBe(true);
      expect(await prisma.auditLog.count({ where: { actorId: ids.firstSuper, action: "user.password.update", resourceId: ids.target } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      await resetFirstSuperAccess();
    }
  });

  it("rechecks the destination role after hashing before creating an account", async () => {
    const email = `disabled-role-${randomUUID()}@example.test`;
    const gate = passwordHashGate.arm(1);
    let request: Promise<Response> | null = null;
    try {
      request = createAdminUserRoute(postRequest("/api/admin/users", firstSuperSession.cookie, createPayload(email)));
      await requireHashBarrier(gate.reached, request);
      await prisma.role.update({ where: { id: lawyerRoleId }, data: { status: "DISABLED" } });
      gate.release();
      const response = await request;

      expect(response.status).toBe(400);
      expect(await prisma.user.count({ where: { email } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      const created = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (created) {
        await prisma.auditLog.deleteMany({ where: { resourceId: created.id } });
        await prisma.user.delete({ where: { id: created.id } });
      }
      await prisma.role.update({ where: { id: lawyerRoleId }, data: { status: "ACTIVE" } });
    }
  });

  it("allows live exact Super Admin writes and denies a delegated user with matching permission keys", async () => {
    const deniedEmail = `delegate-${randomUUID()}@example.test`;
    const denied = await createAdminUserRoute(postRequest("/api/admin/users", delegateSession.cookie, createPayload(deniedEmail)));
    expect(denied.status).toBe(403);
    expect(await prisma.user.count({ where: { email: deniedEmail } })).toBe(0);

    const createdEmail = `live-super-${randomUUID()}@example.test`;
    const created = await createAdminUserRoute(postRequest("/api/admin/users", firstSuperSession.cookie, createPayload(createdEmail)));
    expect(created.status).toBe(201);
    const createdBody = await created.json() as { data: { id: string } };
    createdUserIds.push(createdBody.data.id);
  });

  it("rejects a password reset when the target changes after the form version was observed", async () => {
    const payload = await passwordPayload(ids.target, passwordA);
    const before = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } });
    const gate = passwordHashGate.arm(1);
    let request: Promise<Response> | null = null;
    try {
      request = updateAdminUserPasswordRoute(
        postRequest(`/api/admin/users/${ids.target}/password`, firstSuperSession.cookie, payload),
        { params: Promise.resolve({ userId: ids.target }) }
      );
      await requireHashBarrier(gate.reached, request);
      await prisma.user.update({ where: { id: ids.target }, data: { status: "SUSPENDED" } });
      gate.release();
      const response = await request;

      expect(response.status).toBe(409);
      const after = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true, status: true } });
      expect(after.passwordHash === before.passwordHash).toBe(true);
      expect(after.status).toBe("SUSPENDED");
      expect(await prisma.auditLog.count({ where: { action: "user.password.update", resourceId: ids.target } })).toBe(0);
    } finally {
      gate.release();
      await request?.catch(() => undefined);
      await prisma.user.update({ where: { id: ids.target }, data: { status: "ACTIVE" } });
    }
  });

  it("allows only one password reset for one observed target version", async () => {
    const target = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { updatedAt: true } });
    const sessions = await Promise.all([createActiveSession(ids.target), createActiveSession(ids.target)]);
    const auditBefore = await prisma.auditLog.count({ where: { action: "user.password.update", resourceId: ids.target } });
    const gate = passwordHashGate.arm(2);
    const first = updateAdminUserPasswordRoute(
      postRequest(`/api/admin/users/${ids.target}/password`, firstSuperSession.cookie, { password: passwordA, revokeSessions: true, updatedAt: target.updatedAt.toISOString() }),
      { params: Promise.resolve({ userId: ids.target }) }
    );
    const second = updateAdminUserPasswordRoute(
      postRequest(`/api/admin/users/${ids.target}/password`, secondSuperSession.cookie, { password: passwordB, revokeSessions: true, updatedAt: target.updatedAt.toISOString() }),
      { params: Promise.resolve({ userId: ids.target }) }
    );
    await gate.reached;
    gate.release();
    const responses = await Promise.all([first, second]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: ids.target }, select: { passwordHash: true } });
    const winningPassword = responses[0]?.status === 200 ? passwordA : passwordB;
    const losingPassword = responses[0]?.status === 200 ? passwordB : passwordA;
    expect(await verifyPassword(winningPassword, updated.passwordHash)).toBe(true);
    expect(await verifyPassword(losingPassword, updated.passwordHash)).toBe(false);
    expect(await prisma.auditLog.count({ where: { action: "user.password.update", resourceId: ids.target } })).toBe(auditBefore + 1);
    expect(await prisma.session.count({ where: { id: { in: sessions.map(({ id }) => id) }, status: "REVOKED", revokedAt: { not: null } } })).toBe(2);
  });

  it("preserves self-session exclusion and revokeSessions=false for an already inactive target", async () => {
    const otherSelfSession = await createActiveSession(ids.firstSuper);
    const selfPayload = await passwordPayload(ids.firstSuper, passwordA, true);
    const selfResponse = await updateAdminUserPasswordRoute(
      postRequest(`/api/admin/users/${ids.firstSuper}/password`, firstSuperSession.cookie, selfPayload),
      { params: Promise.resolve({ userId: ids.firstSuper }) }
    );
    expect(selfResponse.status).toBe(200);
    const selfSessions = await prisma.session.findMany({ where: { id: { in: [firstSuperSession.id, otherSelfSession.id] } }, select: { id: true, status: true, revokedAt: true } });
    expect(selfSessions.find(({ id }) => id === firstSuperSession.id)).toMatchObject({ status: "ACTIVE", revokedAt: null });
    expect(selfSessions.find(({ id }) => id === otherSelfSession.id)).toMatchObject({ status: "REVOKED" });

    const inactiveSession = await createActiveSession(ids.inactiveTarget);
    const inactivePayload = await passwordPayload(ids.inactiveTarget, passwordB, false);
    const inactiveResponse = await updateAdminUserPasswordRoute(
      postRequest(`/api/admin/users/${ids.inactiveTarget}/password`, firstSuperSession.cookie, inactivePayload),
      { params: Promise.resolve({ userId: ids.inactiveTarget }) }
    );
    expect(inactiveResponse.status).toBe(200);
    expect(await verifyPassword(passwordB, (await prisma.user.findUniqueOrThrow({ where: { id: ids.inactiveTarget }, select: { passwordHash: true } })).passwordHash)).toBe(true);
    expect(await prisma.session.findUniqueOrThrow({ where: { id: inactiveSession.id }, select: { status: true, revokedAt: true } })).toEqual({ status: "ACTIVE", revokedAt: null });
  });
});
