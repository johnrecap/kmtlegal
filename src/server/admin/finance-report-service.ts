import { Prisma } from "@prisma/client";
import { z } from "zod";
import { appendAuditLogBestEffort } from "@/server/audit/audit-service";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { toPagination } from "@/server/http/pagination";
import { parseWithSchema, uuidSchema } from "@/server/validation/schemas";
import { currencyValues, paymentStatusValues } from "@/lib/legal-finance";

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

function paymentOrderBy(filters: AdminPaymentListQuery): Prisma.PaymentOrderByWithRelationInput[] {
  if (filters.sortBy === "dueDate") {
    return [{ dueDate: filters.sortDirection }, { issueDate: "desc" }, { createdAt: "desc" }];
  }

  return [{ [filters.sortBy]: filters.sortDirection }, { createdAt: "desc" }];
}

function paymentListWhere(filters: AdminPaymentListQuery): Prisma.PaymentWhereInput {
  const search = filters.q?.trim();

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
  const openWhere = andPaymentWhere(where, { status: { notIn: ["PAID", "CANCELLED"] } });
  const overdueWhere = andPaymentWhere(where, {
    OR: [
      { status: "OVERDUE" },
      {
        dueDate: { lt: now },
        status: { notIn: ["PAID", "CANCELLED"] }
      }
    ]
  });

  const [all, paid, open, overdue] = await Promise.all([
    prisma.payment.aggregate({ where, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: andPaymentWhere(where, { status: "PAID" }), _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: openWhere, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: overdueWhere, _count: { _all: true }, _sum: { amount: true } })
  ]);

  return {
    invoiceCount: all._count._all,
    totalAmount: decimalToNumber(all._sum.amount),
    paidCount: paid._count._all,
    paidAmount: decimalToNumber(paid._sum.amount),
    openCount: open._count._all,
    openAmount: decimalToNumber(open._sum.amount),
    overdueCount: overdue._count._all,
    overdueAmount: decimalToNumber(overdue._sum.amount)
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

function handlePaymentWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ApiError(409, "CONFLICT", "Invoice number already exists.");
  }

  throw error;
}

export async function listAdminPayments(input: { actor: Principal; query: unknown }) {
  assertFinanceRead(input.actor);
  const filters = normalizePaymentListQuery(input.query);
  const pagination = toPagination(filters);
  const where = paymentListWhere(filters);

  const [items, total, summary] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        client: { select: { id: true, fullName: true, phone: true, email: true } },
        case: { select: { id: true, internalFileNumber: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: paymentOrderBy(filters),
      skip: pagination.skip,
      take: pagination.take
    }),
    prisma.payment.count({ where }),
    paymentSummary(where)
  ]);

  return { items, total, summary, filters, page: pagination.page, pageSize: pagination.pageSize };
}

export async function exportAdminPaymentsCsv(input: { actor: Principal; query: unknown }) {
  assertFinanceRead(input.actor);
  const filters = normalizePaymentListQuery(input.query);
  const where = paymentListWhere(filters);
  const items = await prisma.payment.findMany({
    where,
    include: {
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
      payment.createdAt.toISOString()
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
      client: { select: { id: true, fullName: true, phone: true, email: true } },
      case: { select: { id: true, internalFileNumber: true, title: true } },
      createdBy: { select: { id: true, name: true, email: true } }
    }
  });

  if (!payment) {
    throw new ApiError(404, "NOT_FOUND", "Payment was not found.");
  }

  return payment;
}

export async function createAdminPayment(input: { actor: Principal; body: unknown; request?: Request }) {
  assertFinanceManage(input.actor);
  const body = parseWithSchema(adminPaymentWriteSchema, input.body, "Payment payload is invalid.");
  await assertClientAndCase(body);
  const issueDate = parseRequiredDate(body.issueDate, "issueDate");
  const requestedInvoiceNumber = body.invoiceNumber.trim();

  for (let attempt = 0; attempt < invoiceGenerationRetryLimit; attempt += 1) {
    const invoiceNumber = requestedInvoiceNumber || (await generateAdminInvoiceNumber(issueDate));

    try {
      const payment = await prisma.payment.create({
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
    select: { id: true, invoiceNumber: true, status: true, amount: true, currency: true, clientId: true, caseId: true }
  });

  if (!existing) {
    throw new ApiError(404, "NOT_FOUND", "Payment was not found.");
  }

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: paymentMutationData(body, body.invoiceNumber || existing.invoiceNumber),
      include: {
        client: { select: { id: true, fullName: true, phone: true, email: true } },
        case: { select: { id: true, internalFileNumber: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
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
      take: 150
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
      take: 150
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

  const [
    financeSummary,
    paymentGroups,
    consultationGroups,
    caseGroups,
    taskGroups,
    clientCount,
    activeClientCount,
    recentPayments
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
        case: { select: { id: true, internalFileNumber: true, title: true } }
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take: 8
    })
  ]);

  return {
    filters,
    finance: {
      summary: financeSummary,
      byStatus: paymentStatusGroups(paymentGroups)
    },
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
