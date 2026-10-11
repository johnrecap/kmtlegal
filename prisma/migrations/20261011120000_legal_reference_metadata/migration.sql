-- Additive: existing articles retain type ARTICLE and are not AI approved.
ALTER TABLE "articles" ADD COLUMN "contentType" TEXT NOT NULL DEFAULT 'ARTICLE', ADD COLUMN "sourceTitle" TEXT, ADD COLUMN "sourceUrl" TEXT, ADD COLUMN "referenceNumber" TEXT, ADD COLUMN "referenceYear" INTEGER, ADD COLUMN "referenceDate" TIMESTAMP(3), ADD COLUMN "reviewedAt" TIMESTAMP(3), ADD COLUMN "reviewedById" UUID, ADD COLUMN "aiApproved" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "articles_contentType_status_referenceYear_idx" ON "articles"("contentType", "status", "referenceYear");
ALTER TABLE "articles" ADD CONSTRAINT "articles_contentType_check" CHECK ("contentType" IN ('ARTICLE','JUDGMENT','LEGISLATION'));
