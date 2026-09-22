import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Principal } from "@/server/auth/policy";

const serviceMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  userFindFirst: vi.fn(),
  audit: vi.fn(async () => undefined)
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    conversationThread: {
      findUnique: serviceMocks.findUnique,
      update: serviceMocks.update
    },
    user: { findFirst: serviceMocks.userFindFirst }
  }
}));

vi.mock("@/server/audit/audit-service", () => ({
  appendAuditLogBestEffort: serviceMocks.audit
}));

import { updateAdminConversation } from "@/server/conversations/conversation-service";

const actor: Principal = {
  id: "11000000-0000-4000-8000-000000000001",
  roleName: "Office Admin",
  permissions: ["conversation.read.any", "conversation.manage.any"]
};

const thread = {
  id: "12000000-0000-4000-8000-000000000001",
  clientId: "13000000-0000-4000-8000-000000000001",
  assignedToId: null,
  status: "WAITING_STAFF",
  subject: "Support",
  client: { id: "13000000-0000-4000-8000-000000000001", fullName: "Client", phone: "201000000000", email: null },
  assignedTo: null,
  lastMessageAt: new Date("2026-09-22T09:00:00.000Z"),
  closedAt: null,
  createdAt: new Date("2026-09-22T08:00:00.000Z"),
  updatedAt: new Date("2026-09-22T10:00:00.000Z"),
  messages: []
};

describe("conversation management optimistic concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.findUnique.mockResolvedValue(thread);
    serviceMocks.update.mockResolvedValue({
      ...thread,
      status: "CLOSED",
      closedAt: new Date("2026-09-22T10:01:00.000Z"),
      updatedAt: new Date("2026-09-22T10:01:00.000Z")
    });
  });

  it("makes the management write conditional on the submitted thread version", async () => {
    const result = await updateAdminConversation({
      actor,
      threadId: thread.id,
      body: { status: "CLOSED", updatedAt: "2026-09-22T10:00:00.000Z" }
    });

    expect(serviceMocks.update).toHaveBeenCalledWith({
      where: { id: thread.id, updatedAt: new Date("2026-09-22T10:00:00.000Z") },
      data: { status: "CLOSED", closedAt: expect.any(Date) },
      include: expect.any(Object)
    });
    expect(result.status).toBe("CLOSED");
    expect(serviceMocks.audit).toHaveBeenCalledOnce();
  });

  it("maps a lost update race to conflict and does not emit a success audit", async () => {
    serviceMocks.update.mockRejectedValueOnce({ code: "P2025" });

    await expect(updateAdminConversation({
      actor,
      threadId: thread.id,
      body: { status: "CLOSED", updatedAt: "2026-09-22T09:59:00.000Z" }
    })).rejects.toMatchObject({ status: 409, code: "CONFLICT" });

    expect(serviceMocks.audit).not.toHaveBeenCalled();
  });
});
