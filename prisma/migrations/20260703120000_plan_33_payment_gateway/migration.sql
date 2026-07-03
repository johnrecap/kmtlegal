ALTER TYPE "ConsultationStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "AppointmentStatus" ADD VALUE 'RESERVED';

CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'DISPUTED', 'CANCELLED');
CREATE TYPE "PaymentWebhookSignatureStatus" AS ENUM ('VERIFIED', 'UNVERIFIED', 'INVALID');
CREATE TYPE "PaymentWebhookProcessingStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED');

ALTER TABLE "payments" ADD COLUMN "consultationRequestId" UUID;
ALTER TABLE "payments" ADD COLUMN "appointmentId" UUID;
ALTER TABLE "payments" ADD COLUMN "paymentAttemptId" UUID;
ALTER TABLE "payments" ALTER COLUMN "createdById" DROP NOT NULL;

CREATE TABLE "consultation_pricing_rules" (
    "id" UUID NOT NULL,
    "serviceCategory" TEXT,
    "mode" "ConsultationMode",
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'paytabs',
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "clientId" UUID NOT NULL,
    "consultationRequestId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "pricingRuleId" UUID,
    "priceVersion" INTEGER NOT NULL,
    "serviceCategory" TEXT NOT NULL,
    "mode" "ConsultationMode" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "checkoutUrl" TEXT,
    "providerSessionId" TEXT,
    "providerPaymentId" TEXT,
    "manualMethod" TEXT,
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "rawStatus" TEXT,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "settlementStatus" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attemptId" UUID,
    "transactionId" UUID,
    "signatureStatus" "PaymentWebhookSignatureStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "processingStatus" "PaymentWebhookProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "replayCount" INTEGER NOT NULL DEFAULT 0,
    "payloadHash" TEXT NOT NULL,
    "normalizedPayload" JSONB,
    "errorCode" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_paymentAttemptId_key" ON "payments"("paymentAttemptId");
CREATE INDEX "payments_consultationRequestId_idx" ON "payments"("consultationRequestId");
CREATE INDEX "payments_appointmentId_idx" ON "payments"("appointmentId");

CREATE INDEX "consultation_pricing_rules_serviceCategory_idx" ON "consultation_pricing_rules"("serviceCategory");
CREATE INDEX "consultation_pricing_rules_mode_idx" ON "consultation_pricing_rules"("mode");
CREATE INDEX "consultation_pricing_rules_active_effectiveFrom_idx" ON "consultation_pricing_rules"("active", "effectiveFrom");
CREATE INDEX "consultation_pricing_rules_updatedById_idx" ON "consultation_pricing_rules"("updatedById");

CREATE UNIQUE INDEX "payment_attempts_idempotencyKey_key" ON "payment_attempts"("idempotencyKey");
CREATE INDEX "payment_attempts_provider_idx" ON "payment_attempts"("provider");
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts"("status");
CREATE INDEX "payment_attempts_clientId_idx" ON "payment_attempts"("clientId");
CREATE INDEX "payment_attempts_consultationRequestId_idx" ON "payment_attempts"("consultationRequestId");
CREATE INDEX "payment_attempts_appointmentId_idx" ON "payment_attempts"("appointmentId");
CREATE INDEX "payment_attempts_pricingRuleId_idx" ON "payment_attempts"("pricingRuleId");
CREATE INDEX "payment_attempts_startsAt_endsAt_idx" ON "payment_attempts"("startsAt", "endsAt");
CREATE INDEX "payment_attempts_expiresAt_idx" ON "payment_attempts"("expiresAt");

CREATE UNIQUE INDEX "payment_transactions_provider_providerTransactionId_key" ON "payment_transactions"("provider", "providerTransactionId");
CREATE INDEX "payment_transactions_attemptId_idx" ON "payment_transactions"("attemptId");
CREATE INDEX "payment_transactions_status_idx" ON "payment_transactions"("status");
CREATE INDEX "payment_transactions_settlementStatus_idx" ON "payment_transactions"("settlementStatus");

CREATE UNIQUE INDEX "payment_webhook_events_provider_eventId_key" ON "payment_webhook_events"("provider", "eventId");
CREATE INDEX "payment_webhook_events_attemptId_idx" ON "payment_webhook_events"("attemptId");
CREATE INDEX "payment_webhook_events_transactionId_idx" ON "payment_webhook_events"("transactionId");
CREATE INDEX "payment_webhook_events_signatureStatus_idx" ON "payment_webhook_events"("signatureStatus");
CREATE INDEX "payment_webhook_events_processingStatus_idx" ON "payment_webhook_events"("processingStatus");
CREATE INDEX "payment_webhook_events_receivedAt_idx" ON "payment_webhook_events"("receivedAt");

ALTER TABLE "payments" DROP CONSTRAINT "payments_createdById_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "consultation_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "consultation_pricing_rules" ADD CONSTRAINT "consultation_pricing_rules_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "consultation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "consultation_pricing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "payment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
