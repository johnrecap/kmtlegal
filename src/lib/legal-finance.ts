export const paymentStatusValues = ["DRAFT", "ISSUED", "PENDING", "PAID", "OVERDUE", "CANCELLED"] as const;
export const currencyValues = ["EGP", "USD", "EUR", "SAR", "AED"] as const;
export const financialReviewCodes = ["PAYMENT_REVERSAL_REVIEW_REQUIRED", "PAYMENT_COLLECTION_REVIEW_REQUIRED"];
type ReviewAttempt = {failureCode?: string | null; provider?: string; providerOrderId?: string | null; checkoutUrl?: string | null; status?: string};
export function paymentNeedsOrderVerification(attempt?: ReviewAttempt | null) {
  return Boolean(attempt?.provider === "paymob" && !attempt.providerOrderId && attempt.checkoutUrl && attempt.status !== "PAID");
}
export function paymentRequiresReview(attempt?: ReviewAttempt | null) {
  return Boolean(attempt?.failureCode && financialReviewCodes.includes(attempt.failureCode)) || paymentNeedsOrderVerification(attempt);
}
