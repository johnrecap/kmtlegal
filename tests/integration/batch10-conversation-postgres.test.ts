import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { getAdminConversationDetail, getClientConversationDetail, replyAdminConversation, replyClientConversation, createOrContinueClientConversation } from "@/server/conversations/conversation-service";

const enabled = process.env.RUN_BATCH10_POSTGRES === "true";
const databaseUrl = process.env.DATABASE_URL;
const marker = "batch10-synthetic-conversation";
const describePostgres = enabled && databaseUrl ? describe : describe.skip;

const ids = {
  role: randomUUID(),
  clientUser: randomUUID(),
  otherClientUser: randomUUID(),
  staffUser: randomUUID(),
  client: randomUUID(),
  otherClient: randomUUID()
};

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

async function waitForBlockedThreadLock(observer: Client) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const result = await observer.query<{ waiting: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_stat_activity
        WHERE datname = current_database() AND wait_event_type = 'Lock'
      ) AS waiting
    `);
    if (result.rows[0]?.waiting) return;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error("The reply transaction did not wait for the controlled conversation lock.");
}

async function closeWhileReplyWaits(input: {
  threadId: string;
  reply: () => Promise<unknown>;
}) {
  const locker = new Client({ connectionString: databaseUrl });
  const observer = new Client({ connectionString: databaseUrl });
  await Promise.all([locker.connect(), observer.connect()]);
  let reply: Promise<unknown> | null = null;
  try {
    await locker.query("BEGIN");
    await locker.query('SELECT "id" FROM "conversation_threads" WHERE "id" = $1::uuid FOR UPDATE', [input.threadId]);
    reply = input.reply();
    await waitForBlockedThreadLock(observer);
    await locker.query('UPDATE "conversation_threads" SET "status" = \'CLOSED\', "closedAt" = CURRENT_TIMESTAMP WHERE "id" = $1::uuid', [input.threadId]);
    await locker.query("COMMIT");
    await expect(reply).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
  } finally {
    await locker.query("ROLLBACK").catch(() => undefined);
    await reply?.catch(() => undefined);
    await Promise.all([locker.end(), observer.end()]);
  }
}

describePostgres("batch10 real PostgreSQL conversation write lock", () => {
  beforeAll(async () => {
    const markerRow = await prisma.$queryRaw<Array<{ marker: string }>>`SELECT marker FROM batch10_marker WHERE marker = 'synthetic-batch10-only'`;
    if (markerRow[0]?.marker !== "synthetic-batch10-only") throw new Error("Batch10 synthetic database marker is missing.");
    await prisma.role.create({ data: { id: ids.role, name: `${marker}:${ids.role}`, status: "ACTIVE" } });
    await prisma.user.createMany({
      data: [
        { id: ids.clientUser, name: marker, email: `${ids.clientUser}@example.test`, roleId: ids.role, status: "ACTIVE" },
        { id: ids.otherClientUser, name: marker, email: `${ids.otherClientUser}@example.test`, roleId: ids.role, status: "ACTIVE" },
        { id: ids.staffUser, name: marker, email: `${ids.staffUser}@example.test`, roleId: ids.role, status: "ACTIVE" }
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
    await prisma.conversationThread.deleteMany({ where: { clientId: { in: [ids.client, ids.otherClient] } } });
    await prisma.auditLog.deleteMany({ where: { clientId: { in: [ids.client, ids.otherClient] } } });
    await prisma.client.deleteMany({ where: { id: { in: [ids.client, ids.otherClient] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ids.clientUser, ids.otherClientUser, ids.staffUser] } } });
    await prisma.role.delete({ where: { id: ids.role } });
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
    expect(threads.every((thread) => thread.status === "CLOSED" && thread.closedAt && thread._count.messages === 0)).toBe(true);
    await expect(prisma.auditLog.count({ where: { clientId: ids.client, action: { startsWith: "conversation." } } })).resolves.toBe(0);
  });

  it("allows a reply that obtains the write lock before a later close, then leaves the thread closed", async () => {
    const thread = await createThread("reply-before-close");
    const reply = await replyClientConversation({ actor: clientActor, threadId: thread.id, body: { message: "synthetic ordered reply" } });
    expect(reply.status).toBe("WAITING_STAFF");
    await prisma.conversationThread.update({ where: { id: thread.id }, data: { status: "CLOSED", closedAt: new Date() } });
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
});
