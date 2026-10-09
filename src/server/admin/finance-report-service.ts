import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { canonicalPhoneForSearch } from "@/server/phone/phone-normalization";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { currencyValues, paymentStatusValues, financialReviewCodes } from "@/lib/legal-finance";
import { recordTrustedInvoiceSettlement, invoiceBalance, aggregateInvoiceBalances } from "@/server/payments/payment-ledger-service";

const paymentStatusSchema = z.enum(paymentStatusValues);
const currencySchema = z.enum(currencyValues);
const paymentSortBySchema = z.enum(["issueDate", "dueDate", "createdAt", "amount", "status"]);
const optionalDateStringSchema = z.string().trim().max(60).optional().or(z.literal(""));
const requiredDateStringSchema = z.string().trim().min(1).max(60);
const invoiceNumberSchema = z
  .string()
  .trim()
  .max(80)
  .refine((value) => value === "" || value.length >= 3, "Invoice number must be at least 3 characters.")
  .refine((value) => value === "" || /^[A-Za-z0-9._/-]+$/.test(value), "Invoice number has invalid characters.")
  .default("");
const generatedInvoiceNumberPattern = /^INV-(\d{4})-(\d+)$/;
const invoiceGenerationRetryLimit = 5;

export const adminPaymentListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: paymentStatusSchema.optional().or(z.literal("")),
  currency: currencySchema.optional().or(z.literal("")),
  clientId: uuidSchema.optional().or(z.literal("")),
  caseId: uuidSchema.optional().or(z.literal("")),
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  sortBy: paymentSortBySchema.default("issueDate"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(80).default(30)
});

export const adminPaymentWriteSchema = z
  .object({
    invoiceNumber: invoiceNumberSchema,
    clientId: uuidSchema,
    caseId: uuidSchema.optional().or(z.literal("")),
    issueDate: requiredDateStringSchema,
    dueDate: optionalDateStringSchema,
    amount: z.coerce
      .number()
      .positive()
      .max(999_999_999.99)
      .transform((value) => Math.round(value * 100) / 100),
    currency: currencySchema.default("EGP"),
    status: paymentStatusSchema.default("DRAFT"),
    paymentMethod: z.string().trim().max(80).optional().or(z.literal("")),
    receiptNumber: z.string().trim().max(80).optional().or(z.literal("")),
    paidAt: optionalDateStringSchema,
    notes: z.string().trim().max(1200).optional().or(z.literal(""))
  })
  .strict();

export const adminReportQuerySchema = z.object({
  dateFrom: optionalDateStringSchema,
  dateTo: optionalDateStringSchema,
  currency: currencySchema.optional().or(z.literal(""))
});

export type AdminPaymentListQuery = z.infer<typeof adminPaymentListQuerySchema>;
export type AdminPaymentWriteInput = z.infer<typeof adminPaymentWriteSchema>;
export type AdminReportQuery = z.infer<typeof adminReportQuerySchema>;

type StatusGroup = {
  status: string;
  count: number;
  amount?: number;
};

export function canReadAdminFinance(actor: Principal) {
  return hasPermission(actor, "finance.read.any") || hasPermission(actor, "finance.manage.any");
}

export function canManageAdminFinance(actor: Principal) {
  return hasPermission(actor, "finance.manage.any");
}

export function canReadAdminReports(actor: Principal) {
  return hasPermission(actor, "report.read.any");
}

function assertFinanceRead(actor: Principal) {
  if (!canReadAdminFinance(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance read permission is required.");
  }
}

function assertFinanceManage(actor: Principal) {
  if (!canManageAdminFinance(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Finance management permission is required.");
  }
}

function assertReportsRead(actor: Principal) {
  if (!canReadAdminReports(actor)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Report read permission is required.");
  }
}

function normalizePaymentListQuery(input: unknown) {
  return parseWithSchema(adminPaymentListQuerySchema, input, "Payment list query is invalid.");
}

function normalizeReportQuery(input: unknown) {
  return parseWithSchema(adminReportQuerySchema, input, "Report query is invalid.");
}

function parseDateInput(value: string | undefined | null, field: string, endOfDay = false) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is invalid.`);
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

export function financeReportDateRange(filters: Pick<AdminPaymentListQuery | AdminReportQuery, "dateFrom" | "dateTo">) {
  const from = parseDateInput(filters.dateFrom, "dateFrom");
  const to = parseDateInput(filters.dateTo, "dateTo", true);

  if (from && to && from.getTime() > to.getTime()) {
    throw new ApiError(400, "VALIDATION_ERROR", "dateFrom must be before dateTo.");
  }

  return { from, to };
}

function issueDateWhere(filters: Pick<AdminPaymentListQuery | AdminReportQuery, "dateFrom" | "dateTo">): Prisma.PaymentWhereInput {
  const { from, to } = financeReportDateRange(filters);
  if (!from && !to) {
    return {};
  }

  return {
    issueDate: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }
  };
}

function reportPaymentWhere(filters: AdminReportQuery): Prisma.PaymentWhereInput {
  return {
    AND: [issueDateWhere(filters), filters.currency ? { currency: filters.currency } : {}]
  };
}

function createdAtWhere(filters: Pick<AdminReportQuery, "dateFrom" | "dateTo">) {
  const { from, to } = financeReportDateRange(filters);
  if (!from && !to) {
    return {};
  }

  return {
    createdAt: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }
  };
}

function previousReportPeriod(filters: AdminReportQuery) {
  const { from, to } = financeReportDateRange(filters);
  if (!from || !to) return null;
  const duration = to.getTime() - from.getTime() + 1;
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration + 1);
  return {
    filters: {
      ...filters,
      dateFrom: previousFrom.toISOString(),
      dateTo: previousTo.toISOString()
    } satisfies AdminReportQuery,
    from: previousFrom.toISOString(),
    to: previousTo.toISOString()
  };
}

function paymentOrderBy(filters: AdminPaymentListQuery): Prisma.PaymentOrderByWithRelationInput[] {
  if (filters.sortBy === "dueDate") {
    return [{ dueDate: filters.sortDirection }, { issueDate: "desc" }, { createdAt: "desc" }];
  }

  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function paymentListWhere(filters: AdminPaymentListQuery): Prisma.PaymentWhereInput {
  const search = filters.q?.trim();
  const canonicalPhone = canonicalPhoneForSearch(search);

  return {
    AND: [
      issueDateWhere(filters),
      filters.status ? { status: filters.status } : {},
      filters.currency ? { currency: filters.currency } : {},
      filters.clientId ? { clientId: filters.clientId } : {},
      filters.caseId ? { caseId: filters.caseId } : {},
      search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" } },
              { receiptNumber: { contains: search, mode: "insensitive" } },
              { paymentMethod: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
              { client: { fullName: { contains: search, mode: "insensitive" } } },
              { client: { phone: { contains: search, mode: "insensitive" } } },
              ...(canonicalPhone ? [{ client: { phoneCanonical: { contains: canonicalPhone } } }] : []),
              { client: { email: { contains: search, mode: "insensitive" } } },
              { case: { internalFileNumber: { contains: search, mode: "insensitive" } } },
              { case: { title: { contains: search, mode: "insensitive" } } }
            ]
          }
        : {}
    ]
  };
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function andPaymentWhere(base: Prisma.PaymentWhereInput, extra: Prisma.PaymentWhereInput): Prisma.PaymentWhereInput {
  return { AND: [base, extra] };
}

async function paymentSummary(where: Prisma.PaymentWhereInput) {
  const now = new Date();
  const openWhere = andPaymentWhere(where, { status: { in: ["ISSUED", "PENDING", "OVERDUE"] } });
  const overdueWhere = andPaymentWhere(where, {
    OR: [
      { status: "OVERDUE" },
      {
        dueDate: { lt: now },
        status: { in: ["ISSUED", "PENDING", "OVERDUE"] }
      }
    ]
  });

  const [all, paid, open, overdue, reviewCount, unallocatedReviewCount, ledger] = await Promise.all([
    prisma.payment.aggregate({ where, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: andPaymentWhere(where, { status: "PAID" }), _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: openWhere, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: overdueWhere, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.count({where: andPaymentWhere(where, { OR: [{ ledgerReviewRequired: true }, { paymentAttempt: {failureCode: {in:financialReviewCodes}} }] })}),
    prisma.paymentAttempt.count({where:{payment:{is:null},failureCode:"PAYMENT_COLLECTION_REVIEW_REQUIRED"}}),
    aggregateInvoiceBalances(where)
  ]);

  return {
    invoiceCount: all._count._all,
    totalAmount: ledger.length > 1 ? null : Number(ledger[0]?.totalAmount ?? 0),
    paidCount: paid._count._all,
    paidAmount: ledger.length > 1 ? null : Number(ledger[0]?.paidAmount ?? 0),
    reviewCount,
    unallocatedReviewCount,
    openCount: open._count._all,
    openAmount: ledger.length > 1 ? null : Number(ledger[0]?.openAmount ?? 0),
    overdueCount: overdue._count._all,
    overdueAmount: ledger.length > 1 ? null : Number(ledger[0]?.overdueAmount ?? 0)
  };
}

function statusCounts<TStatus extends string>(statuses: readonly TStatus[], groups: Array<{ status: TStatus; _count: { _all: number } }>) {
  return statuses.map((status) => {
    const match = groups.find((group) => group.status === status);
    return { status, count: match?._count._all ?? 0 };
  });
}

function paymentStatusGroups(groups: Array<{ status: (typeof paymentStatusValues)[number]; _count: { _all: number }; _sum: { amount: Prisma.Decimal | null } }>): StatusGroup[] {
  return paymentStatusValues.map((status) => {
    const match = groups.find((group) => group.status === status);
    return {
      status,
      count: match?._count._all ?? 0,
      amount: decimalToNumber(match?._sum.amount)
    };
  });
}

function parseRequiredDate(value: string, field: string) {
  const date = parseDateInput(value, field);
  if (!date) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is required.`);
  }
  return date;
}

export function formatAdminInvoiceNumber(year: number, sequence: number) {
  if (!Number.isInteger(year) || year < 1) {
    throw new Error("Invoice year is invalid.");
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Invoice sequence is invalid.");
  }

  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

export function nextAdminInvoiceNumberFromExisting(year: number, invoiceNumbers: readonly string[]) {
  const invoiceYear = String(year);
  let maxSequence = 0;

  for (const invoiceNumber of invoiceNumbers) {
    const match = generatedInvoiceNumberPattern.exec(invoiceNumber);
    if (!match || match[1] !== invoiceYear) {
      continue;
    }

    const sequence = Number(match[2]);
    if (Number.isInteger(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return formatAdminInvoiceNumber(year, maxSequence + 1);
}

async function generateAdminInvoiceNumber(issueDate: Date) {
  const year = issueDate.getUTCFullYear();
  const prefix = `INV-${year}-`;
  const existing = await prisma.payment.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true }
  });

  return nextAdminInvoiceNumberFromExisting(
    year,
    existing.map((payment) => payment.invoiceNumber)
  );
}

function isInvoiceNumberConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function paidAtForWrite(body: AdminPaymentWriteInput) {
  const paidAt = parseDateInput(body.paidAt, "paidAt");
  if (paidAt && body.status !== "PAID") {
    throw new ApiError(400, "VALIDATION_ERROR", "paidAt can be set only when payment status is PAID.");
  }

  if (body.status === "PAID") {
    return paidAt ?? new Date();
  }

  return null;
}

function paymentMutationData(body: AdminPaymentWriteInput, invoiceNumber: string, issueDate = parseRequiredDate(body.issueDate, "issueDate")) {
  return {
    invoiceNumber,
    clientId: body.clientId,
    caseId: body.caseId || null,
    issueDate,
    dueDate: parseDateInput(body.dueDate, "dueDate") ?? null,
    amount: new Prisma.Decimal(body.amount.toFixed(2)),
    currency: body.currency,
    status: body.status,
    paymentMethod: body.paymentMethod || null,
    receiptNumber: body.receiptNumber || null,
    paidAt: paidAtForWrite(body),
    notes: body.notes || null
  };
}

export function isGatewayManagedPaymentMethod(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return /\b(paytabs|paymob|hosted checkout|gateway|webhook)\b/.test(normalized);
}

async function assertClientAndCase(body: AdminPaymentWriteInput) {
  const client = await prisma.client.findUnique({
    where: { id: body.clientId },
    select: { id: true, deletedAt: true }
  });

  if (!client || client.deletedAt) {
    throw new ApiError(400, "VALIDATION_ERROR", "Client is invalid.");
  }

  if (!body.caseId) {
    return;
  }

  const legalCase = await prisma.legalCase.findFirst({
    where: { id: body.caseId, clientId: body.clientId, deletedAt: null },
    select: { id: true }
  });

  if (!legalCase) {
    throw new ApiError(400, "VALIDATION_ERROR", "Case is invalid for the selected client.");
  }
}

async function assertManualPaymentDoesNotDuplicateGatewayOrReceipt(body: AdminPaymentWriteInput, existingPaymentId?: string) {
  if (body.status !== "PAID") {
    return;
  }

  if (isGatewayManagedPaymentMethod(body.paymentMethod)) {
    throw new ApiError(409, "CONFLICT", "Gateway payments must be recorded by the trusted payment webhook, not as a manual invoice.");
  }

  const receiptNumber = body.receiptNumber?.trim();
  if (!receiptNumber) {
    return;
  }

  const duplicate = await prisma.payment.findFirst({
    where: {
      receiptNumber,
      status: "PAID",
      ...(existingPaymentId ? { id: { not: existingPaymentId } } : {})
    },
    select: { id: true, invoiceNumber: true }
  });

  if (duplicate) {
    throw new ApiError(409, "CONFLICT", "A paid manual payment with this receipt number already exists.");
  }
}

function handlePaymentWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    if (isManualReceiptNumberConflict(error)) {
      throw new ApiError(409, "CONFLICT", "A paid manual payment with this receipt number already exists.");
    }
    throw new ApiError(409, "CONFLICT", "Invoice number already exists.");
  }

  throw error;
}

function isManualReceiptNumberConflict(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  const printableTarget = Array.isArray(target) ? target.join("|") : String(target ?? "");
  return printableTarget.includes("receiptNumber") || printableTarget.includes("payments_manual_paid_receipt_number_unique_idx");
}

export async function listAdminPayments(input: { actor: Principal; query: unknown }) {
  assertFinanceRead(input.actor);
  const filters = normalizePaymentListQuery(input.query);
  const pagination = toPagination(filters);
  const where = paymentListWhere(filters);

  const [items, total, summary, byCurrency] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        paymentAttempt: {select: {status:true, failureCode:true}},
        entries: true,
        client: { select: { id: true, fullName: true, phone: true, email: true } },
        case: { select: { id: true, internalFileNumber: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: paymentOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.payment.count({ where }),
    paymentSummary(where),
    paymentCurrencySummary(where)
  ]);

  return { items: items.map(payment => ({ ...payment, balance: invoiceBalance(payment, payment.entries), canUpdate: canUpdateAdminPayment(input.actor, payment) })), total, summary: { ...summary, byCurrency }, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export function canUpdateAdminPayment(actor: Principal, payment: { paymentAttemptId: string | null; entries?: unknown[]; ledgerReviewRequired?: boolean }) {
  return canManageAdminFinance(actor) && !payment.paymentAttemptId && !payment.entries?.length && !payment.ledgerReviewRequired;
}

async function paymentCurrencySummary(where: Prisma.PaymentWhereInput) {
  return aggregateInvoiceBalances(where);
}

export async function exportAdminPaymentsCsv(input: { actor: Principal; query: unknown }) {
  assertFinanceRead(input.actor);
  const filters = normalizePaymentListQuery(input.query);
  const where = paymentListWhere(filters);
  const items = await prisma.payment.findMany({
    where,
    include: {
      entries: true,
      client: { select: { fullName: true } },
      case: { select: { internalFileNumber: true, title: true } }
    },
    orderBy: paymentOrderBy(filters),
    take: 5000
  });

  const rows = [
    [
      "invoiceNumber",
      "client",
      "case",
      "issueDate",
      "dueDate",
      "amount",
      "currency",
      "status",
      "paymentMethod",
      "receiptNumber",
      "paidAt",
      "createdAt"
      , "netPaid", "remaining", "reviewRequired"
    ],
    ...items.map((payment) => [
      payment.invoiceNumber,
      payment.client.fullName,
      payment.case ? `${payment.case.internalFileNumber} - ${payment.case.title}` : "",
      payment.issueDate.toISOString(),
      payment.dueDate?.toISOString() ?? "",
      payment.amount.toString(),
      payment.currency,
      payment.status,
      payment.paymentMethod ?? "",
      payment.receiptNumber ?? "",
      payment.paidAt?.toISOString() ?? "",
      payment.createdAt.toISOString(), invoiceBalance(payment, payment.entries).paid.toString(), invoiceBalance(payment, payment.entries).remaining.toString(), String(invoiceBalance(payment, payment.entries).reviewRequired)
    ])
  ];

  return {
    filename: `kmt-finance-${new Date().toISOString().slice(0, 10)}.csv`,
    content: rows.map((row) => row.map(csvCell).join(",")).join("\n"),
    count: items.length
  };
}

export async function getAdminPaymentDetail(input: { actor: Principal; paymentId: string }) {
  assertFinanceRead(input.actor);
  const paymentId = parseWithSchema(uuidSchema, input.paymentId, "Payment id is invalid.");
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      entries: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }], include: { approvedBy: { select: { name: true } } } },
      documents: { where: { deletedAt: null }, select: { id: true, fileName: true }, orderBy: { createdAt: "desc" } },
      client: { select: { id: true, fullName: true, phone: true, email: true } },
      case: { select: { id: true, internalFileNumber: true, title: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  if (!payment) {
    throw new ApiError(404, "NOT_FOUND", "Payment was not found.");
  }

  return { ...payment, balance: invoiceBalance(payment, payment.entries), canUpdate: canUpdateAdminPayment(input.actor, payment) };
}

export async function createAdminPayment(input: { actor: Principal; body: unknown; request?: Request }) {
  assertFinanceManage(input.actor);
  const body = parseWithSchema(adminPaymentWriteSchema, input.body, "Payment payload is invalid.");
  await assertClientAndCase(body);
  await assertManualPaymentDoesNotDuplicateGatewayOrReceipt(body);
  const issueDate = parseRequiredDate(body.issueDate, "issueDate");
  const requestedInvoiceNumber = body.invoiceNumber.trim();

  for (let attempt = 0; attempt < invoiceGenerationRetryLimit; attempt += 1) {
    const invoiceNumber = requestedInvoiceNumber || (await generateAdminInvoiceNumber(issueDate));

    try {
      const payment = await prisma.$transaction(async tx => {
        const created = await tx.payment.create({
        data: {
          ...paymentMutationData(body, invoiceNumber, issueDate),
          createdById: input.actor.id
        },
        include: {
          client: { select: { id: true, fullName: true, phone: true, email: true } },
          case: { select: { id: true, internalFileNumber: true, title: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

        if (created.status === "PAID") await recordTrustedInvoiceSettlement(tx, created);
        return created;
      });

      await appendAuditLogBestEffort({
        actorId: input.actor.id,
        action: "finance.payment_create",
        resourceType: "Payment",
        resourceId: payment.id,
        clientId: payment.clientId,
        caseId: payment.caseId,
        paymentId: payment.id,
        metadata: {
          invoiceNumber: payment.invoiceNumber,
          clientId: payment.clientId,
          caseId: payment.caseId,
          amount: payment.amount.toString(),
          currency: payment.currency,
          status: payment.status
        },
        request: input.request
      });

      return payment;
    } catch (error) {
      if (!requestedInvoiceNumber && isInvoiceNumberConflict(error) && attempt < invoiceGenerationRetryLimit - 1) {
        continue;
      }
      handlePaymentWriteError(error);
    }
  }

  throw new ApiError(409, "CONFLICT", "Could not generate a unique invoice number. Try again.");
}

export async function updateAdminPayment(input: { actor: Principal; paymentId: string; body: unknown; request?: Request }) {
  assertFinanceManage(input.actor);
  const paymentId = parseWithSchema(uuidSchema, input.paymentId, "Payment id is invalid.");
  const body = parseWithSchema(adminPaymentWriteSchema, input.body, "Payment payload is invalid.");
  await assertClientAndCase(body);

  const existing = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, invoiceNumber: true, status: true, amount: true, currency: true, clientId: true, caseId: true, paymentAttemptId: true }
  });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Payment was not found.");
  }
  if (existing.paymentAttemptId) {
    throw new ApiError(409, "CONFLICT", "Gateway-confirmed payments cannot be edited as manual finance records.");
  }
  await assertManualPaymentDoesNotDuplicateGatewayOrReceipt(body, paymentId);

  try {
    const payment = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId}::uuid FOR UPDATE`;
      const current = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { _count: { select: { entries: true } } } });
      if (current._count.entries || current.ledgerReviewRequired || current.paymentAttemptId) throw new ApiError(409, "CONFLICT", "Recorded payments are immutable. Use a ledger correction instead.");
      const updated = await tx.payment.update({
      where: { id: paymentId },
      data: paymentMutationData(body, body.invoiceNumber || existing.invoiceNumber),
      include: {
        client: { select: { id: true, fullName: true, phone: true, email: true } },
        case: { select: { id: true, internalFileNumber: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

      if (updated.status === "PAID") await recordTrustedInvoiceSettlement(tx, updated);
      return updated;
    });

    await appendAuditLogBestEffort({
      actorId: input.actor.id,
      action: "finance.payment_update",
      resourceType: "Payment",
      resourceId: payment.id,
      clientId: payment.clientId,
      caseId: payment.caseId,
      paymentId: payment.id,
      metadata: {
        previousInvoiceNumber: existing.invoiceNumber,
        invoiceNumber: payment.invoiceNumber,
        previousStatus: existing.status,
        status: payment.status,
        previousAmount: existing.amount.toString(),
        amount: payment.amount.toString(),
        previousCurrency: existing.currency,
        currency: payment.currency,
        previousClientId: existing.clientId,
        clientId: payment.clientId,
        previousCaseId: existing.caseId,
        caseId: payment.caseId
      },
      request: input.request
    });

    return payment;
  } catch (error) {
    handlePaymentWriteError(error);
  }
}

export async function getAdminFinanceOptions(actor: Principal) {
  assertFinanceRead(actor);
  const [clients, cases] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true, phone: true },
      orderBy: { fullName: "asc" },
      take: 20
    }),
    prisma.legalCase.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        internalFileNumber: true,
        title: true,
        clientId: true,
        client: { select: { id: true, fullName: true } }
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 20
    })
  ]);

  return {
    clients,
    cases,
    statuses: [...paymentStatusValues],
    currencies: [...currencyValues],
    canManage: canManageAdminFinance(actor)
  };
}

export async function getAdminReports(input: { actor: Principal; query: unknown }) {
  assertReportsRead(input.actor);
  const filters = normalizeReportQuery(input.query);
  const paymentWhere = reportPaymentWhere(filters);
  const operationalDateWhere = createdAtWhere(filters);
  const previousPeriod = previousReportPeriod(filters);

  const [
    financeSummary,
    paymentGroups,
    consultationGroups,
    caseGroups,
    taskGroups,
    clientCount,
    activeClientCount,
    recentPayments,
    currencyGroups,
    previousFinanceSummary
  ] = await Promise.all([
    paymentSummary(paymentWhere),
    prisma.payment.groupBy({
      by: ["status"],
      where: paymentWhere,
      _count: { _all: true },
      _sum: { amount: true }
    }),
    prisma.consultationRequest.groupBy({
      by: ["status"],
      where: operationalDateWhere,
      _count: { _all: true }
    }),
    prisma.legalCase.groupBy({
      by: ["status"],
      where: { AND: [{ deletedAt: null }, operationalDateWhere] },
      _count: { _all: true }
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: operationalDateWhere,
      _count: { _all: true }
    }),
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.client.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: {
        client: { select: { id: true, fullName: true } },
        paymentAttempt: {select: {status:true, failureCode:true}},
        case: { select: { id: true, internalFileNumber: true, title: true } }
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take: 8
    }),
    aggregateInvoiceBalances(paymentWhere),
    previousPeriod ? paymentSummary(reportPaymentWhere(previousPeriod.filters)) : Promise.resolve(null)
  ]);

  return {
    filters,
    finance: {
      summary: financeSummary,
      byStatus: paymentStatusGroups(paymentGroups),
      byCurrency: currencyGroups.map((group) => ({
        currency: group.currency,
        count: group.count,
        amount: group.totalAmount,
        paid: group.paidAmount,
        remaining: group.openAmount,
        overdue: group.overdueAmount
      }))
    },
    comparison: previousFinanceSummary && previousPeriod ? {
      period: { from: previousPeriod.from, to: previousPeriod.to },
      finance: { summary: previousFinanceSummary }
    } : null,
    operations: {
      consultationsByStatus: statusCounts(["NEW", "REVIEWING", "SCHEDULED", "REJECTED", "CONVERTED"] as const, consultationGroups),
      casesByStatus: statusCounts(["NEW", "UNDER_REVIEW", "ACTIVE", "AWAITING_JUDGMENT", "COMPLETED", "CLOSED", "ARCHIVED"] as const, caseGroups),
      tasksByStatus: statusCounts(["NEW", "IN_PROGRESS", "REVIEW", "OVERDUE", "COMPLETED", "ARCHIVED"] as const, taskGroups),
      clients: {
        total: clientCount,
        active: activeClientCount
      }
    },
    recentPayments
  };
}
