-- Preserve the four internal categories and historical records.
ALTER TABLE "consultation_requests" ADD COLUMN "publicServiceSlug" TEXT;
