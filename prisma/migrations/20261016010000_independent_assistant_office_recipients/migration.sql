ALTER TABLE "assistant_sessions"
  ADD COLUMN "officePhone" TEXT,
  ADD COLUMN "officeContactChannel" TEXT,
  ADD COLUMN "officeContactConsentedAt" TIMESTAMP(3),
  ADD CONSTRAINT "assistant_office_contact_consistency" CHECK (
    ("officePhone" IS NULL AND "officeContactChannel" IS NULL AND "officeContactConsentedAt" IS NULL)
    OR ("officePhone" IS NOT NULL AND "officeContactChannel" IS NOT NULL AND "officeContactChannel" IN ('PHONE', 'WHATSAPP') AND "officeContactConsentedAt" IS NOT NULL)
  );

ALTER TABLE "assistant_turns" ADD COLUMN "recipient" TEXT NOT NULL DEFAULT 'ASSISTANT';
ALTER TABLE "assistant_turns" ADD CONSTRAINT "assistant_turn_recipient" CHECK ("recipient" IN ('ASSISTANT', 'OFFICE'));
UPDATE "assistant_turns" SET "recipient" = 'OFFICE' WHERE "status" = 'HUMAN';

ALTER TABLE "conversation_messages" ADD COLUMN "recipient" TEXT;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_message_recipient" CHECK ("recipient" IS NULL OR "recipient" IN ('ASSISTANT', 'OFFICE'));

-- Match the existing stable transcript UUIDs without changing message bodies or IDs.
WITH source AS (
  SELECT "recipient", encode(sha256(convert_to('kmt-transcript:' || id::text || ':user', 'UTF8')), 'hex') AS hex
  FROM "assistant_turns"
), mapped AS (
  SELECT "recipient", (substr(hex,1,8) || '-' || substr(hex,9,4) || '-4' || substr(hex,14,3) || '-a' || substr(hex,18,3) || '-' || substr(hex,21,12))::uuid AS id
  FROM source
)
UPDATE "conversation_messages" m SET "recipient" = mapped."recipient" FROM mapped WHERE m.id = mapped.id;
