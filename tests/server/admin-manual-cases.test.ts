import { describe, expect, it, vi } from "vitest";
import {
  createManualCase,
  manualCaseCoreUpdateSchema,
  manualCaseCreateSchema,
  manualCaseRequestHash,
  updateManualCaseCore
} from "@/server/admin/manual-case-service";
import type { Principal } from "@/server/auth/policy";

const actor: Principal = {
  id: "71000000-0000-4000-8000-000000000001",
  roleName: "Office Admin",
  permissions: ["case.create.any", "case.update.any", "case.read.any"]
};
const assignedLawyer: Principal = {
  id: "71000000-0000-4000-8000-000000000002",
  roleName: "Lawyer",
  permissions: ["case.update.assigned", "case.read.assigned"]
};
const otherActor: Principal = {
  id: "71000000-0000-4000-8000-000000000003",
  roleName: "Office Admin",
  permissions: ["case.create.any", "case.update.any"]
};
const deniedActor: Principal = {
  id: "71000000-0000-4000-8000-000000000004",
  roleName: "Marketing Staff",
  permissions: ["content.create.any"]
};
const clientId = "72000000-0000-4000-8000-000000000001";
const requestToken = "73000000-0000-4000-8000-000000000001";
const secondRequestToken = "73000000-0000-4000-8000-000000000002";
const nextLawyerId = "71000000-0000-4000-8000-000000000005";
const now = new Date("2026-07-22T10:00:00.000Z");

const createBody = {
  requestToken,
  clientId,
  assignedLawyerId: assignedLawyer.id,
  title: "نزاع عقد توريد",
  caseType: "تجاري",
  courtName: "محكمة القاهرة الاقتصادية",
  externalCaseNumber: "2026/35",
  priority: "HIGH" as const,
  summary: "ملخص قانوني خاص لا يجوز تخزينه في بيانات التدقيق.",
  parties: [
    { name: "شركة الاختبار", partyType: "OPPOSING_PARTY" as const, notes: "بيانات خاصة بالطرف" }
  ]
};

type StoredCase = {
  id: string;
  internalFileNumber: string;
  clientId: string;
  assignedLawyerId: string;
  consultationRequestId: null;
  title: string;
  caseType: string;
  courtName: string | null;
  externalCaseNumber: string | null;
  status: "NEW";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  client: { id: string; fullName: string };
  assignedLawyer: { id: string; name: string };
  parties: Array<{ id: string; name: string; partyType: string; notes: string | null }>;
};

type AuditRow = {
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
};

function cloneCase(stored: StoredCase): StoredCase {
  return {
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
    client: { ...stored.client },
    assignedLawyer: { ...stored.assignedLawyer },
    parties: stored.parties.map((party) => ({ ...party }))
  };
}

function manualCaseHarness(options: {
  auditFails?: boolean;
  referenceCollision?: boolean;
  activeClient?: boolean;
  activeLawyer?: boolean;
} = {}) {
  const cases = new Map<string, StoredCase>();
  const audits: AuditRow[] = [];
  let updateSequence = 0;

  function delegates() {
    return {
      client: {
        findFirst: vi.fn(async ({ where }: { where: { id: string } }) =>
          options.activeClient === false || where.id !== clientId
            ? null
            : { id: clientId, fullName: "عميل نشط" }
        )
      },
      user: {
        findFirst: vi.fn(async ({ where }: { where: { id: string } }) => {
          const eligibleIds = new Set([assignedLawyer.id, nextLawyerId]);
          if (options.activeLawyer === false || !eligibleIds.has(where.id)) return null;
          return { id: where.id, name: where.id === assignedLawyer.id ? "المحامي المسؤول" : "محامٍ آخر" };
        })
      },
      legalCase: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          const stored = cases.get(where.id);
          return stored ? cloneCase(stored) : null;
        }),
        create: vi.fn(async ({ data }: { data: Record<string, any> }) => {
          if (cases.has(String(data.id))) throw uniqueError("id");
          if (options.referenceCollision) throw uniqueError("internalFileNumber");
          const parties = ((data.parties?.create ?? []) as Array<Record<string, unknown>>).map((party, index) => ({
            id: `74000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
            name: String(party.name),
            partyType: String(party.partyType),
            notes: typeof party.notes === "string" ? party.notes : null
          }));
          const stored: StoredCase = {
            id: String(data.id),
            internalFileNumber: String(data.internalFileNumber),
            clientId: String(data.clientId),
            assignedLawyerId: String(data.assignedLawyerId),
            consultationRequestId: null,
            title: String(data.title),
            caseType: String(data.caseType),
            courtName: typeof data.courtName === "string" ? data.courtName : null,
            externalCaseNumber: typeof data.externalCaseNumber === "string" ? data.externalCaseNumber : null,
            status: "NEW",
            priority: data.priority,
            summary: typeof data.summary === "string" ? data.summary : null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            client: { id: clientId, fullName: "عميل نشط" },
            assignedLawyer: { id: String(data.assignedLawyerId), name: "المحامي المسؤول" },
            parties
          };
          cases.set(stored.id, stored);
          return cloneCase(stored);
        }),
        updateMany: vi.fn(async ({ where, data }: { where: { id: string; updatedAt: Date }; data: Record<string, unknown> }) => {
          const stored = cases.get(where.id);
          if (!stored || stored.updatedAt.getTime() !== where.updatedAt.getTime()) return { count: 0 };
          updateSequence += 1;
          Object.assign(stored, data, { updatedAt: new Date(now.getTime() + updateSequence * 1000) });
          if (typeof data.assignedLawyerId === "string") {
            stored.assignedLawyer = { id: data.assignedLawyerId, name: "محامٍ آخر" };
          }
          return { count: 1 };
        })
      },
      auditLog: {
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
          audits.find((row) =>
            row.action === where.action &&
            row.resourceType === where.resourceType &&
            row.resourceId === where.resourceId &&
            row.actorId === where.actorId
          ) ?? null
        ),
        create: vi.fn(async ({ data }: { data: Record<string, any> }) => {
          if (options.auditFails) throw new Error("audit write failed");
          const row: AuditRow = {
            actorId: data.actorId ?? null,
            action: String(data.action),
            resourceType: String(data.resourceType),
            resourceId: data.resourceId ?? null,
            metadata: data.metadata ?? {}
          };
          audits.push(row);
          return row;
        })
      }
    };
  }

  const rootDelegates = delegates();
  const host = {
    ...rootDelegates,
    $transaction: vi.fn(async (operation: (client: ReturnType<typeof delegates>) => Promise<unknown>) => {
      const caseSnapshot = new Map([...cases].map(([id, stored]) => [id, cloneCase(stored)]));
      const auditCount = audits.length;
      try {
        return await operation(delegates());
      } catch (error) {
        cases.clear();
        for (const [id, stored] of caseSnapshot) cases.set(id, stored);
        audits.splice(auditCount);
        throw error;
      }
    })
  };

  return { host, cases, audits };
}

function uniqueError(target: string) {
  return Object.assign(new Error(`Unique constraint failed: ${target}`), {
    code: "P2002",
    meta: { target: [target] }
  });
}

describe("admin manual case contract", () => {
  it("uses strict canonical enums, approved edit fields, and stable payload hashing", () => {
    expect(manualCaseCreateSchema.parse(createBody).parties[0].partyType).toBe("OPPOSING_PARTY");
    expect(() => manualCaseCreateSchema.parse({ ...createBody, parties: [{ name: "طرف", partyType: "CLAIMANT" }] })).toThrow();
    expect(() => manualCaseCreateSchema.parse({ ...createBody, status: "ACTIVE" })).toThrow();
    expect(() => manualCaseCoreUpdateSchema.parse({ updatedAt: now.toISOString(), status: "CLOSED" })).toThrow();

    const normalized = {
      ...createBody,
      title: "  نزاع عقد توريد  ",
      courtName: "  ",
      summary: createBody.summary.trim()
    };
    const canonical = { ...createBody, courtName: null };
    expect(manualCaseRequestHash(normalized)).toBe(manualCaseRequestHash(canonical));
    expect(manualCaseRequestHash({ ...canonical, parties: [...canonical.parties].reverse() })).toBe(
      manualCaseRequestHash(canonical)
    );
    expect(manualCaseRequestHash({ ...canonical, parties: [...canonical.parties, { name: "شاهد", partyType: "WITNESS" }] })).not.toBe(
      manualCaseRequestHash(canonical)
    );
  });

  it("requires create permission plus an active client and eligible active lawyer", async () => {
    await expect(createManualCase({ actor: deniedActor, body: createBody, client: {} as never })).rejects.toMatchObject({
      status: 403,
      code: "PERMISSION_DENIED"
    });

    const inactiveClient = manualCaseHarness({ activeClient: false });
    await expect(createManualCase({ actor, body: createBody, client: inactiveClient.host as never, now })).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR"
    });
    const inactiveLawyer = manualCaseHarness({ activeLawyer: false });
    await expect(createManualCase({ actor, body: createBody, client: inactiveLawyer.host as never, now })).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR"
    });
  });

  it("creates case, parties, and one redacted hash-bound audit then replays only the same actor and body", async () => {
    const harness = manualCaseHarness();
    const first = await createManualCase({ actor, body: createBody, client: harness.host as never, now });
    const replay = await createManualCase({ actor, body: createBody, client: harness.host as never, now });

    expect(first).toMatchObject({ replayed: false, case: { id: requestToken, internalFileNumber: "KMT-2026-73000000", status: "NEW" } });
    expect(replay).toMatchObject({ replayed: true, case: { id: requestToken } });
    expect(harness.cases).toHaveLength(1);
    expect(harness.cases.get(requestToken)?.parties).toHaveLength(1);
    expect(harness.audits).toHaveLength(1);
    expect(harness.audits[0]).toMatchObject({
      action: "case.manual_create",
      resourceType: "LegalCase",
      resourceId: requestToken,
      actorId: actor.id,
      metadata: { requestHash: manualCaseRequestHash(createBody), source: "admin-manual", status: "NEW" }
    });
    const auditJson = JSON.stringify(harness.audits[0]);
    expect(auditJson).not.toContain("requestToken");
    expect(auditJson).not.toContain(createBody.summary);
    expect(auditJson).not.toContain(createBody.parties[0].notes);

    await expect(
      createManualCase({ actor, body: { ...createBody, title: "نزاع مختلف" }, client: harness.host as never, now })
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
    await expect(createManualCase({ actor: otherActor, body: createBody, client: harness.host as never, now })).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT"
    });
  });

  it("does not treat different request tokens as fuzzy duplicates", async () => {
    const harness = manualCaseHarness();
    await createManualCase({ actor, body: createBody, client: harness.host as never, now });
    await createManualCase({ actor, body: { ...createBody, requestToken: secondRequestToken }, client: harness.host as never, now });
    expect(harness.cases).toHaveLength(2);
    expect(harness.audits).toHaveLength(2);
  });

  it("maps file-reference collision and rolls back create when direct audit insertion fails", async () => {
    const collision = manualCaseHarness({ referenceCollision: true });
    await expect(createManualCase({ actor, body: createBody, client: collision.host as never, now })).rejects.toMatchObject({
      status: 409,
      code: "CASE_REFERENCE_CONFLICT"
    });
    expect(collision.cases).toHaveLength(0);
    expect(collision.audits).toHaveLength(0);

    const failedAudit = manualCaseHarness({ auditFails: true });
    await expect(createManualCase({ actor, body: createBody, client: failedAudit.host as never, now })).rejects.toThrow("audit write failed");
    expect(failedAudit.cases).toHaveLength(0);
    expect(failedAudit.audits).toHaveLength(0);
  });

  it("updates only approved fields with optimistic scope and a redaction-safe audit", async () => {
    const harness = manualCaseHarness();
    const created = await createManualCase({ actor, body: createBody, client: harness.host as never, now });
    const updated = await updateManualCaseCore({
      actor,
      caseId: requestToken,
      body: {
        title: "نزاع عقد توريد محدث",
        priority: "URGENT",
        summary: "ملخص معدل وسري",
        assignedLawyerId: nextLawyerId,
        updatedAt: created.case.updatedAt
      },
      client: harness.host as never
    });

    expect(updated).toMatchObject({ title: "نزاع عقد توريد محدث", priority: "URGENT", assignedLawyerId: nextLawyerId });
    expect(harness.audits).toHaveLength(2);
    expect(harness.audits[1]).toMatchObject({
      action: "case.core_update",
      resourceId: requestToken,
      metadata: {
        changedFields: ["title", "priority", "summary", "assignedLawyerId"],
        previousAssignedLawyerId: assignedLawyer.id,
        assignedLawyerId: nextLawyerId,
        previousPriority: "HIGH",
        priority: "URGENT"
      }
    });
    expect(JSON.stringify(harness.audits[1])).not.toContain("ملخص معدل وسري");
  });

  it("lets the assigned lawyer edit core data but never transfer, and rejects stale versions", async () => {
    const harness = manualCaseHarness();
    const created = await createManualCase({ actor, body: createBody, client: harness.host as never, now });
    const scoped = await updateManualCaseCore({
      actor: assignedLawyer,
      caseId: requestToken,
      body: { courtName: "محكمة أخرى", updatedAt: created.case.updatedAt },
      client: harness.host as never
    });
    expect(scoped.courtName).toBe("محكمة أخرى");

    await expect(
      updateManualCaseCore({
        actor: assignedLawyer,
        caseId: requestToken,
        body: { assignedLawyerId: nextLawyerId, updatedAt: scoped.updatedAt },
        client: harness.host as never
      })
    ).rejects.toMatchObject({ status: 403, code: "PERMISSION_DENIED" });
    await expect(
      updateManualCaseCore({
        actor,
        caseId: requestToken,
        body: { title: "نسخة قديمة", updatedAt: created.case.updatedAt },
        client: harness.host as never
      })
    ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });
  });

  it("rolls back an optimistic edit when the direct audit insertion fails", async () => {
    const harness = manualCaseHarness();
    const created = await createManualCase({ actor, body: createBody, client: harness.host as never, now });
    const originalTitle = created.case.title;
    const failingHarness = manualCaseHarness({ auditFails: true });
    failingHarness.cases.set(requestToken, cloneCase(harness.cases.get(requestToken)!));

    await expect(
      updateManualCaseCore({
        actor,
        caseId: requestToken,
        body: { title: "تعديل يجب التراجع عنه", updatedAt: created.case.updatedAt },
        client: failingHarness.host as never
      })
    ).rejects.toThrow("audit write failed");
    expect(failingHarness.cases.get(requestToken)?.title).toBe(originalTitle);
    expect(failingHarness.audits).toHaveLength(0);
  });
});
