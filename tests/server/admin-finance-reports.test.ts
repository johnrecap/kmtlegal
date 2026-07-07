import { describe, expect, it } from "vitest";
import {
  adminPaymentListQuerySchema,
  adminPaymentWriteSchema,
  adminReportQuerySchema,
  canManageAdminFinance,
  canReadAdminFinance,
  canReadAdminReports,
  financeReportDateRange,
  formatAdminInvoiceNumber,
  isGatewayManagedPaymentMethod,
  nextAdminInvoiceNumberFromExisting
} from "@/server/admin/finance-report-service";
import { ROLES, type Principal } from "@/server/auth/policy";
import { ApiError } from "@/server/http/errors";

const financeManager: Principal = {
  id: "11111111-1111-4111-8111-111111111111",
  roleName: ROLES.officeAdmin,
  permissions: ["finance.manage.any"]
};

const financeReader: Principal = {
  id: "22222222-2222-4222-8222-222222222222",
  roleName: ROLES.officeAdmin,
  permissions: ["finance.read.any"]
};

const reportReader: Principal = {
  id: "33333333-3333-4333-8333-333333333333",
  roleName: ROLES.officeAdmin,
  permissions: ["report.read.any"]
};

const lawyer: Principal = {
  id: "44444444-4444-4444-8444-444444444444",
  roleName: ROLES.lawyer,
  permissions: ["case.read.assigned"]
};

describe("admin finance and reports contract", () => {
  it("keeps finance management, finance read, and reports behind separate permissions", () => {
    expect(canReadAdminFinance(financeManager)).toBe(true);
    expect(canManageAdminFinance(financeManager)).toBe(true);
    expect(canReadAdminReports(financeManager)).toBe(false);

    expect(canReadAdminFinance(financeReader)).toBe(true);
    expect(canManageAdminFinance(financeReader)).toBe(false);

    expect(canReadAdminReports(reportReader)).toBe(true);
    expect(canReadAdminFinance(reportReader)).toBe(false);

    expect(canReadAdminFinance(lawyer)).toBe(false);
    expect(canManageAdminFinance(lawyer)).toBe(false);
    expect(canReadAdminReports(lawyer)).toBe(false);
  });

  it("validates invoice fields and rejects non-MVP accounting fields", () => {
    const input = {
      clientId: "55555555-5555-4555-8555-555555555555",
      caseId: "",
      issueDate: "2026-06-24",
      dueDate: "2026-07-01",
      amount: "4500.259",
      currency: "EGP",
      status: "ISSUED",
      paymentMethod: "",
      receiptNumber: "",
      paidAt: "",
      notes: "Manual MVP invoice"
    };
    const payload = adminPaymentWriteSchema.parse(input);

    expect(payload.invoiceNumber).toBe("");
    expect(payload.amount).toBe(4500.26);
    expect(payload.status).toBe("ISSUED");
    expect(payload.caseId).toBe("");
    expect(adminPaymentWriteSchema.parse({ ...input, invoiceNumber: "INV-2026-0002" }).invoiceNumber).toBe("INV-2026-0002");

    expect(() =>
      adminPaymentWriteSchema.parse({
        ...payload,
        taxAmount: 630,
        lineItems: [{ label: "Legal services", amount: 4500 }]
      })
    ).toThrow();
    expect(() => adminPaymentWriteSchema.parse({ ...input, invoiceNumber: "INV 2026 0002" })).toThrow();
    expect(() => adminPaymentWriteSchema.parse({ ...input, currency: "GBP" })).toThrow();
    expect(() => adminPaymentWriteSchema.parse({ ...input, amount: "0" })).toThrow();
  });

  it("separates manual finance payments from gateway-managed payment methods", () => {
    expect(isGatewayManagedPaymentMethod("Paymob")).toBe(true);
    expect(isGatewayManagedPaymentMethod("paytabs hosted checkout")).toBe(true);
    expect(isGatewayManagedPaymentMethod("trusted webhook")).toBe(true);
    expect(isGatewayManagedPaymentMethod("Instapay")).toBe(false);
    expect(isGatewayManagedPaymentMethod("Bank transfer")).toBe(false);
  });

  it("formats generated invoice numbers from the issue-date year", () => {
    expect(formatAdminInvoiceNumber(2026, 1)).toBe("INV-2026-0001");
    expect(formatAdminInvoiceNumber(2026, 12)).toBe("INV-2026-0012");
    expect(nextAdminInvoiceNumberFromExisting(2026, ["INV-2026-0001", "INV-2026-0012", "INV-2025-9999", "MANUAL-7"])).toBe(
      "INV-2026-0013"
    );
  });

  it("bounds finance list and report filters", () => {
    const listQuery = adminPaymentListQuerySchema.parse({
      q: "INV",
      status: "PAID",
      currency: "EGP",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      sortBy: "amount",
      sortDirection: "asc",
      page: "2",
      pageSize: "50"
    });

    expect(listQuery.page).toBe(2);
    expect(listQuery.pageSize).toBe(50);
    expect(listQuery.currency).toBe("EGP");
    expect(() => adminPaymentListQuerySchema.parse({ pageSize: "500" })).toThrow();

    const reportQuery = adminReportQuerySchema.parse({
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      currency: "USD"
    });

    expect(reportQuery.currency).toBe("USD");
    expect(() => adminReportQuerySchema.parse({ currency: "GBP" })).toThrow();
  });

  it("normalizes report date ranges and rejects inverted ranges", () => {
    const range = financeReportDateRange({ dateFrom: "2026-06-01", dateTo: "2026-06-30" });
    expect(range.from).toBeInstanceOf(Date);
    expect(range.to).toBeInstanceOf(Date);

    try {
      financeReportDateRange({ dateFrom: "2026-07-01", dateTo: "2026-06-01" });
      throw new Error("expected inverted range failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });
});
