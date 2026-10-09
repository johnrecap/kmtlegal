-- Additive: existing requests, appointments, sessions and financial records keep their state.
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "conversation_threads" ALTER COLUMN "clientId" DROP NOT NULL;
ALTER TABLE "consultation_requests" ADD COLUMN "requestedStartsAt" TIMESTAMP(3), ADD COLUMN "requestedEndsAt" TIMESTAMP(3), ADD COLUMN "publicReference" TEXT;
CREATE UNIQUE INDEX "consultation_requests_publicReference_key" ON "consultation_requests"("publicReference");

CREATE TABLE "assistant_sessions" (
  "id" UUID NOT NULL,
  "capabilityHash" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'ar',
  "clientId" UUID,
  "consultationRequestId" UUID,
  "conversationThreadId" UUID,
  "draft" JSONB NOT NULL DEFAULT '{}',
  "humanOwned" BOOLEAN NOT NULL DEFAULT false,
  "revision" INTEGER NOT NULL DEFAULT 0,
  "leaseId" UUID,
  "leaseExpiresAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assistant_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assistant_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "assistant_sessions_consultationRequestId_fkey" FOREIGN KEY ("consultationRequestId") REFERENCES "consultation_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "assistant_sessions_conversationThreadId_fkey" FOREIGN KEY ("conversationThreadId") REFERENCES "conversation_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "assistant_sessions_capabilityHash_key" ON "assistant_sessions"("capabilityHash");
CREATE UNIQUE INDEX "assistant_sessions_consultationRequestId_key" ON "assistant_sessions"("consultationRequestId");
CREATE UNIQUE INDEX "assistant_sessions_conversationThreadId_key" ON "assistant_sessions"("conversationThreadId");
CREATE INDEX "assistant_sessions_clientId_idx" ON "assistant_sessions"("clientId");
CREATE INDEX "assistant_sessions_humanOwned_updatedAt_idx" ON "assistant_sessions"("humanOwned", "updatedAt");
CREATE INDEX "assistant_sessions_expiresAt_idx" ON "assistant_sessions"("expiresAt");

CREATE TABLE "assistant_turns" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "userText" TEXT NOT NULL,
  "protocol" JSONB NOT NULL DEFAULT '[]',
  "assistantText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "assistant_turns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assistant_turns_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "assistant_turns_status_check" CHECK ("status" IN ('PENDING', 'COMPLETED', 'FAILED', 'HUMAN'))
);
CREATE UNIQUE INDEX "assistant_turns_sessionId_messageId_key" ON "assistant_turns"("sessionId", "messageId");
CREATE INDEX "assistant_turns_sessionId_createdAt_idx" ON "assistant_turns"("sessionId", "createdAt");

CREATE TABLE "client_verification_tokens" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "purpose" TEXT NOT NULL DEFAULT 'ACTIVATE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_verification_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_verification_tokens_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_verification_tokens_purpose_check" CHECK ("purpose" IN ('ACTIVATE', 'RECOVER'))
);
CREATE UNIQUE INDEX "client_verification_tokens_tokenHash_key" ON "client_verification_tokens"("tokenHash");
CREATE INDEX "client_verification_tokens_sessionId_createdAt_idx" ON "client_verification_tokens"("sessionId", "createdAt");
CREATE INDEX "client_verification_tokens_expiresAt_idx" ON "client_verification_tokens"("expiresAt");
