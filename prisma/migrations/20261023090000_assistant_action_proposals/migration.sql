CREATE TABLE "assistant_action_proposals" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "kind" TEXT NOT NULL,
  "targetId" UUID,
  "payload" JSONB NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "preview" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "result" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "assistant_action_proposals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assistant_action_proposals_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "assistant_action_proposals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "assistant_action_proposals_status_check" CHECK ("status" IN ('PENDING', 'COMPLETED', 'CANCELLED', 'STALE'))
);
CREATE UNIQUE INDEX "assistant_action_proposals_sessionId_messageId_key" ON "assistant_action_proposals"("sessionId", "messageId");
CREATE INDEX "assistant_action_proposals_clientId_status_idx" ON "assistant_action_proposals"("clientId", "status");
