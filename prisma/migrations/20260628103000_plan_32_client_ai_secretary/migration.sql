ALTER TABLE "audit_logs" ADD COLUMN "clientId" UUID;
ALTER TABLE "audit_logs" ADD COLUMN "caseId" UUID;
ALTER TABLE "audit_logs" ADD COLUMN "lawyerId" UUID;
ALTER TABLE "audit_logs" ADD COLUMN "appointmentId" UUID;
ALTER TABLE "audit_logs" ADD COLUMN "documentId" UUID;
ALTER TABLE "audit_logs" ADD COLUMN "paymentId" UUID;

CREATE INDEX "audit_logs_clientId_idx" ON "audit_logs"("clientId");
CREATE INDEX "audit_logs_caseId_idx" ON "audit_logs"("caseId");
CREATE INDEX "audit_logs_lawyerId_idx" ON "audit_logs"("lawyerId");
CREATE INDEX "audit_logs_appointmentId_idx" ON "audit_logs"("appointmentId");
CREATE INDEX "audit_logs_documentId_idx" ON "audit_logs"("documentId");
CREATE INDEX "audit_logs_paymentId_idx" ON "audit_logs"("paymentId");
