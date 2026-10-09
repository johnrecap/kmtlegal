ALTER TABLE "assistant_sessions" ADD COLUMN "handoffRequestedAt" TIMESTAMP(3);
ALTER TABLE "consultation_requests" ADD COLUMN "confirmationSource" TEXT NOT NULL DEFAULT 'STAFF_APPROVAL', ADD COLUMN "contactChannel" TEXT NOT NULL DEFAULT 'PHONE';
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_confirmation_source_check" CHECK ("confirmationSource" IN ('STAFF_APPROVAL','PUBLISHED_SLOT','CALLBACK_REQUEST'));
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_contact_channel_check" CHECK ("contactChannel" IN ('PHONE','WHATSAPP'));
CREATE TABLE "assistant_booking_actions" (
  "id" UUID NOT NULL, "sessionId" UUID NOT NULL, "key" UUID NOT NULL, "requestHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assistant_booking_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assistant_booking_actions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "assistant_booking_actions_sessionId_key_key" ON "assistant_booking_actions"("sessionId", "key");
