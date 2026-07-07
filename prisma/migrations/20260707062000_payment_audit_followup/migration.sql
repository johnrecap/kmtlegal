ALTER TABLE "payment_webhook_events" ADD COLUMN "payloadSnapshot" JSONB;

DO $$
BEGIN
  IF EXISTS (
    SELECT lower(btrim("receiptNumber"))
    FROM "payments"
    WHERE "status" = 'PAID'
      AND "paymentAttemptId" IS NULL
      AND "receiptNumber" IS NOT NULL
      AND btrim("receiptNumber") <> ''
    GROUP BY lower(btrim("receiptNumber"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate paid manual payment receipt numbers exist. Resolve duplicates before applying payment audit follow-up migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "payments_manual_paid_receipt_number_unique_idx"
  ON "payments" (lower(btrim("receiptNumber")))
  WHERE "status" = 'PAID'
    AND "paymentAttemptId" IS NULL
    AND "receiptNumber" IS NOT NULL
    AND btrim("receiptNumber") <> '';
