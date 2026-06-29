CREATE TYPE "ConversationThreadStatus" AS ENUM ('OPEN', 'WAITING_STAFF', 'WAITING_CLIENT', 'CLOSED', 'ARCHIVED');

CREATE TYPE "ConversationMessageSenderType" AS ENUM ('CLIENT', 'STAFF', 'SYSTEM');

CREATE TABLE "conversation_threads" (
  "id" UUID NOT NULL,
  "clientId" UUID NOT NULL,
  "status" "ConversationThreadStatus" NOT NULL DEFAULT 'OPEN',
  "subject" TEXT,
  "assignedToId" UUID,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversation_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_messages" (
  "id" UUID NOT NULL,
  "threadId" UUID NOT NULL,
  "senderType" "ConversationMessageSenderType" NOT NULL,
  "senderUserId" UUID,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "conversation_threads_clientId_idx" ON "conversation_threads"("clientId");
CREATE INDEX "conversation_threads_assignedToId_idx" ON "conversation_threads"("assignedToId");
CREATE INDEX "conversation_threads_status_idx" ON "conversation_threads"("status");
CREATE INDEX "conversation_threads_lastMessageAt_idx" ON "conversation_threads"("lastMessageAt");
CREATE INDEX "conversation_threads_createdAt_idx" ON "conversation_threads"("createdAt");
CREATE INDEX "conversation_threads_clientId_status_idx" ON "conversation_threads"("clientId", "status");
CREATE INDEX "conversation_threads_assignedToId_status_idx" ON "conversation_threads"("assignedToId", "status");
CREATE INDEX "conversation_messages_threadId_idx" ON "conversation_messages"("threadId");
CREATE INDEX "conversation_messages_senderUserId_idx" ON "conversation_messages"("senderUserId");
CREATE INDEX "conversation_messages_senderType_idx" ON "conversation_messages"("senderType");
CREATE INDEX "conversation_messages_createdAt_idx" ON "conversation_messages"("createdAt");
CREATE INDEX "conversation_messages_threadId_createdAt_idx" ON "conversation_messages"("threadId", "createdAt");

INSERT INTO "permissions" ("id", "key", "description", "createdAt")
VALUES
  ('5d1cc286-53a5-46b8-bab7-a98dde9dff22', 'conversation.read.own', 'Read own client conversations', CURRENT_TIMESTAMP),
  ('1c0f6aba-607f-4a11-83da-dc3c6f8961bb', 'conversation.create.own', 'Create own client conversations', CURRENT_TIMESTAMP),
  ('e1a05e80-0b58-44dc-af6b-e5f290539ea7', 'conversation.reply.own', 'Reply to own client conversations', CURRENT_TIMESTAMP),
  ('8de35f38-7ab0-4624-9ae6-6bcc3920f80d', 'conversation.read.any', 'Read all client conversations', CURRENT_TIMESTAMP),
  ('c9f69918-fb1b-4c8c-a893-2183281b320b', 'conversation.reply.any', 'Reply to all client conversations', CURRENT_TIMESTAMP),
  ('fa0d5ec8-7202-4f82-92d7-457fa0f6fa0e', 'conversation.assign.any', 'Assign all client conversations', CURRENT_TIMESTAMP),
  ('3a58195d-915a-4b25-a57c-b6a9b6ff8eb7', 'conversation.manage.any', 'Manage all client conversations', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" IN ('conversation.read.own', 'conversation.create.own', 'conversation.reply.own')
WHERE r."name" = 'Client'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" IN ('conversation.read.any', 'conversation.reply.any', 'conversation.assign.any', 'conversation.manage.any')
WHERE r."name" IN ('Secretary', 'Office Admin')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."key" LIKE 'conversation.%'
WHERE r."name" = 'Super Admin'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
