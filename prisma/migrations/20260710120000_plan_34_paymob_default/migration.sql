ALTER TABLE "payment_attempts" ALTER COLUMN "provider" SET DEFAULT 'paymob';

UPDATE "system_settings"
SET
  "value" = jsonb_set("value", '{activeProvider}', '"paymob"'::jsonb, true),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "key" = 'payment.gateway'
  AND COALESCE("value" ->> 'activeProvider', 'paytabs') = 'paytabs';
