import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { plan35ApiErrorSourceMessages } from "@/lib/ui-copy";
import { appendAuditLog } from "@/server/audit/audit-service";
import { PLAN35_AUDIT_ACTIONS } from "@/server/audit/audit-event-catalog";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { canUpdateAdminCase } from "./case-operations-service";
import { legalCaseReference } from "./legal-case-reference";

const casePrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
const partyTypeSchema = z.enum(["CLIENT", "OPPOSING_PARTY", "WITNESS", "EXPERT", "OTHER"]);
const nullableShortText = nullableTrimmedText(240);
const nullableSummary = nullableTrimmedText(5_000);

const manualCasePartySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    partyType: partyTypeSchema,
    notes: nullableTrimmedText(1_000)
  })
  .strict();

export const manualCaseCreateSchema = z
  .object({
    requestToken: uuidSchema,
    clientId: uuidSchema,
    assignedLawyerId: uuidSchema,
    title: z.string().trim().min(3).max(180),
    caseType: z.string().trim().min(2).max(120),
    courtName: nullableShortText,
    externalCaseNumber: nullableShortText,
    priority: casePrioritySchema.default("NORMAL"),
    summary: nullableSummary,
    parties: z.array(manualCasePartySchema).max(20).default([])
  })
  .strict();

const manualCaseCoreFieldsSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  caseType: z.string().trim().min(2).max(120).optional(),
  courtName: optionalNullableTrimmedText(240),
  externalCaseNumber: optionalNullableTrimmedText(240),
  priority: casePrioritySchema.optional(),
  summary: optionalNullableTrimmedText(5_000),
  assignedLawyerId: uuidSchema.optional(),
  updatedAt: z.string().datetime()
});

export const manualCaseCoreUpdateSchema = manualCaseCoreFieldsSchema
  .strict()
  .refine(
    (body) => Object.keys(body).some((key) => key !== "updatedAt"),
    { message: "At least one editable case field is required." }
  );

export type ManualCaseCreateInput = z.infer<typeof manualCaseCreateSchema>;
export type ManualCaseCoreUpdateInput = z.infer<typeof manualCaseCoreUpdateSchema>;

const manualCaseSelect = Prisma.validator<Prisma.LegalCaseSelect>()({
  id: true,
  internalFileNumber: true,
  clientId: true,
  assignedLawyerId: true,
  consultationRequestId: true,
  title: true,
  caseType: true,
  courtName: true,
  externalCaseNumber: true,
  status: true,
  priority: true,
  summary: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  client: { select: { id: true, fullName: true } },
  assignedLawyer: { select: { id: true, name: true } },
  parties: {
    select: { id: true, name: true, partyType: true, notes: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }]
  }
});

type ManualCaseRow = Prisma.LegalCaseGetPayload<{ select: typeof manualCaseSelect }>;
type ManualCaseReadClient = Pick<Prisma.TransactionClient, "legalCase" | "auditLog">;
type ManualCaseReferenceClient = Pick<Prisma.TransactionClient, "client" | "user">;
type ManualCaseMutationClient = ManualCaseReadClient & ManualCaseReferenceClient;
type ManualCaseTransactionHost = ManualCaseReadClient &
  ManualCaseReferenceClient & {
    $transaction<T>(operation: (client: ManualCaseMutationClient) => Promise<T>): Promise<T>;
  };

const editableCoreFields = [
  "title",
  "caseType",
  "courtName",
  "externalCaseNumber",
  "priority",
  "summary",
  "assignedLawyerId"
] as const satisfies ReadonlyArray<keyof ManualCaseCoreUpdateInput>;
type EditableCoreField = (typeof editableCoreFields)[number];

function nullableTrimmedText(maxLength: number) {
  return z.preprocess(
    (value) => normalizedNullableText(value),
    z.string().max(maxLength).nullable()
  );
}

function optionalNullableTrimmedText(maxLength: number) {
  return z.preprocess(
    (value) => value === undefined ? undefined : normalizedNullableText(value),
    z.string().max(maxLength).nullable().optional()
  );
}

function normalizedNullableText(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  return value.trim() || null;
}

function normalizedCreatePayload(body: ManualCaseCreateInput) {
  return {
    requestToken: body.requestToken,
    clientId: body.clientId,
    assignedLawyerId: body.assignedLawyerId,
    title: body.title,
    caseType: body.caseType,
    courtName: body.courtName,
    externalCaseNumber: body.externalCaseNumber,
    priority: body.priority,
    summary: body.summary,
    parties: body.parties.map((party) => ({
      name: party.name,
      partyType: party.partyType,
      notes: party.notes
    }))
  };
}

export function manualCaseRequestHash(input: unknown) {
  const body = manualCaseCreateSchema.parse(input);
  return createHash("sha256").update(JSON.stringify(normalizedCreatePayload(body))).digest("hex");
}

function toManualCaseDto(legalCase: ManualCaseRow) {
  const { deletedAt: _deletedAt, ...safeCase } = legalCase;
  return {
    ...safeCase,
    createdAt: legalCase.createdAt.toISOString(),
    updatedAt: legalCase.updatedAt.toISOString()
  };
}

export function canCreateManualCase(actor: Principal) {
  return hasPermission(actor, "case.create.any");
}

function assertManualCaseCreatePermission(actor: Principal) {
  if (!canCreateManualCase(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Manual case creation permission is required.");
  }
}

function assertManualCaseUpdatePermission(actor: Principal) {
  if (!hasPermission(actor, "case.update.any") && !hasPermission(actor, "case.update.assigned")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case update permission is required.");
  }
}

async function activeClient(client: ManualCaseReferenceClient, clientId: string) {
  const existingClient = await client.client.findFirst({
    where: { id: clientId, status: "ACTIVE", deletedAt: null },
    select: { id: true, fullName: true }
  });
  if (!existingClient) {
    throw new ApiError(400, "VALIDATION_ERROR", "An active existing client is required.");
  }
  return existingClient;
}

async function eligibleLawyer(client: ManualCaseReferenceClient, lawyerId: string) {
  const lawyer = await client.user.findFirst({
    where: {
      id: lawyerId,
      status: "ACTIVE",
      deletedAt: null,
      role: { name: "Lawyer", status: "ACTIVE" }
    },
    select: { id: true, name: true }
  });
  if (!lawyer) {
    throw new ApiError(400, "VALIDATION_ERROR", "An active eligible lawyer is required.");
  }
  return lawyer;
}

function auditRequestHash(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const requestHash = (metadata as Record<string, unknown>).requestHash;
  return typeof requestHash === "string" ? requestHash : null;
}

async function replayForExistingCase(input: {
  client: ManualCaseReadClient;
  actorId: string;
  caseId: string;
  requestHash: string;
}) {
  const legalCase = await input.client.legalCase.findUnique({
    where: { id: input.caseId },
    select: manualCaseSelect
  });
  if (!legalCase) return null;
  const audit = await input.client.auditLog.findFirst({
    where: {
      action: PLAN35_AUDIT_ACTIONS.manualCaseCreate,
      resourceType: "LegalCase",
      resourceId: input.caseId,
      actorId: input.actorId
    },
    select: { metadata: true }
  });
  if (legalCase.deletedAt === null && auditRequestHash(audit?.metadata) === input.requestHash) {
    return { case: toManualCaseDto(legalCase), replayed: true as const };
  }
  throw new ApiError(409, "CONFLICT", "The request token is already bound to another case request.");
}

async function createManualCaseTransaction(input: {
  client: ManualCaseMutationClient;
  actor: Principal;
  body: ManualCaseCreateInput;
  requestHash: string;
  now: Date;
  request?: Request;
  requestId?: string;
}) {
  await Promise.all([
    activeClient(input.client, input.body.clientId),
    eligibleLawyer(input.client, input.body.assignedLawyerId)
  ]);
  const replay = await replayForExistingCase({
    client: input.client,
    actorId: input.actor.id,
    caseId: input.body.requestToken,
    requestHash: input.requestHash
  });
  if (replay) return replay;

  const legalCase = await input.client.legalCase.create({
    data: {
      id: input.body.requestToken,
      internalFileNumber: legalCaseReference(input.body.requestToken, input.now),
      clientId: input.body.clientId,
      assignedLawyerId: input.body.assignedLawyerId,
      title: input.body.title,
      caseType: input.body.caseType,
      courtName: input.body.courtName,
      externalCaseNumber: input.body.externalCaseNumber,
      status: "NEW",
      priority: input.body.priority,
      summary: input.body.summary,
      parties: input.body.parties.length ? { create: input.body.parties } : undefined
    },
    select: manualCaseSelect
  });
  await appendManualCaseCreateAudit({ ...input, legalCase });
  return { case: toManualCaseDto(legalCase), replayed: false as const };
}

async function appendManualCaseCreateAudit(input: {
  client: ManualCaseMutationClient;
  actor: Principal;
  legalCase: ManualCaseRow;
  requestHash: string;
  request?: Request;
  requestId?: string;
}) {
  await appendAuditLog({
    client: input.client,
    actorId: input.actor.id,
    action: PLAN35_AUDIT_ACTIONS.manualCaseCreate,
    resourceType: "LegalCase",
    resourceId: input.legalCase.id,
    clientId: input.legalCase.clientId,
    caseId: input.legalCase.id,
    lawyerId: input.legalCase.assignedLawyerId,
    metadata: { requestHash: input.requestHash, source: "admin-manual", status: "NEW" },
    request: input.request,
    requestId: input.requestId
  });
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function caseReferenceConflict() {
  return new ApiError(
    409,
    "CASE_REFERENCE_CONFLICT",
    plan35ApiErrorSourceMessages.CASE_REFERENCE_CONFLICT
  );
}

export async function createManualCase(input: {
  actor: Principal;
  body: unknown;
  request?: Request;
  requestId?: string;
  now?: Date;
  client?: ManualCaseTransactionHost;
}) {
  assertManualCaseCreatePermission(input.actor);
  const body = parseWithSchema(manualCaseCreateSchema, input.body, "Manual case payload is invalid.");
  const requestHash = manualCaseRequestHash(body);
  const transactionHost = input.client ?? (prisma as unknown as ManualCaseTransactionHost);

  try {
    return await transactionHost.$transaction((client) =>
      createManualCaseTransaction({
        client,
        actor: input.actor,
        body,
        requestHash,
        now: input.now ?? new Date(),
        request: input.request,
        requestId: input.requestId
      })
    );
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const replay = await replayForExistingCase({
      client: transactionHost,
      actorId: input.actor.id,
      caseId: body.requestToken,
      requestHash
    });
    if (replay) return replay;
    throw caseReferenceConflict();
  }
}

function changedCoreFields(existing: ManualCaseRow, body: ManualCaseCoreUpdateInput) {
  return editableCoreFields.filter((field) =>
    body[field] !== undefined && body[field] !== existing[field]
  );
}

function updateMutationData(body: ManualCaseCoreUpdateInput, changedFields: readonly EditableCoreField[]) {
  const update: Prisma.LegalCaseUncheckedUpdateManyInput = {};
  for (const field of changedFields) {
    const value = body[field];
    if (value !== undefined) Object.assign(update, { [field]: value });
  }
  return update;
}

async function appendCaseCoreUpdateAudit(input: {
  client: ManualCaseMutationClient;
  actor: Principal;
  previous: ManualCaseRow;
  updated: ManualCaseRow;
  changedFields: readonly string[];
  request?: Request;
  requestId?: string;
}) {
  await appendAuditLog({
    client: input.client,
    actorId: input.actor.id,
    action: PLAN35_AUDIT_ACTIONS.caseCoreUpdate,
    resourceType: "LegalCase",
    resourceId: input.updated.id,
    clientId: input.updated.clientId,
    caseId: input.updated.id,
    lawyerId: input.updated.assignedLawyerId,
    metadata: {
      changedFields: input.changedFields,
      previousAssignedLawyerId: input.previous.assignedLawyerId,
      assignedLawyerId: input.updated.assignedLawyerId,
      previousPriority: input.previous.priority,
      priority: input.updated.priority
    },
    request: input.request,
    requestId: input.requestId
  });
}

async function updateManualCaseTransaction(input: {
  client: ManualCaseMutationClient;
  actor: Principal;
  caseId: string;
  body: ManualCaseCoreUpdateInput;
  request?: Request;
  requestId?: string;
}) {
  const existing = await input.client.legalCase.findUnique({
    where: { id: input.caseId },
    select: manualCaseSelect
  });
  if (
    !existing ||
    existing.deletedAt !== null ||
    !canUpdateAdminCase(input.actor, { assignedLawyerId: existing.assignedLawyerId })
  ) {
    throw new ApiError(404, "NOT_FOUND", "Case was not found in the current access scope.");
  }

  const changedFields = changedCoreFields(existing, input.body);
  const assignmentChanges = changedFields.includes("assignedLawyerId");
  if (assignmentChanges && !hasPermission(input.actor, "case.update.any")) {
    throw new ApiError(403, "PERMISSION_DENIED", "Case reassignment requires office-wide update permission.");
  }
  if (assignmentChanges) {
    await eligibleLawyer(input.client, input.body.assignedLawyerId!);
  }
  if (existing.updatedAt.getTime() !== new Date(input.body.updatedAt).getTime()) {
    throw new ApiError(409, "CONFLICT", "Case data changed after this form was loaded.");
  }
  if (!changedFields.length) return toManualCaseDto(existing);

  const claim = await input.client.legalCase.updateMany({
    where: { id: input.caseId, updatedAt: existing.updatedAt, deletedAt: null },
    data: updateMutationData(input.body, changedFields)
  });
  if (claim.count !== 1) {
    throw new ApiError(409, "CONFLICT", "Case data changed after this form was loaded.");
  }
  const updated = await input.client.legalCase.findUnique({
    where: { id: input.caseId },
    select: manualCaseSelect
  });
  if (!updated) throw new ApiError(404, "NOT_FOUND", "Case was not found.");
  await appendCaseCoreUpdateAudit({ ...input, previous: existing, updated, changedFields });
  return toManualCaseDto(updated);
}

export async function updateManualCaseCore(input: {
  actor: Principal;
  caseId: string;
  body: unknown;
  request?: Request;
  requestId?: string;
  client?: ManualCaseTransactionHost;
}) {
  assertManualCaseUpdatePermission(input.actor);
  const caseId = parseWithSchema(uuidSchema, input.caseId, "Case id is invalid.");
  const body = parseWithSchema(manualCaseCoreUpdateSchema, input.body, "Case core update payload is invalid.");
  const transactionHost = input.client ?? (prisma as unknown as ManualCaseTransactionHost);
  return transactionHost.$transaction((client) =>
    updateManualCaseTransaction({
      client,
      actor: input.actor,
      caseId,
      body,
      request: input.request,
      requestId: input.requestId
    })
  );
}

export async function getManualCaseFormOptions(input: {
  actor: Principal;
  client?: ManualCaseReferenceClient;
}) {
  assertManualCaseCreatePermission(input.actor);
  const client = input.client ?? prisma;
  const [clients, lawyers] = await Promise.all([
    client.client.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { id: true, fullName: true, phone: true },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      take: 100
    }),
    client.user.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        role: { name: "Lawyer", status: "ACTIVE" }
      },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: 100
    })
  ]);
  return { clients, lawyers };
}
