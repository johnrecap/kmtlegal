import { Prisma } from "@prisma/client";
import { clientAssistantCopy } from "@/content/client-assistant-copy";
import { serviceRequestCopy } from "@/content/service-request-copy";
import { getClientContent } from "@/content/client-content";
import { canUseClientConversations } from "@/server/conversations/conversation-service";
import { formatDateTime } from "@/lib/legal-format";
import type { Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { assertActiveServiceClient, serviceRequestWhere } from "@/server/services/service-request-service";
import { ownConsultationRequestWhere } from "./client-requests-service";
import { clientVisibleDocumentWhere, getPortalDueBalances, ownCaseWhere, ownClientWhere, ownVisiblePortalAppointmentWhere, portalVisiblePaymentWhere } from "./client-portal-service";
import { invoiceBalance } from "@/server/payments/payment-ledger-service";
import type { Category, ClientRecord, ClientRecordPage, RecordCursor, RecordKind, RecordRef } from "./client-assistant-contract";

type Locale = "ar" | "en";
const bounded = (value: string | null | undefined, max = 1000) => (value ?? "").length > max ? `${value!.slice(0, max)}…` : value ?? "";
const label = (labels: Record<string, string>, key: string) => labels[key] ?? key;
// Keyset paging shares one ordering across the two request sources. Never fetch the account wholesale.
function after(cursor: RecordCursor | undefined, kind: RecordKind) {
  if (!cursor) return {};
  const at = new Date(cursor.at);
  return { OR: [{ updatedAt: { lt: at } }, { updatedAt: at, id: { gt: cursor.id } },
    ...(kind > cursor.kind ? [{ updatedAt: at, id: cursor.id }] : [])] };
}
const order = [{ updatedAt: "desc" as const }, { id: "asc" as const }];
function page(records: ClientRecord[]): ClientRecordPage {
  records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
  const shown = records.slice(0, 5), last = shown.at(-1);
  return { records: shown, hasMore: records.length > 5, ...(last && records.length > 5 ? { cursor: { at: last.updatedAt, id: last.id, kind: last.kind } } : {}) };
}

/** Explicit client-facing projections only. This service never returns ORM rows or intake JSON. */
export async function listClientAssistantRecords(actor: Principal, category: Category, locale: Locale, cursor?: RecordCursor, ref?: RecordRef): Promise<ClientRecordPage> {
  await assertActiveServiceClient(actor);
  const c = clientAssistantCopy[locale], s = serviceRequestCopy[locale], labels = getClientContent(locale).statuses;
  const records: ClientRecord[] = [];
  const include = (kind: RecordKind) => (!ref || ref.kind === kind) && (category === kind || (category === "REQUESTS" && ["CONSULTATION", "SERVICE_REQUEST"].includes(kind)));
  const id = ref ? { id: ref.id } : {};
  if (include("CONSULTATION")) {
    const rows = await prisma.consultationRequest.findMany({ where: { AND: [ownConsultationRequestWhere(actor), after(cursor, "CONSULTATION"), id] }, orderBy: order, take: 6,
      select: { id: true, publicReference: true, status: true, outcomeStatus: true, serviceCategory: true, updatedAt: true, requestedStartsAt: true,
        appointments: { where: { status: { in: ["SCHEDULED", "RESCHEDULED"] } }, take: 1, orderBy: { startsAt: "asc" }, select: { startsAt: true } } } });
    for (const row of rows) {
      const status = row.outcomeStatus === "CANCELLED" ? "CANCELLED" : row.status;
      records.push({ kind: "CONSULTATION", id: row.id, reference: row.publicReference ?? `CONS-${row.id.slice(0, 8).toUpperCase()}`, title: `${c.kinds.CONSULTATION} — ${bounded(row.serviceCategory, 180)}`, status: label(c.consultation, status), updatedAt: row.updatedAt.toISOString(), facts: [
        ...(row.appointments[0] ? [{ label: c.appointment, value: formatDateTime(row.appointments[0].startsAt, locale) }] : row.requestedStartsAt ? [{ label: c.requested, value: formatDateTime(row.requestedStartsAt, locale) }] : []),
        ...(row.outcomeStatus !== "PENDING" ? [{ label: c.outcome, value: c.outcomes[row.outcomeStatus] }] : [])
      ] });
    }
  }
  if (include("SERVICE_REQUEST")) {
    const rows = await prisma.serviceRequest.findMany({ where: { AND: [serviceRequestWhere(actor), after(cursor, "SERVICE_REQUEST"), id] }, orderBy: order, take: 6,
      select: { id: true, reference: true, kind: true, status: true, updatedAt: true } });
    for (const row of rows) records.push({ kind: "SERVICE_REQUEST", id: row.id, reference: row.reference, title: label(s.kinds, row.kind), status: label(s.statuses, row.status), updatedAt: row.updatedAt.toISOString(), facts: [{ label: c.step, value: label(c.serviceSteps, row.status) }] });
  }
  if (include("CASE")) {
    const rows = await prisma.legalCase.findMany({ where: { AND: [ownCaseWhere(actor), after(cursor, "CASE"), id] }, orderBy: order, take: 6,
      select: { id: true, internalFileNumber: true, title: true, status: true, updatedAt: true, nextSessionAt: true, courtName: true } });
    for (const row of rows) records.push({ kind: "CASE", id: row.id, reference: row.internalFileNumber, title: bounded(row.title, 180), status: label(labels.case, row.status), updatedAt: row.updatedAt.toISOString(), facts: [
      ...(row.nextSessionAt ? [{ label: c.nextSession, value: formatDateTime(row.nextSessionAt, locale) }] : []), ...(row.courtName ? [{ label: c.court, value: bounded(row.courtName) }] : [])
    ] });
  }
  if (include("APPOINTMENT")) {
    const rows = await prisma.appointment.findMany({ where: { AND: [ownVisiblePortalAppointmentWhere(actor), after(cursor, "APPOINTMENT"), id] }, orderBy: order, take: 6,
      select: { id: true, title: true, status: true, mode: true, startsAt: true, endsAt: true, location: true, updatedAt: true } });
    for (const row of rows) records.push({ kind: "APPOINTMENT", id: row.id, reference: row.id, title: bounded(row.title, 180), status: label(labels.appointment, row.status), updatedAt: row.updatedAt.toISOString(), facts: [
      { label: c.date, value: `${formatDateTime(row.startsAt, locale)} – ${formatDateTime(row.endsAt, locale)} (${label(labels.mode, row.mode)})${row.location ? ` — ${bounded(row.location)}` : ""}` }
    ] });
  }
  if (include("HEARING")) {
    const rows = await prisma.caseSession.findMany({ where: { AND: [{ case: ownCaseWhere(actor) }, after(cursor, "HEARING"), id] }, orderBy: order, take: 6,
      select: { id: true, sessionDate: true, courtName: true, decision: true, nextAction: true, nextSessionDate: true, updatedAt: true, case: { select: { internalFileNumber: true, title: true } } } });
    for (const row of rows) records.push({ kind: "HEARING", id: row.id, reference: row.id, title: `${c.kinds.HEARING} — ${bounded(row.case.title, 120)} (${row.case.internalFileNumber})`, status: "", updatedAt: row.updatedAt.toISOString(), facts: [
      { label: c.date, value: formatDateTime(row.sessionDate, locale) }, ...(row.courtName ? [{ label: c.court, value: bounded(row.courtName) }] : []), ...(row.decision ? [{ label: c.decision, value: bounded(row.decision) }] : []), ...(row.nextAction ? [{ label: c.step, value: bounded(row.nextAction) }] : []), ...(row.nextSessionDate ? [{ label: c.nextSession, value: formatDateTime(row.nextSessionDate, locale) }] : [])
    ] });
  }
  if (include("DOCUMENT")) {
    const rows = await prisma.document.findMany({ where: { AND: [clientVisibleDocumentWhere(actor.clientId!), after(cursor, "DOCUMENT"), id] }, orderBy: order, take: 6,
      select: { id: true, fileName: true, status: true, updatedAt: true } });
    for (const row of rows) records.push({ kind: "DOCUMENT", id: row.id, reference: row.id, title: bounded(row.fileName, 180), status: label(labels.document, row.status), updatedAt: row.updatedAt.toISOString(), facts: [] });
  }
  if (include("PAYMENT")) {
    const rows = await prisma.payment.findMany({ where: { AND: [portalVisiblePaymentWhere(actor.clientId!), after(cursor, "PAYMENT"), id] }, orderBy: order, take: 6,
      select: { id: true, invoiceNumber: true, amount: true, currency: true, status: true, dueDate: true, ledgerReviewRequired: true, updatedAt: true } });
    for (const row of rows) {
      const paid = await prisma.paymentEntry.aggregate({ where: { paymentId: row.id }, _sum: { amount: true } });
      const balance = invoiceBalance(row, [{ amount: paid._sum.amount ?? new Prisma.Decimal(0) }]);
      records.push({ kind: "PAYMENT", id: row.id, reference: row.invoiceNumber, title: c.kinds.PAYMENT, status: label(labels.payment, row.status), updatedAt: row.updatedAt.toISOString(), facts: [
        { label: c.total, value: `${balance.total.toString()} ${row.currency}` },
        ...(balance.reviewRequired ? [{ label: c.remaining, value: c.review }] : [{ label: c.paid, value: `${balance.paid.toString()} ${row.currency}` }, { label: c.remaining, value: `${balance.remaining.toString()} ${row.currency}` }]),
        ...(row.dueDate ? [{ label: c.date, value: formatDateTime(row.dueDate, locale) }] : [])
      ] });
    }
  }
  if (include("CONVERSATION")) {
    if (!canUseClientConversations(actor)) throw new ApiError(403, "PERMISSION_DENIED", "Conversation access required.");
    const rows = await prisma.conversationThread.findMany({ where: { AND: [{ clientId: actor.clientId! }, after(cursor, "CONVERSATION"), id] }, orderBy: order, take: 6,
      select: { id: true, subject: true, status: true, updatedAt: true, messages: { where: { senderType: "STAFF" }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } } } });
    for (const row of rows) records.push({ kind: "CONVERSATION", id: row.id, reference: row.id, title: bounded(row.subject ?? c.kinds.CONVERSATION, 180), status: label(labels.conversation, row.status), updatedAt: row.updatedAt.toISOString(), facts: row.messages.map(m => ({ label: c.officeReply, value: `${formatDateTime(m.createdAt, locale)} — ${bounded(m.body)}` })) });
  }
  if (include("PROFILE")) {
    const row = await prisma.client.findFirst({ where: { ...ownClientWhere(actor), ...id }, select: { id: true, fullName: true, phone: true, email: true, city: true, updatedAt: true, user: { select: { email: true } } } });
    if (row) records.push({ kind: "PROFILE", id: row.id, reference: row.id, title: c.kinds.PROFILE, status: "", updatedAt: row.updatedAt.toISOString(), facts: [
      { label: c.name, value: bounded(row.fullName) }, { label: c.phone, value: bounded(row.phone) }, { label: c.email, value: bounded(row.user?.email ?? row.email) }, { label: c.city, value: bounded(row.city) }
    ] });
  }
  return page(records);
}

export async function getClientAssistantRecord(actor: Principal, ref: RecordRef, locale: Locale): Promise<ClientRecord> {
  const result = await listClientAssistantRecords(actor, ref.kind, locale, undefined, ref);
  const record = result.records[0];
  if (!record) throw new ApiError(404, "NOT_FOUND", "Record not found.");
  const c = clientAssistantCopy[locale];
  if (ref.kind === "SERVICE_REQUEST") {
    const row = await prisma.serviceRequest.findFirstOrThrow({ where: { AND: [serviceRequestWhere(actor), { id: ref.id }] }, select: {
      status: true, quote: true, conversationThreadId: true,
      events: { where: { internal: false, actor: { role: { name: { not: "Client" } } }, body: { not: null } }, orderBy: { createdAt: "desc" }, take: 5, select: { action: true, body: true, createdAt: true } },
      documents: { where: { deletedAt: null, visibility: "CLIENT_VISIBLE" }, take: 6, orderBy: { createdAt: "desc" }, select: { fileName: true, status: true } }
    } });
    if (row.status === "NEEDS_INFORMATION") {
      const missing = row.events.find(e => e.action === "NEEDS_INFORMATION");
      if (missing?.body) record.facts.push({ label: c.missing, value: bounded(missing.body) });
    }
    const quote = zQuote(row.quote);
    if (quote && row.status === "AWAITING_ACCEPTANCE") record.facts.push({ label: c.quote, value: `${c.amount}: ${quote.amount} ${quote.currency}; ${c.duration}: ${quote.durationDays}; ${c.scope}: ${bounded(quote.scope)}` });
    if (row.documents.length) record.facts.push({ label: c.files, value: row.documents.slice(0, 5).map(d => `${bounded(d.fileName, 180)} (${label(getClientContent(locale).statuses.document, d.status)})`).join("\n") + (row.documents.length > 5 ? `\n${c.shortened}` : "") });
    const message = row.conversationThreadId ? await prisma.conversationMessage.findFirst({ where: { threadId: row.conversationThreadId, thread: { clientId: actor.clientId! }, senderType: "STAFF" }, orderBy: { createdAt: "desc" }, select: { body: true, createdAt: true } }) : null;
    const event = row.events[0];
    const reply = message && (!event || message.createdAt >= event.createdAt) ? message : event;
    if (reply?.body) record.facts.push({ label: c.officeReply, value: `${formatDateTime(reply.createdAt, locale)} — ${bounded(reply.body)}` });
  }
  if (ref.kind === "CASE") {
    const row = await prisma.legalCase.findFirstOrThrow({ where: ownCaseWhere(actor, ref.id), select: { caseType: true, summary: true, createdAt: true, assignedLawyer: { select: { name: true, email: true } } } });
    const copy = getClientContent(locale);
    record.facts.push({ label: copy.common.category, value: bounded(row.caseType) }, { label: copy.cases.detailsResponsibleLawyer, value: bounded(row.assignedLawyer.name) }, { label: copy.cases.professionalEmail, value: bounded(row.assignedLawyer.email) }, { label: copy.cases.fileCreated, value: formatDateTime(row.createdAt, locale) });
    if (row.summary) record.facts.push({ label: copy.common.case, value: bounded(row.summary) });
    const sessions = await prisma.caseSession.findMany({ where: { case: ownCaseWhere(actor, ref.id) }, orderBy: { sessionDate: "desc" }, take: 6,
      select: { sessionDate: true, decision: true, nextAction: true, nextSessionDate: true } });
    for (const session of sessions.slice(0, 5)) record.facts.push({ label: c.decision, value: `${formatDateTime(session.sessionDate, locale)} — ${bounded(session.decision)}${session.nextAction ? `; ${c.step}: ${bounded(session.nextAction)}` : ""}${session.nextSessionDate ? `; ${c.nextSession}: ${formatDateTime(session.nextSessionDate, locale)}` : ""}` });
    if (sessions.length > 5) record.facts.push({ label: c.decision, value: c.shortened });
  }
  if (ref.kind === "APPOINTMENT") {
    const row = await prisma.appointment.findFirst({ where: { AND: [ownVisiblePortalAppointmentWhere(actor), { id: ref.id }] }, select: { lawyer: { select: { name: true } } } });
    if (row?.lawyer) record.facts.push({ label: getClientContent(locale).common.lawyer, value: bounded(row.lawyer.name) });
  }
  if (ref.kind === "PROFILE") {
    const row = await prisma.client.findFirstOrThrow({ where: ownClientWhere(actor), select: { createdAt: true, assignedLawyer: { select: { name: true } } } });
    const copy = getClientContent(locale).profile;
    record.facts.push({ label: copy.fileCreated, value: formatDateTime(row.createdAt, locale) });
    if (row.assignedLawyer) record.facts.push({ label: copy.responsibleLawyer, value: bounded(row.assignedLawyer.name) });
  }
  if (ref.kind === "CONSULTATION") {
    const threads = await prisma.conversationThread.findMany({ where: { clientId: actor.clientId!, assistantSession: { consultationRequestId: ref.id } }, take: 1,
      select: { status: true, messages: { where: { senderType: "STAFF" }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true } } } });
    const thread = threads[0];
    if (thread) record.facts.push({ label: c.thread, value: label(getClientContent(locale).statuses.conversation, thread.status) });
    if (thread?.messages[0]) record.facts.push({ label: c.officeReply, value: `${formatDateTime(thread.messages[0].createdAt, locale)} — ${bounded(thread.messages[0].body)}` });
  }
  if (ref.kind === "DOCUMENT") {
    const document = await prisma.document.findFirst({ where: { AND: [clientVisibleDocumentWhere(actor.clientId!), { id: ref.id }] }, select: { serviceRequestId: true } });
    if (document?.serviceRequestId) {
      const request = await prisma.serviceRequest.findFirst({ where: { AND: [serviceRequestWhere(actor), { id: document.serviceRequestId, status: "NEEDS_INFORMATION" }] }, select: { events: { where: { internal: false, action: "NEEDS_INFORMATION", actor: { role: { name: { not: "Client" } } } }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true } } } });
      if (request?.events[0]?.body) record.facts.push({ label: c.missing, value: bounded(request.events[0].body) });
    }
  }
  return record;
}

export async function clientAssistantDueBalances(actor: Principal, locale: Locale) {
  await assertActiveServiceClient(actor);
  const balances = await getPortalDueBalances(actor);
  const review = await prisma.payment.count({ where: { ...portalVisiblePaymentWhere(actor.clientId!), ledgerReviewRequired: true } });
  const c = clientAssistantCopy[locale];
  return `${c.due}: ${review || balances.some(b => b.amount.lt(0)) ? c.review : balances.map(b => `${b.amount.toString()} ${b.currency}`).join("; ") || "0"}`;
}

/** Public references filter owned rows; a miss deliberately reveals nothing about other accounts. */
export async function findClientAssistantReference(actor: Principal, reference: string): Promise<RecordRef | null> {
  await assertActiveServiceClient(actor);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference);
  const refs = [
    ["CONSULTATION", await prisma.consultationRequest.findFirst({ where: { ...ownConsultationRequestWhere(actor), ...(uuid ? { id: reference } : { publicReference: { equals: reference, mode: "insensitive" } }) }, select: { id: true } })],
    ["SERVICE_REQUEST", await prisma.serviceRequest.findFirst({ where: { AND: [serviceRequestWhere(actor), uuid ? { id: reference } : { reference: { equals: reference, mode: "insensitive" } }] }, select: { id: true } })],
    ["CASE", await prisma.legalCase.findFirst({ where: { ...ownCaseWhere(actor), ...(uuid ? { id: reference } : { internalFileNumber: { equals: reference, mode: "insensitive" } }) }, select: { id: true } })],
    ["PAYMENT", await prisma.payment.findFirst({ where: { ...portalVisiblePaymentWhere(actor.clientId!), ...(uuid ? { id: reference } : { invoiceNumber: { equals: reference, mode: "insensitive" } }) }, select: { id: true } })]
  ] as const;
  const match = refs.find(([, row]) => row);
  if (match?.[1]) return { kind: match[0], id: match[1].id };
  if (/^CONS-[a-f0-9]{8}$/i.test(reference)) {
    const prefix = reference.slice(5).toLowerCase() + "%";
    const legacy = await prisma.$queryRaw<Array<{ id: string }>>`SELECT r.id FROM consultation_requests r JOIN clients c ON c.id = r."clientId" WHERE r."clientId" = ${actor.clientId}::uuid AND c."userId" = ${actor.id}::uuid AND c."deletedAt" IS NULL AND r."publicReference" IS NULL AND r.id::text LIKE ${prefix} LIMIT 1`;
    if (legacy[0]) return { kind: "CONSULTATION", id: legacy[0].id };
  }
  if (uuid) for (const kind of ["HEARING", "APPOINTMENT", "DOCUMENT", "CONVERSATION", "PROFILE"] as const) {
    const result = await listClientAssistantRecords(actor, kind, "en", undefined, { kind, id: reference });
    if (result.records[0]) return { kind, id: reference };
  }
  return null;
}

function zQuote(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { amount, currency, durationDays, scope } = value;
  return typeof amount === "string" && /^\d+(\.\d{1,2})?$/.test(amount) && typeof currency === "string" && typeof durationDays === "number" && typeof scope === "string" ? { amount, currency, durationDays, scope } : null;
}
