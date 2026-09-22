export const PORTAL_VISIBLE_PAYMENT_STATUSES = [
  "ISSUED",
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELLED"
] as const;

export const PORTAL_DUE_PAYMENT_STATUSES = ["ISSUED", "PENDING", "OVERDUE"] as const;

export const PORTAL_HIDDEN_APPOINTMENT_TYPES = ["INTERNAL_MEETING"] as const;

export function isPortalVisiblePaymentStatus(status: string) {
  return (PORTAL_VISIBLE_PAYMENT_STATUSES as readonly string[]).includes(status);
}

export function isPortalDuePaymentStatus(status: string) {
  return (PORTAL_DUE_PAYMENT_STATUSES as readonly string[]).includes(status);
}
