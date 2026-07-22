-- PLAN-36 adds a consultation outcome lifecycle without replacing the existing
-- consultation or appointment status dimensions. Historical reconciliation is
-- intentionally performed by the idempotent maintenance command after deploy so
-- every actual transition can share the application audit and notification rules.

CREATE TYPE "ConsultationOutcomeStatus" AS ENUM (
  'PENDING',
  'AWAITING_RESULT',
  'MISSED',
  'SUCCESSFUL',
  'NO_SHOW',
  'CANCELLED'
);

ALTER TABLE "consultation_requests"
  ADD COLUMN "outcomeStatus" "ConsultationOutcomeStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "outcomeAt" TIMESTAMP(3),
  ADD COLUMN "outcomeById" UUID,
  ADD COLUMN "outcomeReasonCode" TEXT,
  ADD COLUMN "outcomeNote" TEXT,
  ADD COLUMN "outcomeVersion" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "consultation_requests_outcomeStatus_createdAt_idx"
  ON "consultation_requests"("outcomeStatus", "createdAt");

CREATE INDEX "consultation_requests_outcomeById_idx"
  ON "consultation_requests"("outcomeById");

CREATE INDEX "appointments_consultationRequestId_type_caseId_startsAt_idx"
  ON "appointments"("consultationRequestId", "type", "caseId", "startsAt");

CREATE INDEX "appointments_type_caseId_endsAt_consultationRequestId_idx"
  ON "appointments"("type", "caseId", "endsAt", "consultationRequestId");

ALTER TABLE "consultation_requests"
  ADD CONSTRAINT "consultation_requests_outcomeById_fkey"
  FOREIGN KEY ("outcomeById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Rollback policy: restore the previous application release and retain these
-- additive columns, indexes, enum values, and any outcomes recorded after deploy.
-- Do not drop PLAN-36 data during an application rollback.
