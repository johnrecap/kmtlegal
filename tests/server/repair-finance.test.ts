import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES, type Principal } from "@/server/auth/policy";
import { canUpdateAdminPayment, listAdminPayments } from "@/server/admin/finance-report-service";
import { listFinanceOptions } from "@/server/admin/finance-options-service";
import { prisma } from "@/server/db/prisma";

vi.mock("@/server/db/prisma", () => ({ prisma: {
  client: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  legalCase: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  payment: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
  paymentAttempt: { count: vi.fn() }
} }));
const actor: Principal = { id: "11111111-1111-4111-8111-111111111111", roleName: ROLES.officeAdmin, permissions: ["finance.read.any", "finance.manage.any"] };

beforeEach(() => vi.resetAllMocks());
describe("finance repair contracts", () => {
  it("never offers manual mutation of gateway invoices", () => {
    expect(canUpdateAdminPayment(actor, { paymentAttemptId: "attempt" })).toBe(false);
    expect(canUpdateAdminPayment(actor, { paymentAttemptId: null })).toBe(true);
    expect(canUpdateAdminPayment({ ...actor, permissions: ["finance.read.any"] }, { paymentAttemptId: null })).toBe(false);
  });
  it("paginates beyond 150 with finance rights alone and includes the selected record", async () => {
    const client = { id: "22222222-2222-4222-8222-222222222222", fullName: "Selected client" };
    vi.mocked(prisma.client.findMany).mockResolvedValue([]);
    vi.mocked(prisma.client.count).mockResolvedValue(180);
    vi.mocked(prisma.client.findFirst).mockResolvedValue(client as never);
    const result = await listFinanceOptions(actor, { entity: "clients", page: 9, selectedId: client.id, q: "search" });
    expect(result.selected).toEqual({ id: client.id, label: client.fullName });
    expect(result.total).toBe(180);
    expect(prisma.client.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 160, take: 20, select: { id: true, fullName: true } }));
    expect(prisma.client.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: client.id, deletedAt: null } }));
  });
  it("rejects unauthorized lookups before any database query", async () => {
    await expect(listFinanceOptions({ ...actor, permissions: [] }, { entity: "clients" })).rejects.toMatchObject({ status: 403 });
    expect(prisma.client.findMany).not.toHaveBeenCalled();
  });
  it("returns decimal currency totals independently of pagination", async () => {
    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.count).mockResolvedValue(0);
    vi.mocked(prisma.paymentAttempt.count).mockResolvedValue(0);
    vi.mocked(prisma.payment.aggregate).mockResolvedValue({ _count: { _all: 2 }, _sum: { amount: 110 } } as never);
    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      { currency: "EGP", _sum: { amount: { toString: () => "100.01" } } },
      { currency: "USD", _sum: { amount: { toString: () => "10.02" } } }
    ] as never);
    const result = await listAdminPayments({ actor, query: { page: 2 } });
    expect(result.summary.byCurrency).toEqual([
      { currency: "EGP", totalAmount: "100.01", paidAmount: "100.01", openAmount: "100.01", overdueAmount: "100.01" },
      { currency: "USD", totalAmount: "10.02", paidAmount: "10.02", openAmount: "10.02", overdueAmount: "10.02" }
    ]);
    expect(prisma.payment.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ AND: expect.arrayContaining([{ status: { in: ["ISSUED", "PENDING", "OVERDUE"] } }]) }) }));
  });
});
