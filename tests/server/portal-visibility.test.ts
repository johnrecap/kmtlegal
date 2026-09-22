import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Principal } from "@/server/auth/policy";

const databaseMocks = vi.hoisted(() => {
  return {
    clientFindUnique: vi.fn(),
    caseFindMany: vi.fn(),
    caseCount: vi.fn(),
    appointmentFindMany: vi.fn(),
    appointmentCount: vi.fn(),
    documentCount: vi.fn(),
    paymentFindMany: vi.fn(),
    paymentGroupBy: vi.fn(),
    paymentFindFirst: vi.fn(),
    paymentAttemptFindMany: vi.fn()
  };
});

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    client: { findUnique: databaseMocks.clientFindUnique },
    legalCase: {
      findMany: databaseMocks.caseFindMany,
      count: databaseMocks.caseCount
    },
    appointment: {
      findMany: databaseMocks.appointmentFindMany,
      count: databaseMocks.appointmentCount
    },
    document: { count: databaseMocks.documentCount },
    payment: {
      findMany: databaseMocks.paymentFindMany,
      groupBy: databaseMocks.paymentGroupBy,
      findFirst: databaseMocks.paymentFindFirst
    },
    paymentAttempt: { findMany: databaseMocks.paymentAttemptFindMany }
  }
}));

import {
  getPortalDashboard,
  listPortalPaymentAttempts,
  listPortalPayments,
  ownVisiblePortalAppointmentWhere,
  portalDuePaymentWhere,
  portalVisibleAppointmentWhere,
  portalVisiblePaymentWhere,
} from "@/server/portal/client-portal-service";
import {
  PORTAL_DUE_PAYMENT_STATUSES,
  PORTAL_VISIBLE_PAYMENT_STATUSES,
  isPortalDuePaymentStatus,
  isPortalVisiblePaymentStatus
} from "@/lib/portal-visibility";

const clientPrincipal: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: "Client",
  permissions: ["client.read.self", "case.read.own", "payment.read.own"],
  clientId: "22222222-2222-4222-8222-222222222222"
};

describe("client portal visibility and aggregate contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseMocks.clientFindUnique.mockResolvedValue({ id: clientPrincipal.clientId, fullName: "Client" });
    databaseMocks.caseFindMany.mockResolvedValue([]);
    databaseMocks.caseCount.mockResolvedValue(12);
    databaseMocks.appointmentFindMany.mockResolvedValue([]);
    databaseMocks.appointmentCount.mockResolvedValue(8);
    databaseMocks.documentCount.mockResolvedValue(4);
    databaseMocks.paymentFindMany.mockResolvedValue([]);
    databaseMocks.paymentGroupBy.mockResolvedValue([
      { currency: "EGP", _sum: { amount: { toString: () => "1250.50" } } },
      { currency: "USD", _sum: { amount: { toString: () => "20.00" } } }
    ]);
    databaseMocks.paymentFindFirst.mockResolvedValue({
      id: "payment-next",
      invoiceNumber: "INV-9",
      amount: { toString: () => "20.00" },
      currency: "USD",
      status: "PENDING"
    });
    databaseMocks.paymentAttemptFindMany.mockResolvedValue([]);
  });

  it("centralizes portal-only appointment and payment visibility", () => {
    expect(portalVisibleAppointmentWhere()).toEqual({
      type: { notIn: ["INTERNAL_MEETING"] }
    });
    expect(ownVisiblePortalAppointmentWhere(clientPrincipal)).toEqual({
      clientId: clientPrincipal.clientId,
      type: { notIn: ["INTERNAL_MEETING"] },
      OR: [{ caseId: null }, { case: { deletedAt: null } }]
    });
    expect(portalVisiblePaymentWhere(clientPrincipal.clientId!)).toEqual({
      clientId: clientPrincipal.clientId,
      status: { in: PORTAL_VISIBLE_PAYMENT_STATUSES }
    });
    expect(portalDuePaymentWhere(clientPrincipal.clientId!)).toEqual({
      clientId: clientPrincipal.clientId,
      status: { in: PORTAL_DUE_PAYMENT_STATUSES }
    });
    expect(isPortalDuePaymentStatus("ISSUED")).toBe(true);
    expect(isPortalDuePaymentStatus("DRAFT")).toBe(false);
    expect(isPortalDuePaymentStatus("PAID")).toBe(false);
    expect(isPortalVisiblePaymentStatus("DRAFT")).toBe(false);
    expect(isPortalVisiblePaymentStatus("ISSUED")).toBe(true);
  });

  it("keeps five-row previews separate from full counts and currency aggregates", async () => {
    const result = await getPortalDashboard(clientPrincipal);

    expect(result.casesCount).toBe(12);
    expect(result.appointmentsCount).toBe(8);
    expect(result.dueBalances.map((balance) => [balance.currency, balance.amount.toString()])).toEqual([
      ["EGP", "1250.50"],
      ["USD", "20.00"]
    ]);
    expect(result.nextDuePayment?.id).toBe("payment-next");
    expect(databaseMocks.caseFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    expect(databaseMocks.caseCount).toHaveBeenCalledWith({
      where: { clientId: clientPrincipal.clientId, deletedAt: null }
    });
    expect(databaseMocks.appointmentFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
    expect(databaseMocks.appointmentCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          expect.objectContaining({ type: { notIn: ["INTERNAL_MEETING"] } })
        ])
      })
    });
    expect(databaseMocks.paymentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 5,
      where: portalVisiblePaymentWhere(clientPrincipal.clientId!)
    }));
    expect(databaseMocks.paymentGroupBy).toHaveBeenCalledWith({
      by: ["currency"],
      where: portalDuePaymentWhere(clientPrincipal.clientId!),
      _sum: { amount: true },
      orderBy: { currency: "asc" }
    });
    expect(databaseMocks.paymentFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: portalDuePaymentWhere(clientPrincipal.clientId!)
    }));
  });

  it("never returns draft invoices in the portal payment list", async () => {
    await listPortalPayments(clientPrincipal);

    expect(databaseMocks.paymentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: portalVisiblePaymentWhere(clientPrincipal.clientId!)
    }));
  });

  it("keeps booking attempts visible while stripping a linked draft invoice", async () => {
    databaseMocks.paymentAttemptFindMany.mockResolvedValueOnce([
      { id: "attempt-draft", payment: { id: "draft", status: "DRAFT", invoiceNumber: "DRAFT-1" } },
      { id: "attempt-issued", payment: { id: "issued", status: "ISSUED", invoiceNumber: "INV-1" } },
      { id: "attempt-unlinked", payment: null }
    ]);

    const attempts = await listPortalPaymentAttempts(clientPrincipal);

    expect(databaseMocks.paymentAttemptFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { clientId: clientPrincipal.clientId, appointment: ownVisiblePortalAppointmentWhere(clientPrincipal) }
    }));
    expect(attempts.map((attempt) => attempt.payment?.id ?? null)).toEqual([null, "issued", null]);
  });

});
