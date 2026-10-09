import { Prisma, type Currency } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/errors";
import { hasPermission, type Principal } from "@/server/auth/policy";
import { appendAuditLog } from "@/server/audit/audit-service";
import { parseWithSchema } from "@/server/validation/schemas";

const money = z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/).refine(value => new Prisma.Decimal(value).gt(0));
export const paymentEntryInputSchema = z.strictObject({
  idempotencyKey: z.uuid(), kind: z.enum(["SETTLEMENT", "REFUND", "REVERSAL"]),
  amount: money, currency: z.enum(["EGP", "USD", "EUR", "SAR", "AED"]),
  method: z.enum(["CASH", "BANK_TRANSFER"]), receiptNumber: z.string().trim().min(1).max(80),
  occurredAt: z.iso.datetime(), reversesEntryId: z.uuid().optional(), reason: z.string().trim().min(3).max(500).optional()
}).superRefine((value, context) => {
  if ((value.kind === "REVERSAL") !== !!value.reversesEntryId) context.addIssue({ code: "custom", path: ["reversesEntryId"], message: "Correction requires an original entry." });
  if (value.kind !== "SETTLEMENT" && !value.reason) context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required for refunds and corrections." });
  if (new Date(value.occurredAt).getTime() > Date.now() + 60_000) context.addIssue({ code: "custom", path: ["occurredAt"], message: "The payment date cannot be in the future." });
});

export function invoiceBalance(invoice: { amount: Prisma.Decimal; status: string; ledgerReviewRequired?: boolean }, entries: Array<{ amount: Prisma.Decimal }>) {
  const paid = entries.reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
  const remaining = invoice.status === "CANCELLED" || invoice.status === "DRAFT" ? new Prisma.Decimal(0) : Prisma.Decimal.max(0, invoice.amount.minus(paid));
  return { total: invoice.amount, paid, remaining, reviewRequired: !!invoice.ledgerReviewRequired || paid.lt(0) || paid.gt(invoice.amount) || (invoice.status === "PAID" && !paid.eq(invoice.amount)) };
}

export async function postPaymentEntry(input: { actor: Principal; paymentId: string; body: unknown; request?: Request }) {
  if (!hasPermission(input.actor, "finance.manage.any")) throw new ApiError(403, "PERMISSION_DENIED", "Finance management permission is required.");
  const body = parseWithSchema(paymentEntryInputSchema, input.body);
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${input.paymentId}::uuid FOR UPDATE`;
    const invoice = await tx.payment.findUnique({ where: { id: input.paymentId }, include: { entries: true } });
    if (!invoice) throw new ApiError(404, "NOT_FOUND", "Payment was not found.");
    const existing = invoice.entries.find(entry => entry.idempotencyKey === body.idempotencyKey);
    if (existing) {
      if (existing.kind !== body.kind || !existing.amount.abs().eq(body.amount) || existing.currency !== body.currency || existing.method !== body.method || existing.receiptNumber !== body.receiptNumber || existing.occurredAt.getTime() !== new Date(body.occurredAt).getTime() || existing.reversesEntryId !== (body.reversesEntryId ?? null) || existing.reason !== (body.reason ?? null)) {
        throw new ApiError(409, "CONFLICT", "This payment action identifier has already been used.");
      }
      return existing;
    }
    if (invoice.ledgerReviewRequired || invoice.paymentAttemptId) throw new ApiError(409, "CONFLICT", "This invoice requires payment-provider reconciliation before manual changes.");
    if (body.currency !== invoice.currency || invoice.status === "DRAFT" || (invoice.status === "CANCELLED" && body.kind === "SETTLEMENT")) throw new ApiError(409, "CONFLICT", "This payment does not match an open invoice.");
    const balance = invoiceBalance(invoice, invoice.entries);
    if (balance.reviewRequired) throw new ApiError(409, "CONFLICT", "The invoice balance requires reconciliation.");
    let amount = new Prisma.Decimal(body.amount).times(body.kind === "REFUND" ? -1 : 1);
    if (body.kind === "REVERSAL") {
      const original = invoice.entries.find(entry => entry.id === body.reversesEntryId);
      if (!original || original.kind === "REVERSAL" || invoice.entries.some(entry => entry.reversesEntryId === original.id) || !original.amount.abs().eq(body.amount)) {
        throw new ApiError(409, "CONFLICT", "The original payment entry cannot be reversed.");
      }
      amount = original.amount.negated();
    }
    const net = balance.paid.plus(amount);
    if (net.lt(0) || net.gt(invoice.amount)) throw new ApiError(409, "CONFLICT", "The payment exceeds the invoice balance or refundable amount.");
    const entry = await tx.paymentEntry.create({ data: {
      paymentId: invoice.id, idempotencyKey: body.idempotencyKey, kind: body.kind, amount,
      currency: invoice.currency, method: body.method, receiptNumber: body.receiptNumber,
      occurredAt: new Date(body.occurredAt), approvedById: input.actor.id,
      externalReference: body.kind === "SETTLEMENT" ? `manual:${invoice.currency}:${body.method}:${body.receiptNumber}` : null,
      reversesEntryId: body.reversesEntryId, reason: body.reason
    } });
    const paidInFull = net.eq(invoice.amount);
    await tx.payment.update({ where: { id: invoice.id }, data: {
      status: invoice.status === "CANCELLED" ? "CANCELLED" : paidInFull ? "PAID" : invoice.dueDate && invoice.dueDate < new Date() ? "OVERDUE" : "PENDING",
      paidAt: paidInFull ? new Date(body.occurredAt) : null
    } });
    await appendAuditLog({ action: `finance.entry.${body.kind.toLowerCase()}`, actorId: input.actor.id, resourceType: "PaymentEntry", resourceId: entry.id, paymentId: invoice.id, clientId: invoice.clientId,
      metadata: { amount: amount.toString(), currency: invoice.currency, kind: body.kind, reversesEntryId: body.reversesEntryId }, request: input.request, client: tx });
    return entry;
  });
}

/** Only called from existing trusted invoice/payment creation transactions, never from client proof uploads. */
export async function recordTrustedInvoiceSettlement(tx: Prisma.TransactionClient, invoice: {
  id: string; amount: Prisma.Decimal; currency: Currency; paidAt: Date | null; paymentMethod: string | null;
  receiptNumber: string | null; invoiceNumber: string; createdById: string | null; paymentAttemptId: string | null;
}) {
  return tx.paymentEntry.create({ data: {
    paymentId: invoice.id, kind: "SETTLEMENT", amount: invoice.amount, currency: invoice.currency,
    method: invoice.paymentMethod ?? "MANUAL", receiptNumber: invoice.receiptNumber ?? invoice.invoiceNumber,
    occurredAt: invoice.paidAt ?? new Date(), approvedById: invoice.createdById,
    idempotencyKey: invoice.paymentAttemptId ? `gateway:${invoice.paymentAttemptId}` : "manual-initial-paid",
    externalReference: invoice.paymentAttemptId ? `gateway:${invoice.paymentAttemptId}` : `manual:${invoice.currency}:${invoice.paymentMethod ?? "MANUAL"}:${invoice.receiptNumber ?? invoice.invoiceNumber}`
  } });
}

export async function readInvoiceBalances(where: Prisma.PaymentWhereInput) {
  const invoices = await prisma.payment.findMany({ where, include: { entries: { orderBy: [{ occurredAt: "asc" }, { id: "asc" }] } } });
  return invoices.map(invoice => ({ ...invoice, balance: invoiceBalance(invoice, invoice.entries) }));
}

export function groupInvoiceBalances(invoices: Awaited<ReturnType<typeof readInvoiceBalances>>) {
  const currencies = new Map<string, { currency: string; total: Prisma.Decimal; paid: Prisma.Decimal; remaining: Prisma.Decimal }>();
  for (const invoice of invoices) {
    const current = currencies.get(invoice.currency) ?? { currency: invoice.currency, total: new Prisma.Decimal(0), paid: new Prisma.Decimal(0), remaining: new Prisma.Decimal(0) };
    if (invoice.status !== "CANCELLED" && invoice.status !== "DRAFT") current.total = current.total.plus(invoice.balance.total);
    current.paid = current.paid.plus(invoice.balance.paid);
    current.remaining = current.remaining.plus(invoice.balance.remaining);
    currencies.set(invoice.currency, current);
  }
  return [...currencies.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

/** Shared SQL aggregation for client and staff; no cross-currency arithmetic. */
export async function aggregateInvoiceBalances(where: Prisma.PaymentWhereInput) {
  const open = { AND: [where, { status: { in: ["ISSUED", "PENDING", "OVERDUE"] } }] } satisfies Prisma.PaymentWhereInput;
  const overdue = { AND: [open, { OR: [{ status: "OVERDUE" }, { dueDate: { lt: new Date() } }] }] } satisfies Prisma.PaymentWhereInput;
  const [totals, openTotals, overdueTotals, paid, openPaid, overduePaid] = await Promise.all([
    prisma.payment.groupBy({ by: ["currency"], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["currency"], where: open, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ["currency"], where: overdue, _sum: { amount: true } }),
    prisma.paymentEntry.groupBy({ by: ["currency"], where: { payment: where }, _sum: { amount: true } }),
    prisma.paymentEntry.groupBy({ by: ["currency"], where: { payment: open }, _sum: { amount: true } }),
    prisma.paymentEntry.groupBy({ by: ["currency"], where: { payment: overdue }, _sum: { amount: true } })
  ]);
  const amount = (items: Array<{ currency: Currency; _sum: { amount: Prisma.Decimal | null } }>, currency: Currency) => items.find(item => item.currency === currency)?._sum.amount ?? new Prisma.Decimal(0);
  return totals.map(total => ({ currency: total.currency, count: total._count._all,
    totalAmount: (total._sum.amount ?? new Prisma.Decimal(0)).toString(), paidAmount: amount(paid, total.currency).toString(),
    openAmount: amount(openTotals, total.currency).minus(amount(openPaid, total.currency)).toString(),
    overdueAmount: amount(overdueTotals, total.currency).minus(amount(overduePaid, total.currency)).toString()
  })).sort((a, b) => a.currency.localeCompare(b.currency));
}
