-- PLAN-39 durably preserves the confirmed public booking language so delayed
-- payment and account setup use the original trusted choice. Existing rows are
-- intentionally backfilled to Arabic, matching the platform's legacy behavior.

ALTER TABLE "consultation_requests"
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ar';

ALTER TABLE "consultation_requests"
  ADD CONSTRAINT "consultation_requests_locale_check"
  CHECK ("locale" IN ('ar', 'en'));

-- Rollback policy: restore the previous application release and retain this
-- additive field. Do not drop the column or its historical values on rollback.
