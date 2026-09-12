-- Existing attempts deliberately remain unbound. Never backfill from unsigned callbacks.
ALTER TABLE "payment_attempts" ADD COLUMN "providerOrderId" TEXT;
CREATE UNIQUE INDEX "payment_attempts_provider_providerOrderId_key" ON "payment_attempts"("provider", "providerOrderId");
