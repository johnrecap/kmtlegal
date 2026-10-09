ALTER TABLE "payments" ADD COLUMN "ledgerReviewRequired" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "payment_entries" (
  "id" UUID NOT NULL,
  "paymentId" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" "Currency" NOT NULL,
  "method" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "approvedById" UUID,
  "idempotencyKey" TEXT NOT NULL,
  "externalReference" TEXT,
  "reversesEntryId" UUID,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_entries_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_entries_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "payment_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payment_entries_kind_check" CHECK ("kind" IN ('SETTLEMENT', 'REFUND', 'REVERSAL', 'LEGACY')),
  CONSTRAINT "payment_entries_amount_check" CHECK ("amount" <> 0 AND ("kind" NOT IN ('SETTLEMENT', 'LEGACY') OR "amount" > 0) AND ("kind" <> 'REFUND' OR "amount" < 0))
);
CREATE UNIQUE INDEX "payment_entries_paymentId_idempotencyKey_key" ON "payment_entries"("paymentId", "idempotencyKey");
CREATE UNIQUE INDEX "payment_entries_externalReference_key" ON "payment_entries"("externalReference");
CREATE UNIQUE INDEX "payment_entries_reversesEntryId_key" ON "payment_entries"("reversesEntryId");
CREATE INDEX "payment_entries_paymentId_occurredAt_idx" ON "payment_entries"("paymentId", "occurredAt");
CREATE INDEX "payment_entries_approvedById_idx" ON "payment_entries"("approvedById");

-- Preserve ambiguous historical records and flag them; never invent a settlement for conflicting provider evidence.
UPDATE "payments" p SET "ledgerReviewRequired" = true
WHERE p.status = 'PAID' AND (p.amount <= 0 OR EXISTS (
  SELECT 1 FROM "payment_attempts" a WHERE a.id = p."paymentAttemptId" AND
    (a.status <> 'PAID' OR a.amount <> p.amount OR a.currency <> p.currency OR a."failureCode" IN ('PAYMENT_REVERSAL_REVIEW_REQUIRED', 'PAYMENT_COLLECTION_REVIEW_REQUIRED'))
));
UPDATE "payments" p SET "ledgerReviewRequired" = true
WHERE p.status = 'PAID' AND p."receiptNumber" IS NOT NULL AND EXISTS (
  SELECT 1 FROM "payments" other WHERE other.id <> p.id AND other.status = 'PAID'
    AND other."receiptNumber" = p."receiptNumber" AND other.currency = p.currency
    AND COALESCE(other."paymentMethod", 'MANUAL') = COALESCE(p."paymentMethod", 'MANUAL')
);
INSERT INTO "payment_entries" ("id", "paymentId", "kind", "amount", "currency", "method", "receiptNumber", "occurredAt", "approvedById", "idempotencyKey", "externalReference", "reason")
SELECT gen_random_uuid(), p.id, 'LEGACY', p.amount, p.currency, COALESCE(p."paymentMethod", 'MANUAL'), COALESCE(p."receiptNumber", p."invoiceNumber"), COALESCE(p."paidAt", p."updatedAt"), p."createdById", 'legacy-paid-v1', CASE WHEN p."paymentAttemptId" IS NOT NULL THEN 'gateway:' || p."paymentAttemptId"::text ELSE 'manual:' || p.currency::text || ':' || COALESCE(p."paymentMethod", 'MANUAL') || ':' || COALESCE(p."receiptNumber", p."invoiceNumber") END, 'Imported from historical PAID invoice; not counted again.'
FROM "payments" p WHERE p.status = 'PAID' AND NOT p."ledgerReviewRequired";

CREATE FUNCTION kmt_keep_payment_entries_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Payment entries are append-only; record a correction instead'; END;
$$;
CREATE TRIGGER payment_entries_immutable BEFORE UPDATE OR DELETE ON "payment_entries"
FOR EACH ROW EXECUTE FUNCTION kmt_keep_payment_entries_immutable();
