import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Principal } from "@/server/auth/policy";
import { SESSION_COOKIE_NAME, createSessionToken, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";
import { getAdminConversationDetail, getClientConversationDetail, replyAdminConversation, replyClientConversation, createOrContinueClientConversation } from "@/server/conversations/conversation-service";
import { GET as getClientThreadRoute } from "@/app/api/client/messages/[threadId]/route";
import { POST as postClientThreadMessageRoute } from "@/app/api/client/messages/[threadId]/messages/route";
import { GET as getAdminThreadRoute } from "@/app/api/admin/messages/[threadId]/route";

const enabled = process.env.RUN_BATCH10_POSTGRES === "true";
const databaseUrl = process.env.DATABASE_URL;
const marker = "batch10-synthetic-conversation";
const expectedDataDirectory = "C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office/_workspace/batch10-postgres/data";
const describePostgres = enabled && databaseUrl ? describe : describe.skip;

const ids = {
  clientUser: randomUUID(),
  otherClientUser: randomUUID(),
  staffUser: randomUUID(),
  client: randomUUID(),
  otherClient: randomUUID()
};
let clientRoleId = "";
let staffRoleId = "";

const clientActor: Principal = {
  id: ids.clientUser,
  roleName: "Client",
  clientId: ids.client,
  permissions: ["client.read.self", "conversation.read.own", "conversation.create.own", "conversation.reply.own"]
};

const otherClientActor: Principal = { ...clientActor, id: ids.otherClientUser, clientId: ids.otherClient };
const staffActor: Principal = {
  id: ids.staffUser,
  roleName: "Office Admin",
  permissions: ["conversation.read.any", "conversation.reply.any", "conversation.manage.any"]
};

async function createThread(subject: string) {
  return prisma.conversationThread.create({
    data: { clientId: ids.client, subject: `${marker}:${subject}`, status: "OPEN" },
    select: { id: true }
  });
}

async function waitForBlockedThreadLocks(observer: Client, blockerPid: number, minimumWaiting = 1) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const result = await observer.query<{ waiting: number }>(`
      SELECT count(*)::int AS waiting
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND wait_event_type = 'Lock'
        AND $1 = ANY(pg_blocking_pids(pid))
    `, [blockerPid]);
    if ((result.rows[0]?.waiting ?? 0) >= minimumWaiting) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error("The reply transaction did not wait for the controlled conversation lock.");
}

async function waitForClientWaitOnLock(observer: Client, clientPid: number) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const result = await observer.query<{ waiting: boolean }>(`
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity WHERE pid = $1 AND wait_event_type = 'Lock'
      ) AS waiting
    `, [clientPid]);
    if (result.rows[0]?.waiting) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error("The later close request did not wait for the controlled conversation lock.");
}

async function closeWhileReplyWaits(input: {
  threadId: string;
  reply: () => Promise<unknown>;
  status?: "CLOSED" | "ARCHIVED";
}) {
  const locker = new Client({ connectionString: databaseUrl });
  const observer = new Client({ connectionString: databaseUrl });
  await Promise.all([locker.connect(), observer.connect()]);
  let reply: Promise<unknown> | null = null;
  try {
    const { rows: [connection] } = await locker.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
    await locker.query("BEGIN");
    await locker.query('SELECT "id" FROM "conversation_threads" WHERE "id" = $1::uuid FOR UPDATE', [input.threadId]);
    reply = input.reply();
    await waitForBlockedThreadLocks(observer, connection!.pid);
    await locker.query('UPDATE "conversation_threads" SET "status" = $2::"ConversationThreadStatus", "closedAt" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid', [input.threadId, input.status ?? "CLOSED"]);
    await locker.query("COMMIT");
    await expect(reply).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
  } finally {
    await locker.query("ROLLBACK").catch(() => undefined);
    await reply?.catch(() => undefined);
    await Promise.all([locker.end(), observer.end()]);
  }
}

async function replyBeforeClose(input: { threadId: string; reply: () => Promise<unknown> }) {
  const locker = new Client({ connectionString: databaseUrl });
  const observer = new Client({ connectionString: databaseUrl });
  const closer = new Client({ connectionString: databaseUrl });
  await Promise.all([locker.connect(), observer.connect(), closer.connect()]);
  let reply: Promise<unknown> | null = null;
  let close: Promise<unknown> | null = null;
  try {
    const { rows: [connection] } = await locker.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
    const { rows: [closerConnection] } = await closer.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
    await locker.query("BEGIN");
    await locker.query('SELECT "id" FROM "conversation_threads" WHERE "id" = $1::uuid FOR UPDATE', [input.threadId]);
    reply = input.reply();
    await waitForBlockedThreadLocks(observer, connection!.pid);
    close = closer.query(
      'UPDATE "conversation_threads" SET "status" = \'CLOSED\'::"ConversationThreadStatus", "closedAt" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid',
      [input.threadId]
    );
    await waitForClientWaitOnLock(observer, closerConnection!.pid);
    await locker.query("COMMIT");
    await expect(reply).resolves.toMatchObject({ status: "WAITING_STAFF" });
    await close;
  } finally {
    await locker.query("ROLLBACK").catch(() => undefined);
    await reply?.catch(() => undefined);
    await close?.catch(() => undefined);
    await Promise.all([locker.end(), observer.end(), closer.end()]);
  }
}

async function createSessionCookie(userId: string) {
  const token = createSessionToken();
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    }
  });
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
}

async function assertSyntheticEnvironment() {
  if (process.env.APP_ENV !== "local") throw new Error("Batch10 database test requires APP_ENV=local.");
  const parsed = new URL(databaseUrl!);
  if (parsed.hostname !== "127.0.0.1" || parsed.port !== "55441" || parsed.pathname !== "/kmt_batch10" || parsed.username !== "kmt_batch10") {
    throw new Error("Batch10 database test requires its authorized isolated connection identity.");
  }
  const identity = await prisma.$queryRaw<Array<{ database: string; username: string; port: number; dataDirectory: string }>>`
    SELECT current_database() AS database, current_user AS username, inet_server_port() AS port, current_setting('data_directory') AS "dataDirectory"
  `;
  const current = identity[0];
  if (!current || current.database !== "kmt_batch10" || current.username !== "kmt_batch10" || current.port !== 55441 || current.dataDirectory.replaceAll("\\", "/") !== expectedDataDirectory) {
    throw new Error("Batch10 database identity or data directory verification failed.");
  }
  const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
  if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch10 synthetic database marker is missing.");
}

describePostgres("batch10 real PostgreSQL conversation write lock", () => {
  beforeAll(async () => {
    await assertSyntheticEnvironment();
    const [clientRole, staffRole] = await Promise.all([
      prisma.role.upsert({ where: { name: "Client" }, update: {}, create: { name: "Client", status: "ACTIVE" } }),
      prisma.role.upsert({ where: { name: "Super Admin" }, update: {}, create: { name: "Super Admin", status: "ACTIVE" } })
    ]);
    clientRoleId = clientRole.id;
    staffRoleId = staffRole.id;
    const clientPortalPermissions = await Promise.all(["client.read.self", "conversation.read.own", "conversation.create.own", "conversation.reply.own"].map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
    ));
    await prisma.rolePermission.createMany({
      data: clientPortalPermissions.map((permission) => ({ roleId: clientRoleId, permissionId: permission.id })),
      skipDuplicates: true
    });
    await prisma.user.createMany({
      data: [
        { id: ids.clientUser, name: marker, email: `${ids.clientUser}@example.test`, roleId: clientRoleId, status: "ACTIVE" },
        { id: ids.otherClientUser, name: marker, email: `${ids.otherClientUser}@example.test`, roleId: clientRoleId, status: "ACTIVE" },
        { id: ids.staffUser, name: marker, email: `${ids.staffUser}@example.test`, roleId: staffRoleId, status: "ACTIVE" }
      ]
    });
    await prisma.client.createMany({
      data: [
        { id: ids.client, userId: ids.clientUser, fullName: marker, phone: "201000000001", status: "ACTIVE" },
        { id: ids.otherClient, userId: ids.otherClientUser, fullName: marker, phone: "201000000002", status: "ACTIVE" }
      ]
    });
  });

  afterAll(async () => {
    await assertSyntheticEnvironment();
    await prisma.conversationThread.deleteMany({ where: { clientId: { in: [ids.client, ids.otherClient] } } });
    await prisma.auditLog.deleteMany({ where: { clientId: { in: [ids.client, ids.otherClient] } } });
    await prisma.client.deleteMany({ where: { id: { in: [ids.client, ids.otherClient] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ids.clientUser, ids.otherClientUser, ids.staffUser] } } });
    await prisma.$disconnect();
  });

  it("rejects client, staff, and continue writes that lose the real lock race without a message or success audit", async () => {
    const clientThread = await createThread("client-reply");
    const staffThread = await createThread("staff-reply");
    const continueThread = await createThread("continue-existing");

    await closeWhileReplyWaits({
      threadId: clientThread.id,
      reply: () => replyClientConversation({ actor: clientActor, threadId: clientThread.id, body: { message: "synthetic client reply" } })
    });
    await closeWhileReplyWaits({
      threadId: staffThread.id,
      status: "ARCHIVED",
      reply: () => replyAdminConversation({ actor: staffActor, threadId: staffThread.id, body: { message: "synthetic staff reply" } })
    });
    await closeWhileReplyWaits({
      threadId: continueThread.id,
      reply: () => createOrContinueClientConversation({ actor: clientActor, body: { message: "synthetic continue reply" } })
    });

    const threads = await prisma.conversationThread.findMany({
      where: { id: { in: [clientThread.id, staffThread.id, continueThread.id] } },
      select: { id: true, status: true, closedAt: true, _count: { select: { messages: true } } }
    });
    expect(threads).toHaveLength(3);
    expect(threads.every((thread) => (thread.status === "CLOSED" || thread.status === "ARCHIVED") && thread.closedAt && thread._count.messages === 0)).toBe(true);
    await expect(prisma.auditLog.count({ where: { clientId: ids.client, action: { startsWith: "conversation." } } })).resolves.toBe(0);
  });

  it("allows a reply that obtains the write lock before a later close, then leaves the thread closed", async () => {
    const thread = await createThread("reply-before-close");
    await replyBeforeClose({
      threadId: thread.id,
      reply: () => replyClientConversation({ actor: clientActor, threadId: thread.id, body: { message: "synthetic ordered reply" } })
    });
    const closed = await prisma.conversationThread.findUniqueOrThrow({ where: { id: thread.id }, include: { messages: true } });
    expect(closed.status).toBe("CLOSED");
    expect(closed.messages).toHaveLength(1);
  });

  it("keeps owner and staff access separate for synthetic principals", async () => {
    const thread = await createThread("ownership");
    await expect(getClientConversationDetail({ actor: otherClientActor, threadId: thread.id })).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    await expect(getClientConversationDetail({ actor: { ...clientActor, permissions: [] }, threadId: thread.id })).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });
    await expect(getAdminConversationDetail({ actor: staffActor, threadId: thread.id })).resolves.toMatchObject({ id: thread.id });
  });

  it("enforces unauthenticated and owner-only detail/reply routes with synthetic active sessions", async () => {
    const thread = await createThread("http-session-ownership");
    const ownerCookie = await createSessionCookie(ids.clientUser);
    const otherCookie = await createSessionCookie(ids.otherClientUser);
    const staffCookie = await createSessionCookie(ids.staffUser);
    const params = { params: Promise.resolve({ threadId: thread.id }) };
    const unauthenticated = await getClientThreadRoute(new Request(`http://batch10.test/api/client/messages/${thread.id}`), params);
    const owner = await getClientThreadRoute(new Request(`http://batch10.test/api/client/messages/${thread.id}`, { headers: { cookie: ownerCookie } }), params);
    const otherClient = await getClientThreadRoute(new Request(`http://batch10.test/api/client/messages/${thread.id}`, { headers: { cookie: otherCookie } }), params);
    const staff = await getAdminThreadRoute(new Request(`http://batch10.test/api/admin/messages/${thread.id}`, { headers: { cookie: staffCookie } }), params);
    const unauthenticatedReply = await postClientThreadMessageRoute(new Request(`http://batch10.test/api/client/messages/${thread.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "synthetic unauthenticated reply" })
    }), params);
    const otherClientReply = await postClientThreadMessageRoute(new Request(`http://batch10.test/api/client/messages/${thread.id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json", cookie: otherCookie }, body: JSON.stringify({ message: "synthetic other-client reply" })
    }), params);
    expect(unauthenticated.status).toBe(401);
    expect(owner.status).toBe(200);
    expect(otherClient.status).toBe(404);
    expect(staff.status).toBe(200);
    expect(unauthenticatedReply.status).toBe(401);
    expect(otherClientReply.status).toBe(404);
  });
});
