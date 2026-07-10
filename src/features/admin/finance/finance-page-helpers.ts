import type { PricingRuleValue } from "./finance-forms";

export type FinanceSearchParams = Record<string, string | string[] | undefined>;

export function flattenSearchParams(searchParams: FinanceSearchParams) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value ?? ""])
  );
}

export function statusTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (status === "OVERDUE") return "danger" as const;
  if (status === "CANCELLED") return "closed" as const;
  return status === "DRAFT" ? ("neutral" as const) : ("pending" as const);
}

export function attemptTone(status: string) {
  if (status === "PAID") return "active" as const;
  if (["FAILED", "EXPIRED", "CANCELLED", "DISPUTED"].includes(status)) return "danger" as const;
  if (status === "REFUNDED") return "closed" as const;
  return "pending" as const;
}

export function webhookTone(status: string) {
  if (status === "PROCESSED") return "active" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "IGNORED") return "neutral" as const;
  return "pending" as const;
}

export function webhookMoneyTone(status: string) {
  if (status === "MATCHED") return "active" as const;
  if (status === "NOT_PAID") return "neutral" as const;
  if (status === "MISSING_ATTEMPT") return "danger" as const;
  return status.includes("MISMATCH") || status === "NEEDS_REVIEW" ? ("danger" as const) : ("pending" as const);
}

export function operationalFilterHref(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.delete("page");
  return params.toString() ? `/admin/finance?${params.toString()}` : "/admin/finance";
}

export function operationsPageHref(query: Record<string, string>, key: "attemptPage" | "webhookPage", page: number) {
  const params = new URLSearchParams(query);
  params.set(key, String(page));
  return `/admin/finance?${params.toString()}`;
}

export function listHref(filters: Record<string, string | number | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, String(value));
  params.set("page", String(page));
  return `/admin/finance?${params.toString()}`;
}

export function exportHref(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  for (const key of ["page", "pageSize", "editPaymentId", "editPricingRuleId"]) params.delete(key);
  const queryString = params.toString();
  return queryString ? `/api/admin/finance/export?${queryString}` : "/api/admin/finance/export";
}

export function editHref(paymentId: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.set("editPaymentId", paymentId);
  return `/admin/finance?${params.toString()}`;
}

export function pricingRuleEditHref(ruleId: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  params.set("editPricingRuleId", ruleId);
  return `/admin/finance?${params.toString()}`;
}

export function paymentFormValue(payment: {
  id: string;
  invoiceNumber: string;
  clientId: string;
  caseId: string | null;
  issueDate: Date;
  dueDate: Date | null;
  amount: { toString(): string };
  currency: string;
  status: string;
  paymentMethod: string | null;
  receiptNumber: string | null;
  paidAt: Date | null;
  notes: string | null;
}) {
  return {
    id: payment.id,
    invoiceNumber: payment.invoiceNumber,
    clientId: payment.clientId,
    caseId: payment.caseId,
    issueDate: payment.issueDate.toISOString(),
    dueDate: payment.dueDate?.toISOString() ?? null,
    amount: payment.amount.toString(),
    currency: payment.currency,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    receiptNumber: payment.receiptNumber,
    paidAt: payment.paidAt?.toISOString() ?? null,
    notes: payment.notes
  };
}

export function pricingRuleFormValue(rule: {
  id: string;
  serviceCategory: string | null;
  mode: string | null;
  amount: { toString(): string };
  currency: string;
  active: boolean;
  effectiveFrom: Date;
  version: number;
  label: string | null;
}): PricingRuleValue {
  return {
    id: rule.id,
    serviceCategory: rule.serviceCategory,
    mode: rule.mode,
    amount: rule.amount.toString(),
    currency: rule.currency,
    active: rule.active,
    effectiveFrom: rule.effectiveFrom.toISOString(),
    version: rule.version,
    label: rule.label
  };
}
