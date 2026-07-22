import { describe, expect, it, vi } from "vitest";
import {
  CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
  adminNotificationQuerySchema,
  createConsultationReviewNotifications,
  listAdminNotifications,
  markAdminNotificationRead
} from "@/server/admin/notification-service";
import type { Principal } from "@/server/auth/policy";

const notificationOwner: Principal = {
  id: "51000000-0000-4000-8000-000000000001",
  roleName: "Office Admin",
  permissions: [
    "notification.read.self",
    "consultation.review.any",
    "case.read.any",
    "appointment.manage.any",
    "document.manage.any",
    "finance.read.any"
  ]
};

const notificationOnly: Principal = {
  id: "51000000-0000-4000-8000-000000000002",
  roleName: "Marketing Staff",
  permissions: ["notification.read.self"]
};

const assignedLawyer: Principal = {
  id: "51000000-0000-4000-8000-000000000003",
  roleName: "Lawyer",
  permissions: ["notification.read.self", "case.read.assigned", "consultation.review.assigned"]
};

const consultationOnly: Principal = {
  id: "51000000-0000-4000-8000-000000000004",
  roleName: "Secretary",
  permissions: ["consultation.review.any"]
};

type GenericRow = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "SYSTEM" | "CASE" | "CONSULTATION" | "APPOINTMENT" | "DOCUMENT" | "PAYMENT" | "SECURITY";
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type ReviewRow = {
  id: string;
  fullName: string;
  assignedLawyerId: string | null;
  createdAt: Date;
  appointments: Array<{ startsAt: Date }>;
};

function generic(index: number, overrides: Partial<GenericRow> = {}): GenericRow {
  return {
    id: `52000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    userId: notificationOwner.id,
    title: `إشعار ${index}`,
    body: `تفاصيل الإشعار ${index}`,
    type: "SYSTEM",
    resourceType: null,
    resourceId: null,
    actionUrl: "/admin/notifications",
    readAt: null,
    createdAt: new Date(Date.UTC(2026, 6, 22, 12, 0, 0) - index * 60_000),
    ...overrides
  };
}

function review(index: number, overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    id: `53000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    fullName: `طالب استشارة ${index}`,
    assignedLawyerId: null,
    createdAt: new Date(Date.UTC(2026, 6, 22, 11, 30, 0) - index * 60_000),
    appointments: [{ startsAt: new Date(Date.UTC(2026, 6, 23, 10 + index, 0, 0)) }],
    ...overrides
  };
}

function notificationClient(input: {
  notifications?: GenericRow[];
  consultations?: ReviewRow[];
  cases?: Record<string, { assignedLawyerId: string | null; deletedAt: Date | null; client: { userId: string | null } }>;
}) {
  const notifications = input.notifications ?? [];
  const consultations = input.consultations ?? [];
  const notificationFindMany = vi.fn(async () => notifications);
  const consultationFindMany = vi.fn(async () => consultations);
  const notificationUpdate = vi.fn(async ({ where, data }: { where: { id: string }; data: { readAt: Date } }) => {
    const row = notifications.find(({ id }) => id === where.id);
    if (!row) throw new Error("missing notification");
    row.readAt = data.readAt;
    return row;
  });

  return {
    client: {
      notification: {
        findMany: notificationFindMany,
        findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) =>
          notifications.find(({ id, userId }) => id === where.id && userId === where.userId) ?? null
        ),
        update: notificationUpdate
      },
      consultationRequest: {
        findMany: consultationFindMany,
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
          consultations.find(({ id }) => id === where.id) ?? null
        )
      },
      legalCase: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => input.cases?.[where.id] ?? null)
      }
    },
    notificationFindMany,
    consultationFindMany,
    notificationUpdate
  };
}

describe("admin notification center contract", () => {
  it("validates mutually exclusive preview and center pagination modes", () => {
    expect(adminNotificationQuerySchema.parse({})).toMatchObject({ mode: "preview", limit: 5 });
    expect(adminNotificationQuerySchema.parse({ limit: "3" })).toMatchObject({ mode: "preview", limit: 3 });
    expect(adminNotificationQuerySchema.parse({ pageSize: "25" })).toMatchObject({ mode: "center", pageSize: 25 });
    expect(() => adminNotificationQuerySchema.parse({ limit: 3, pageSize: 20 })).toThrow();
    expect(() => adminNotificationQuerySchema.parse({ limit: 3, cursor: "opaque" })).toThrow();
    expect(() => adminNotificationQuerySchema.parse({ pageSize: 51 })).toThrow();
  });

  it("computes complete-set counts and deduplicates a counterpart beyond the preview boundary", async () => {
    const consultation = review(1);
    const rows = [
      generic(1),
      generic(2),
      generic(3),
      generic(4, {
        type: "CONSULTATION",
        resourceType: CONSULTATION_NOTIFICATION_RESOURCE_TYPE,
        resourceId: consultation.id,
        actionUrl: `/admin/consultations/${consultation.id}`
      })
    ];
    const harness = notificationClient({ notifications: rows, consultations: [consultation] });

    const result = await listAdminNotifications({
      actor: notificationOwner,
      query: { limit: 2 },
      client: harness.client as never
    });

    expect(result).toMatchObject({
      genericUnreadCount: 4,
      consultationReviewCount: 1,
      attentionCount: 4
    });
    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    const [notificationQuery] = harness.notificationFindMany.mock.calls[0] as unknown as [{ select: Record<string, unknown>; take?: number }];
    const [consultationQuery] = harness.consultationFindMany.mock.calls[0] as unknown as [{ select: Record<string, unknown>; take?: number }];
    expect(notificationQuery).not.toHaveProperty("take");
    expect(consultationQuery).not.toHaveProperty("take");
    expect(Object.keys(notificationQuery.select).sort()).toEqual(
      ["actionUrl", "body", "createdAt", "id", "readAt", "resourceId", "resourceType", "title", "type"].sort()
    );
    expect(JSON.stringify(consultationQuery.select)).not.toMatch(/phone|email|summary|notes/);
  });

  it("keeps opaque cursor pagination stable across both projected sources", async () => {
    const rows = [generic(1), generic(2), generic(3), generic(4), generic(5)];
    const consultations = [review(1), review(2)];
    const harness = notificationClient({ notifications: rows, consultations });
    const seen: string[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < 5; page += 1) {
      const result = await listAdminNotifications({
        actor: notificationOwner,
        query: cursor ? { pageSize: 2, cursor } : { pageSize: 2 },
        client: harness.client as never
      });
      seen.push(...result.items.map(({ id }) => id));
      cursor = result.nextCursor;
      if (!cursor) break;
    }

    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect(cursor).toBeNull();
  });

  it("rejects unsafe stored URLs and revalidates route plus dynamic object scope", async () => {
    const caseId = "54000000-0000-4000-8000-000000000001";
    const unsafeRows = [
      generic(11, { userId: notificationOnly.id, actionUrl: "https://evil.example/admin", type: "SYSTEM" }),
      generic(12, { userId: notificationOnly.id, actionUrl: "//evil.example/admin", type: "SECURITY" }),
      generic(13, { userId: notificationOnly.id, actionUrl: "javascript:alert(1)", type: "SYSTEM" }),
      generic(14, { userId: notificationOnly.id, actionUrl: "data:text/html,bad", type: "SYSTEM" }),
      generic(15, { userId: notificationOnly.id, actionUrl: "/admin/settings", type: "SYSTEM" }),
      generic(16, {
        userId: assignedLawyer.id,
        actionUrl: `/admin/cases/${caseId}`,
        type: "CASE",
        resourceType: "LegalCase",
        resourceId: caseId
      })
    ];
    const ownerHarness = notificationClient({ notifications: unsafeRows.slice(0, 5) });
    const reassignedHarness = notificationClient({
      notifications: [unsafeRows[5]],
      cases: {
        [caseId]: {
          assignedLawyerId: "54000000-0000-4000-8000-000000000099",
          deletedAt: null,
          client: { userId: null }
        }
      }
    });

    const ownerResult = await listAdminNotifications({ actor: notificationOnly, query: { pageSize: 20 }, client: ownerHarness.client as never });
    expect(ownerResult.items.every((item) => item.kind !== "generic" || item.href === "/admin/notifications")).toBe(true);

    const reassignedResult = await listAdminNotifications({ actor: assignedLawyer, query: { pageSize: 20 }, client: reassignedHarness.client as never });
    expect(reassignedResult.items[0]).toMatchObject({ kind: "generic", href: "/admin/cases" });

    const afterPermissionRemoval = await listAdminNotifications({
      actor: { ...notificationOnly, id: assignedLawyer.id },
      query: { pageSize: 20 },
      client: reassignedHarness.client as never
    });
    expect(afterPermissionRemoval.items[0]).toMatchObject({ kind: "generic", href: "/admin/notifications" });
  });

  it("requires notification.read.self and keeps generic reads owner-only, idempotent, and separate from consultation review", async () => {
    const unread = generic(21);
    const alreadyRead = generic(22, { readAt: new Date("2026-07-22T12:30:00.000Z") });
    const harness = notificationClient({ notifications: [unread, alreadyRead] });

    await expect(
      listAdminNotifications({ actor: consultationOnly, query: {}, client: harness.client as never })
    ).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });
    await expect(
      markAdminNotificationRead({ actor: consultationOnly, notificationId: unread.id, client: harness.client as never })
    ).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });

    const first = await markAdminNotificationRead({ actor: notificationOwner, notificationId: unread.id, client: harness.client as never });
    const replay = await markAdminNotificationRead({ actor: notificationOwner, notificationId: unread.id, client: harness.client as never });
    const existing = await markAdminNotificationRead({ actor: notificationOwner, notificationId: alreadyRead.id, client: harness.client as never });

    expect(first.readAt).toBeInstanceOf(Date);
    expect(replay.id).toBe(unread.id);
    expect(existing.id).toBe(alreadyRead.id);
    expect(harness.notificationUpdate).toHaveBeenCalledOnce();
    await expect(
      markAdminNotificationRead({
        actor: { ...notificationOwner, id: "51000000-0000-4000-8000-000000000099" },
        notificationId: unread.id,
        client: harness.client as never
      })
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("creates review notifications only for active recipients who can both receive and review", async () => {
    const consultationId = "55000000-0000-4000-8000-000000000001";
    const createMany = vi.fn(async ({ data }: { data: Array<{ userId: string }> }) => ({ count: data.length }));
    const userFindMany = vi.fn(async () => [
      {
        id: "55000000-0000-4000-8000-000000000010",
        role: {
          name: "Office Admin",
          permissions: [
            { permission: { key: "consultation.review.any" } },
            { permission: { key: "notification.read.self" } }
          ]
        }
      },
      {
        id: "55000000-0000-4000-8000-000000000011",
        role: { name: "Secretary", permissions: [{ permission: { key: "consultation.review.any" } }] }
      },
      {
        id: "55000000-0000-4000-8000-000000000012",
        role: { name: "Super Admin", permissions: [] }
      }
    ]);
    const client = {
      consultationRequest: {
        findUnique: vi.fn(async () => ({
          id: consultationId,
          fullName: "عميل تجريبي",
          status: "SCHEDULED",
          secretaryReviewedAt: null,
          outcomeStatus: "PENDING"
        }))
      },
      user: { findMany: userFindMany },
      notification: { createMany }
    };

    const result = await createConsultationReviewNotifications({ consultationId, client: client as never });

    expect(result.created).toBe(2);
    const [createInput] = createMany.mock.calls[0];
    expect(createInput.data.map(({ userId }) => userId)).toEqual([
      "55000000-0000-4000-8000-000000000010",
      "55000000-0000-4000-8000-000000000012"
    ]);
    const [userQuery] = userFindMany.mock.calls[0] as unknown as [{ where: unknown; select: unknown }];
    expect(userQuery).toHaveProperty("where.status", "ACTIVE");
    expect(userQuery).toHaveProperty("where.deletedAt", null);
    expect(JSON.stringify(userQuery.select)).not.toMatch(/email|password|secret|recovery/);
  });
});
