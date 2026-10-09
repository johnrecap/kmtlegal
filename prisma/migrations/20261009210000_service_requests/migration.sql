CREATE TABLE "health_questionnaires" (
 "id" UUID PRIMARY KEY, "version" INTEGER NOT NULL UNIQUE, "questions" JSONB NOT NULL,
 "approvedById" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
 "approvedAt" TIMESTAMP(3), "published" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "questionnaire_publication_approval" CHECK (NOT "published" OR ("approvedById" IS NOT NULL AND "approvedAt" IS NOT NULL))
);
CREATE TABLE "service_requests" (
 "id" UUID PRIMARY KEY, "reference" TEXT NOT NULL UNIQUE,
 "clientId" UUID NOT NULL REFERENCES "clients"("id") ON DELETE RESTRICT,
 "assignedLawyerId" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
 "paymentId" UUID UNIQUE REFERENCES "payments"("id") ON DELETE RESTRICT,
 "kind" TEXT NOT NULL CHECK ("kind" IN ('CONTRACT_DRAFT','CONTRACT_REVIEW','HEALTH_CHECK')),
 "locale" TEXT NOT NULL CHECK ("locale" IN ('ar','en')),
 "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT','RECEIVED','NEEDS_INFORMATION','AWAITING_ACCEPTANCE','IN_PROGRESS','READY','COMPLETED','CANCELLED')),
 "intake" JSONB NOT NULL, "questionnaireId" UUID REFERENCES "health_questionnaires"("id") ON DELETE RESTRICT,
 "quote" JSONB, "quoteVersion" INTEGER NOT NULL DEFAULT 0, "acceptedQuoteVersion" INTEGER,
 "revision" INTEGER NOT NULL DEFAULT 0, "idempotencyKey" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 UNIQUE ("clientId", "idempotencyKey")
);
CREATE INDEX "service_requests_status_createdAt_idx" ON "service_requests"("status", "createdAt");
CREATE INDEX "service_requests_assignedLawyerId_idx" ON "service_requests"("assignedLawyerId");
CREATE TABLE "service_request_events" (
 "id" UUID PRIMARY KEY, "requestId" UUID NOT NULL REFERENCES "service_requests"("id") ON DELETE RESTRICT,
 "actorId" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
 "action" TEXT NOT NULL, "body" TEXT, "internal" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "service_request_events_requestId_createdAt_idx" ON "service_request_events"("requestId", "createdAt");
ALTER TABLE "documents" ADD COLUMN "serviceRequestId" UUID REFERENCES "service_requests"("id") ON DELETE RESTRICT;
ALTER TABLE "documents" ADD COLUMN "deliveryVersion" INTEGER CHECK ("deliveryVersion" > 0);
CREATE UNIQUE INDEX "documents_serviceRequestId_deliveryVersion_key" ON "documents"("serviceRequestId", "deliveryVersion");
