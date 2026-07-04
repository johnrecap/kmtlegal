ALTER TYPE "NotificationType" ADD VALUE 'CONSULTATION';

ALTER TABLE "consultation_requests" ADD COLUMN "secretaryReviewedAt" TIMESTAMP(3);
ALTER TABLE "consultation_requests" ADD COLUMN "secretaryReviewedById" UUID;
ALTER TABLE "consultation_requests" ADD COLUMN "secretaryReviewNote" TEXT;

ALTER TABLE "notifications" ADD COLUMN "resourceType" TEXT;
ALTER TABLE "notifications" ADD COLUMN "resourceId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "actionUrl" TEXT;

CREATE INDEX "consultation_requests_secretaryReviewedAt_idx" ON "consultation_requests"("secretaryReviewedAt");
CREATE INDEX "consultation_requests_secretaryReviewedById_idx" ON "consultation_requests"("secretaryReviewedById");
CREATE INDEX "notifications_resourceType_resourceId_idx" ON "notifications"("resourceType", "resourceId");
CREATE UNIQUE INDEX "notifications_userId_type_resourceType_resourceId_key" ON "notifications"("userId", "type", "resourceType", "resourceId");

ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_secretaryReviewedById_fkey" FOREIGN KEY ("secretaryReviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
