import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";
import { appendAuditLog } from "@/server/audit/audit-service";
import { parseWithSchema } from "@/server/validation/schemas";

export const serviceKindSchema = z.enum(["CONTRACT_DRAFT", "CONTRACT_REVIEW", "HEALTH_CHECK"]);
export const intakeSchema = z.object({
  title: z.string().trim().max(180).default(""), purpose: z.string().trim().max(5000).default(""),
  language: z.enum(["ar", "en", "both"]).default("ar"), requestedDate: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).default(""),
  answers: z.record(z.string().max(60), z.enum(["YES", "NO", "UNSURE", "NOT_APPLICABLE"])).default({})
}).strict();
export const createServiceRequestSchema = z.object({ kind: serviceKindSchema, locale: z.enum(["ar", "en"]), idempotencyKey: z.string().uuid(), sourceRequestId: z.string().uuid().optional() }).strict();
const quoteSchema = z.object({ amount: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/), currency: z.enum(["EGP", "USD", "EUR", "SAR", "AED"]), scope: z.string().trim().min(10).max(6000), durationDays: z.number().int().min(1).max(365) }).strict();
export const serviceActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), revision: z.number().int().nonnegative(), intake: intakeSchema }).strict(),
  z.object({ action: z.literal("submit"), revision: z.number().int().nonnegative() }).strict(),
  z.object({ action: z.literal("accept"), revision: z.number().int().nonnegative(), quoteVersion: z.number().int().positive() }).strict(),
  z.object({ action: z.literal("quote"), revision: z.number().int().nonnegative(), quote: quoteSchema }).strict(),
  z.object({ action: z.literal("assign"), revision: z.number().int().nonnegative(), lawyerId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("message"), revision: z.number().int().nonnegative(), body: z.string().trim().min(1).max(5000), internal: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("transition"), revision: z.number().int().nonnegative(), status: z.enum(["NEEDS_INFORMATION", "READY", "COMPLETED", "CANCELLED", "IN_PROGRESS"]), body: z.string().trim().max(5000).default("") }).strict()
]);
export const questionnaireSchema = z.object({
  questions: z.array(z.object({ id: z.string().regex(/^[a-z][a-z0-9_]{1,59}$/), ar: z.string().trim().min(5).max(500), en: z.string().trim().min(5).max(500) }).strict()).min(1).max(60),
  approved: z.literal(true)
}).strict().refine(value => new Set(value.questions.map(q => q.id)).size === value.questions.length);

function denied() { return new ApiError(403, "PERMISSION_DENIED", "This action is not permitted."); }
function conflict() { return new ApiError(409, "CONFLICT", "Refresh the request before continuing."); }
function scope(actor: Principal): Prisma.ServiceRequestWhereInput {
  if (hasPermission(actor, "case.read.any")) return { client: { deletedAt: null } };
  if (hasPermission(actor, "case.read.assigned")) return { assignedLawyerId: actor.id, client: { deletedAt: null } };
  if (hasPermission(actor, "client.read.self") && actor.clientId) return { clientId: actor.clientId, client: { userId: actor.id, deletedAt: null } };
  throw denied();
}
export async function assertVerifiedServiceClient(actor: Principal) {
  if (!actor.clientId || !hasPermission(actor, "client.read.self")) throw denied();
  const client = await prisma.client.findFirst({ where: { id: actor.clientId, userId: actor.id, deletedAt: null, user: { status: "ACTIVE", deletedAt: null, emailVerifiedAt: { not: null } } } });
  if (!client) throw denied();
  return client;
}
export async function publishedQuestionnaire() {
  return prisma.healthQuestionnaire.findFirst({ where: { published: true, approvedAt: { not: null }, approvedById: { not: null } }, orderBy: { version: "desc" }, select: { id: true, version: true, questions: true } });
}
export async function publishQuestionnaire(actor: Principal, input: unknown) {
  if (!hasPermission(actor, "settings.manage.any")) throw denied();
  const body = parseWithSchema(questionnaireSchema, input);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(7265109)::text`;
    const latest = await tx.healthQuestionnaire.aggregate({ _max: { version: true } });
    await tx.healthQuestionnaire.updateMany({ where: { published: true }, data: { published: false } });
    const result = await tx.healthQuestionnaire.create({ data: { version: (latest._max.version ?? 0) + 1, questions: body.questions, published: true, approvedById: actor.id, approvedAt: new Date() } });
    await appendAuditLog({ client: tx, actorId: actor.id, action: "questionnaire.publish", resourceType: "HealthQuestionnaire", resourceId: result.id, metadata: { version: result.version } });
    return result;
  });
}
export async function createServiceRequest(actor: Principal, input: unknown) {
  const client = await assertVerifiedServiceClient(actor);
  const body = parseWithSchema(createServiceRequestSchema, input);
  const existing = await prisma.serviceRequest.findUnique({ where: { clientId_idempotencyKey: { clientId: client.id, idempotencyKey: body.idempotencyKey } } });
  if (existing) { if (existing.kind !== body.kind || existing.locale !== body.locale || existing.sourceRequestId !== (body.sourceRequestId ?? null)) throw conflict(); return existing; }
  if (body.sourceRequestId && !await prisma.serviceRequest.count({ where: { id: body.sourceRequestId, clientId: client.id, kind: "HEALTH_CHECK", status: { in: ["READY", "COMPLETED"] } } })) throw new ApiError(404, "NOT_FOUND", "Request not found.");
  const questionnaire = body.kind === "HEALTH_CHECK" ? await publishedQuestionnaire() : null;
  if (body.kind === "HEALTH_CHECK" && !questionnaire) throw new ApiError(409, "FEATURE_DISABLED", "The questionnaire is awaiting office approval.");
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "clients" WHERE "id" = ${client.id}::uuid FOR UPDATE`;
    const replay = await tx.serviceRequest.findUnique({ where: { clientId_idempotencyKey: { clientId: client.id, idempotencyKey: body.idempotencyKey } } });
    if (replay) { if (replay.kind !== body.kind || replay.locale !== body.locale || replay.sourceRequestId !== (body.sourceRequestId ?? null)) throw conflict(); return replay; }
    const result = await tx.serviceRequest.create({ data: { clientId: client.id, ...body, reference: `${body.kind === "HEALTH_CHECK" ? "HEALTH" : "CONTRACT"}-${randomUUID().replaceAll("-", "").toUpperCase()}`, intake: intakeSchema.parse({}), questionnaireId: questionnaire?.id } });
    await appendAuditLog({ client: tx, actorId: actor.id, action: "service_request.create", resourceType: "ServiceRequest", resourceId: result.id, clientId: client.id });
    return result;
  });
}
export async function listServiceRequests(actor: Principal, status?: "RECEIVED" | "AWAITING_ACCEPTANCE") {
  return prisma.serviceRequest.findMany({ where: { ...scope(actor), ...(status ? { status } : {}) }, orderBy: { updatedAt: "desc" }, take: 100,
    select: { id: true, reference: true, kind: true, status: true, updatedAt: true, revision: true, client: { select: { fullName: true } } } });
}
export async function serviceRequestQueueCounts(actor: Principal) {
  const where = scope(actor);
  const [office, client] = await Promise.all([
    prisma.serviceRequest.count({ where: { ...where, status: "RECEIVED" } }),
    prisma.serviceRequest.count({ where: { ...where, status: "AWAITING_ACCEPTANCE" } })
  ]);
  return { office, client };
}
export async function getServiceRequest(actor: Principal, id: string) {
  const clientView = actor.roleName === "Client";
  const result = await prisma.serviceRequest.findFirst({ where: { id, ...scope(actor) }, include: {
    questionnaire: { select: { version: true, questions: true } },
    documents: { where: { deletedAt: null, ...(clientView ? { visibility: "CLIENT_VISIBLE" as const } : {}) }, orderBy: { createdAt: "asc" }, select: { id: true, fileName: true, deliveryVersion: true, createdAt: true } },
    events: { where: clientView ? { internal: false } : {}, orderBy: { createdAt: "asc" }, take: 250, select: { id: true, action: true, body: true, internal: true, createdAt: true } },
    conversationThread: { select: { messages: { orderBy: { createdAt: "asc" }, take: 250, select: { id: true, body: true, createdAt: true } } } }
  } });
  if (!result) throw new ApiError(404, "NOT_FOUND", "Request not found.");
  const { conversationThread, ...record } = result;
  const messages = conversationThread?.messages.map(message => ({ ...message, action: "message", internal: false })) ?? [];
  return { ...record, events: [...record.events, ...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) };
}
export async function actOnServiceRequest(actor: Principal, id: string, input: unknown) {
  const body = parseWithSchema(serviceActionSchema, input);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "service_requests" WHERE "id" = ${id}::uuid FOR UPDATE`;
    const row = await tx.serviceRequest.findFirst({ where: { id, ...scope(actor) }, include: { questionnaire: true } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Request not found.");
    if (row.revision !== body.revision) throw conflict();
    const own = actor.roleName === "Client" && actor.clientId === row.clientId;
    const manager = hasPermission(actor, "case.update.any");
    const lawyer = row.assignedLawyerId === actor.id && hasPermission(actor, "case.update.assigned");
    const editable = ["DRAFT", "NEEDS_INFORMATION"].includes(row.status);
    if (["COMPLETED", "CANCELLED"].includes(row.status)) throw conflict();
    const data: Prisma.ServiceRequestUpdateInput = { revision: { increment: 1 } };
    let eventBody: string | null = null;
    let internal = false;
    if (body.action === "save") {
      if (!own || !editable) throw denied();
      if (row.kind === "HEALTH_CHECK") {
        const allowed = new Set((row.questionnaire?.questions as Array<{ id: string }> ?? []).map(q => q.id));
        if (Object.keys(body.intake.answers).some(key => !allowed.has(key))) throw new ApiError(400, "VALIDATION_ERROR", "Unknown question.");
      } else if (Object.keys(body.intake.answers).length) throw new ApiError(400, "VALIDATION_ERROR", "Questionnaire answers are not applicable.");
      data.intake = body.intake;
    } else if (body.action === "submit") {
      if (!own || !editable) throw denied();
      const intake = intakeSchema.parse(row.intake);
      if (intake.title.length < 3 || intake.purpose.length < 10) throw new ApiError(400, "VALIDATION_ERROR", "Complete the request description.");
      data.status = "RECEIVED";
      if (!row.conversationThreadId) {
        const thread = await tx.conversationThread.create({ data: { clientId: row.clientId, subject: row.reference, status: "WAITING_STAFF" } });
        data.conversationThread = { connect: { id: thread.id } };
      }
    } else if (body.action === "assign") {
      if (!manager) throw denied();
      const user = await tx.user.findFirst({ where: { id: body.lawyerId, status: "ACTIVE", deletedAt: null, role: { name: "Lawyer", status: "ACTIVE" } } });
      if (!user) throw new ApiError(400, "VALIDATION_ERROR", "Choose an active lawyer.");
      data.assignedLawyer = { connect: { id: user.id } };
    } else if (body.action === "quote") {
      if (!manager || !hasPermission(actor, "finance.manage.any") || !["RECEIVED", "NEEDS_INFORMATION", "AWAITING_ACCEPTANCE"].includes(row.status) || row.paymentId) throw denied();
      data.quote = body.quote; data.quoteVersion = { increment: 1 }; data.status = "AWAITING_ACCEPTANCE";
    } else if (body.action === "accept") {
      if (!own || row.status !== "AWAITING_ACCEPTANCE" || row.quoteVersion !== body.quoteVersion || row.paymentId) throw conflict();
      const quote = quoteSchema.parse(row.quote);
      const payment = await tx.payment.create({ data: { clientId: row.clientId, invoiceNumber: `SR-${randomUUID().replaceAll("-", "").toUpperCase()}`, amount: quote.amount, currency: quote.currency, issueDate: new Date(), status: new Prisma.Decimal(quote.amount).isZero() ? "PAID" : "PENDING" } });
      data.payment = { connect: { id: payment.id } }; data.acceptedQuoteVersion = row.quoteVersion; data.status = "IN_PROGRESS";
    } else if (body.action === "message") {
      if (!own && !manager && !lawyer) throw denied();
      if (body.internal && own) throw denied();
      eventBody = body.body; internal = body.internal;
      if (!internal && row.conversationThreadId) {
        await tx.conversationMessage.create({ data: { threadId: row.conversationThreadId, senderUserId: actor.id, senderType: own ? "CLIENT" : "STAFF", body: body.body } });
        await tx.conversationThread.update({ where: { id: row.conversationThreadId }, data: { lastMessageAt: new Date(), status: own ? "WAITING_STAFF" : "WAITING_CLIENT" } });
        eventBody = null;
      }
    } else {
      eventBody = body.body || null;
      if (own) {
        if (body.status === "IN_PROGRESS" && row.status === "READY" && body.body.trim().length >= 5) data.status = "IN_PROGRESS";
        else if (body.status === "COMPLETED" && row.status === "READY") data.status = "COMPLETED";
        else if (body.status === "CANCELLED" && ["DRAFT", "RECEIVED", "NEEDS_INFORMATION", "AWAITING_ACCEPTANCE"].includes(row.status)) data.status = "CANCELLED";
        else throw denied();
      } else {
        if (!manager && !lawyer) throw denied();
        const transitions: Record<string, string[]> = { RECEIVED: ["NEEDS_INFORMATION", "CANCELLED"], NEEDS_INFORMATION: ["CANCELLED"], AWAITING_ACCEPTANCE: ["NEEDS_INFORMATION", "CANCELLED"], IN_PROGRESS: ["READY", "CANCELLED"], READY: ["IN_PROGRESS", "COMPLETED", "CANCELLED"] };
        if (!transitions[row.status]?.includes(body.status)) throw conflict();
        if (body.status === "READY" && !await tx.document.count({ where: { serviceRequestId: id, deletedAt: null, deliveryVersion: { not: null }, visibility: "CLIENT_VISIBLE" } })) throw new ApiError(400, "VALIDATION_ERROR", "Upload a reviewed delivery first.");
        data.status = body.status;
      }
    }
    await tx.serviceRequest.update({ where: { id }, data });
    await tx.serviceRequestEvent.create({ data: { requestId: id, actorId: actor.id, action: body.action === "transition" ? body.status : body.action, body: eventBody, internal } });
    await appendAuditLog({ client: tx, actorId: actor.id, action: `service_request.${body.action}`, resourceType: "ServiceRequest", resourceId: id, clientId: row.clientId, metadata: { revision: row.revision + 1 } });
    return { id, revision: row.revision + 1 };
  });
}
