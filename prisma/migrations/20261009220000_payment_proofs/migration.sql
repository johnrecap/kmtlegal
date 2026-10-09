ALTER TABLE "documents" ADD COLUMN "paymentId" UUID REFERENCES "payments"("id") ON DELETE RESTRICT;
CREATE INDEX "documents_paymentId_idx" ON "documents"("paymentId");
