import { describe, expect, it, vi } from "vitest";
import {
  adminContactMessageListQuerySchema,
  adminContactMessageStatusUpdateSchema,
  canManageAdminContactMessages,
  canReadAdminContactMessages,
  listAdminContactMessages,
  updateAdminContactMessageStatus
} from "@/server/admin/contact-message-service";
import type { Principal } from "@/server/auth/policy";

const contactManager: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: "Office Admin",
  permissions: ["contact.read.any", "contact.manage.any"]
};

const contactReader: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: "Lawyer",
  permissions: ["contact.read.any"]
};

const unrelatedStaff: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: "Lawyer",
  permissions: ["client.read.assigned"]
};

const messageId = "44444444-4444-4444-8444-444444444444";
const createdAt = new Date("2026-07-22T08:00:00.000Z");

type ContactStatus = "NEW" | "REVIEWED" | "ARCHIVED";

function contactRecord(status: ContactStatus, reviewerId: string | null = null) {
  return {
    id: messageId,
    fullName: "عميل اختبار",
    email: "contact@example.test",
    phone: "+201000000000",
    topic: "documents",
    message: "رسالة اختبار طويلة لا ينبغي أن تسحب معها أي علاقات غير لازمة.",
    status,
    createdAt,
    reviewedAt: status === "NEW" ? null : new Date("2026-07-22T09:00:00.000Z"),
    reviewedBy: reviewerId ? { id: reviewerId, name: "مدير المكتب" } : null
  };
}

function transactionHarness(initialStatus: ContactStatus, options: { concurrentReads?: boolean; auditFails?: boolean } = {}) {
  let status = initialStatus;
  let reviewerId: string | null = initialStatus === "NEW" ? null : contactManager.id;
  const auditRows: Array<Record<string, unknown>> = [];
  let initialReads = 0;
  let releaseInitialReads: (() => void) | undefined;
  const initialReadBarrier = new Promise<void>((resolve) => {
    releaseInitialReads = resolve;
  });

  const host = {
    $transaction: vi.fn(async (operation: (client: unknown) => Promise<unknown>) => {
      const previousStatus = status;
      const previousReviewerId = reviewerId;
      const previousAuditCount = auditRows.length;
      let claimed = false;
      const client = {
        contactMessage: {
          findUnique: vi.fn(async () => {
            if (options.concurrentReads && initialReads < 2) {
              initialReads += 1;
              if (initialReads === 2) releaseInitialReads?.();
              await initialReadBarrier;
            }
            return contactRecord(status, reviewerId);
          }),
          updateMany: vi.fn(async (args: { where: { id: string; status: ContactStatus }; data: { status: ContactStatus; reviewedById: string } }) => {
            if (args.where.id !== messageId || args.where.status !== status) return { count: 0 };
            claimed = true;
            status = args.data.status;
            reviewerId = args.data.reviewedById;
            return { count: 1 };
          })
        },
        auditLog: {
          create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
            if (options.auditFails) throw new Error("audit write failed");
            auditRows.push(data);
            return data;
          })
        }
      };

      try {
        return await operation(client);
      } catch (error) {
        if (claimed) {
          status = previousStatus;
          reviewerId = previousReviewerId;
          auditRows.splice(previousAuditCount);
        }
        throw error;
      }
    })
  };

  return {
    host,
    auditRows,
    status: () => status
  };
}

describe("admin contact message contract", () => {
  it("keeps contact message reads and status changes behind explicit permissions", async () => {
    expect(canReadAdminContactMessages(contactManager)).toBe(true);
    expect(canManageAdminContactMessages(contactManager)).toBe(true);
    expect(canReadAdminContactMessages(contactReader)).toBe(true);
    expect(canManageAdminContactMessages(contactReader)).toBe(false);
    expect(canReadAdminContactMessages(unrelatedStaff)).toBe(false);

    await expect(
      listAdminContactMessages({ actor: unrelatedStaff, query: {}, client: {} as never })
    ).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });
    await expect(
      updateAdminContactMessageStatus({
        actor: contactReader,
        messageId,
        body: { status: "REVIEWED" },
        client: {} as never
      })
    ).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });
  });

  it("validates bounded list filters and status updates", () => {
    const query = adminContactMessageListQuerySchema.parse({
      q: "documents",
      status: "NEW",
      topic: "documents",
      sortBy: "status",
      sortDirection: "asc",
      page: "2",
      pageSize: "25"
    });

    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(25);
    expect(() => adminContactMessageListQuerySchema.parse({ pageSize: 81 })).toThrow();
    expect(adminContactMessageStatusUpdateSchema.parse({ status: "REVIEWED" }).status).toBe("REVIEWED");
    expect(() => adminContactMessageStatusUpdateSchema.parse({ status: "NEW" })).toThrow();
  });

  it("uses an explicit minimized queue projection", async () => {
    const findMany = vi.fn(async () => [contactRecord("NEW")]);
    const count = vi.fn(async () => 1);

    const result = await listAdminContactMessages({
      actor: contactReader,
      query: {},
      client: { contactMessage: { findMany, count } } as never
    });

    const [query] = findMany.mock.calls[0] as unknown as [{ select: Record<string, unknown> }];
    expect(Object.keys(query.select).sort()).toEqual(
      ["createdAt", "email", "fullName", "id", "message", "phone", "reviewedAt", "reviewedBy", "status", "topic"].sort()
    );
    expect(JSON.stringify(query.select)).not.toMatch(/phoneCanonical|password|client|notes|deletedAt/);
    expect(result.items).toHaveLength(1);
  });

  it("enforces allowed transitions, same-state idempotency, and exactly one direct audit", async () => {
    const harness = transactionHarness("NEW");

    const reviewed = await updateAdminContactMessageStatus({
      actor: contactManager,
      messageId,
      body: { status: "REVIEWED" },
      client: harness.host as never,
      requestId: "req-contact-review"
    });
    const replayed = await updateAdminContactMessageStatus({
      actor: contactManager,
      messageId,
      body: { status: "REVIEWED" },
      client: harness.host as never,
      requestId: "req-contact-replay"
    });

    expect(reviewed.status).toBe("REVIEWED");
    expect(replayed.status).toBe("REVIEWED");
    expect(harness.auditRows).toHaveLength(1);
    expect(harness.auditRows[0]).toMatchObject({
      action: "contact.message_update",
      resourceType: "ContactMessage",
      resourceId: messageId,
      actorId: contactManager.id
    });

    await updateAdminContactMessageStatus({
      actor: contactManager,
      messageId,
      body: { status: "ARCHIVED" },
      client: harness.host as never
    });
    expect(harness.status()).toBe("ARCHIVED");
    expect(harness.auditRows).toHaveLength(2);
    await expect(
      updateAdminContactMessageStatus({
        actor: contactManager,
        messageId,
        body: { status: "REVIEWED" },
        client: harness.host as never
      })
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("makes concurrent identical targets idempotent and different targets conflict", async () => {
    const identical = transactionHarness("NEW", { concurrentReads: true });
    const sameTargetResults = await Promise.all([
      updateAdminContactMessageStatus({ actor: contactManager, messageId, body: { status: "REVIEWED" }, client: identical.host as never }),
      updateAdminContactMessageStatus({ actor: contactManager, messageId, body: { status: "REVIEWED" }, client: identical.host as never })
    ]);

    expect(sameTargetResults.map((result: { status: string }) => result.status)).toEqual(["REVIEWED", "REVIEWED"]);
    expect(identical.auditRows).toHaveLength(1);

    const different = transactionHarness("NEW", { concurrentReads: true });
    const raceResults = await Promise.allSettled([
      updateAdminContactMessageStatus({ actor: contactManager, messageId, body: { status: "REVIEWED" }, client: different.host as never }),
      updateAdminContactMessageStatus({ actor: contactManager, messageId, body: { status: "ARCHIVED" }, client: different.host as never })
    ]);

    expect(raceResults.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    const rejection = raceResults.find(({ status }) => status === "rejected");
    expect(rejection).toMatchObject({ status: "rejected", reason: { status: 409, code: "CONFLICT" } });
    expect(different.auditRows).toHaveLength(1);
  });

  it("rolls back the claimed transition when the direct audit insert fails", async () => {
    const harness = transactionHarness("NEW", { auditFails: true });

    await expect(
      updateAdminContactMessageStatus({
        actor: contactManager,
        messageId,
        body: { status: "REVIEWED" },
        client: harness.host as never
      })
    ).rejects.toThrow("audit write failed");
    expect(harness.status()).toBe("NEW");
    expect(harness.auditRows).toHaveLength(0);
  });
});
