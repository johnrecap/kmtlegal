-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'REVIEWED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN "phoneCanonical" TEXT;

-- AlterTable
ALTER TABLE "consultation_requests" ADD COLUMN "phoneCanonical" TEXT;

-- Backfill canonical phone values for existing rows using a conservative digits-only form.
WITH normalized AS (
  SELECT
    "id",
    CASE
      WHEN regexp_replace("phone", '[^0-9]+', '', 'g') LIKE '00%' THEN substr(regexp_replace("phone", '[^0-9]+', '', 'g'), 3)
      ELSE regexp_replace("phone", '[^0-9]+', '', 'g')
    END AS digits
  FROM "clients"
  WHERE "phone" IS NOT NULL
)
UPDATE "clients" client_row
SET "phoneCanonical" = NULLIF(
  CASE
    WHEN normalized.digits ~ '^01[0-9]{9}$' THEN '20' || substr(normalized.digits, 2)
    ELSE normalized.digits
  END,
  ''
)
FROM normalized
WHERE client_row."id" = normalized."id";

WITH normalized AS (
  SELECT
    "id",
    CASE
      WHEN regexp_replace("phone", '[^0-9]+', '', 'g') LIKE '00%' THEN substr(regexp_replace("phone", '[^0-9]+', '', 'g'), 3)
      ELSE regexp_replace("phone", '[^0-9]+', '', 'g')
    END AS digits
  FROM "consultation_requests"
  WHERE "phone" IS NOT NULL
)
UPDATE "consultation_requests" consultation_row
SET "phoneCanonical" = NULLIF(
  CASE
    WHEN normalized.digits ~ '^01[0-9]{9}$' THEN '20' || substr(normalized.digits, 2)
    ELSE normalized.digits
  END,
  ''
)
FROM normalized
WHERE consultation_row."id" = normalized."id";

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "phoneCanonical" TEXT,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_phoneCanonical_idx" ON "clients"("phoneCanonical");

-- CreateIndex
CREATE INDEX "consultation_requests_phoneCanonical_idx" ON "consultation_requests"("phoneCanonical");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_topic_idx" ON "contact_messages"("topic");

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");

-- CreateIndex
CREATE INDEX "contact_messages_phoneCanonical_idx" ON "contact_messages"("phoneCanonical");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE INDEX "contact_messages_reviewedById_idx" ON "contact_messages"("reviewedById");

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bootstrap new permissions because update deploys do not run seed.
INSERT INTO "permissions" ("id", "key", "createdAt")
VALUES
  ('6f1b59a7-0e4c-4b0d-8b43-f21ce6d5b5de', 'contact.read.any', CURRENT_TIMESTAMP),
  ('ec1cfc87-8f6e-4b5c-9b42-4f1d9eb9b837', 'contact.manage.any', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT role_row."id", permission_row."id", CURRENT_TIMESTAMP
FROM "roles" role_row
JOIN "permissions" permission_row ON permission_row."key" IN ('contact.read.any', 'contact.manage.any')
WHERE role_row."name" IN ('Office Admin', 'Super Admin')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
