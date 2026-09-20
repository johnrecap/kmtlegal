import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/server/http/errors";

const databaseMocks = vi.hoisted(() => ({
  clientCreate: vi.fn(async (args: { data: Record<string, unknown> }) => ({
    id: "c1000000-0000-4000-8000-000000000001",
    ...args.data,
    assignedLawyer: null
  })),
  userFindFirst: vi.fn(async () => null)
}));

const auditMocks = vi.hoisted(() => ({
  appendAuditLogBestEffort: vi.fn(async () => undefined)
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    client: { create: databaseMocks.clientCreate },
    user: { findFirst: databaseMocks.userFindFirst }
  }
}));

vi.mock("@/server/audit/audit-service", () => ({
  appendAuditLogBestEffort: auditMocks.appendAuditLogBestEffort
}));

import { adminClientWriteSchema, createAdminClient } from "@/server/admin/client-crm-service";
import { PLAN35_PRINCIPALS } from "../fixtures/plan35-role-fixtures";

const validBody = {
  fullName: "Synthetic Launch Client",
  phone: "+201012345678",
  email: "",
  city: "Cairo",
  source: "manual",
  status: "LEAD",
  assignedLawyerId: ""
};

async function createError(input: { actor: unknown; body: unknown }) {
  try {
    await createAdminClient(input as never);
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("createAdminClient did not throw");
}

describe("admin client creation contract (TASK 01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets Office Admin create a client with normalized data and audit", async () => {
    const client = await createAdminClient({ actor: PLAN35_PRINCIPALS.officeAdmin, body: validBody });

    expect(databaseMocks.clientCreate).toHaveBeenCalledTimes(1);
    const data = databaseMocks.clientCreate.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.fullName).toBe("Synthetic Launch Client");
    expect(data.phoneCanonical).toBe("201012345678");
    expect(data.email).toBeNull();
    expect(data.source).toBe("manual");
    expect(data.assignedLawyerId).toBeNull();
    expect(auditMocks.appendAuditLogBestEffort).toHaveBeenCalledTimes(1);
    const auditCalls = auditMocks.appendAuditLogBestEffort.mock.calls as unknown[][];
    expect(auditCalls[0][0]).toMatchObject({
      action: "client.create",
      resourceType: "Client",
      resourceId: client.id,
      clientId: client.id
    });
  });

  it("lets Secretary create a client (existing business rule preserved)", async () => {
    await createAdminClient({ actor: PLAN35_PRINCIPALS.secretary, body: validBody });
    expect(databaseMocks.clientCreate).toHaveBeenCalledTimes(1);
  });

  it("rejects Lawyer with 403 without touching the database", async () => {
    const error = await createError({ actor: PLAN35_PRINCIPALS.lawyer, body: validBody });
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
    expect(error.code).toBe("PERMISSION_DENIED");
    expect(databaseMocks.clientCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid input without touching the database", async () => {
    const shortName = await createError({
      actor: PLAN35_PRINCIPALS.officeAdmin,
      body: { ...validBody, fullName: "A" }
    });
    expect(shortName.status).toBe(400);
    expect(databaseMocks.clientCreate).not.toHaveBeenCalled();

    const shortPhone = await createError({
      actor: PLAN35_PRINCIPALS.officeAdmin,
      body: { ...validBody, phone: "123" }
    });
    expect(shortPhone.status).toBe(400);
    expect(databaseMocks.clientCreate).not.toHaveBeenCalled();
  });

  it("rejects an unknown assigned lawyer without creating", async () => {
    const error = await createError({
      actor: PLAN35_PRINCIPALS.officeAdmin,
      body: { ...validBody, assignedLawyerId: "d2000000-0000-4000-8000-000000000002" }
    });
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(databaseMocks.clientCreate).not.toHaveBeenCalled();
  });

  it("keeps the shared write schema strict (no invented required fields)", () => {
    const parsed = adminClientWriteSchema.parse({ fullName: "Name Only", phone: "+201099988877" });
    expect(parsed.status).toBe("LEAD");
    expect(parsed.email).toBeUndefined();
  });
});
