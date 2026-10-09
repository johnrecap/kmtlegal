ALTER TABLE "service_requests" ADD COLUMN "conversationThreadId" uuid, ADD COLUMN "sourceRequestId" uuid;
CREATE UNIQUE INDEX "service_requests_conversationThreadId_key" ON "service_requests"("conversationThreadId");
CREATE INDEX "service_requests_sourceRequestId_idx" ON "service_requests"("sourceRequestId");
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_conversationThreadId_fkey" FOREIGN KEY ("conversationThreadId") REFERENCES "conversation_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_sourceRequestId_fkey" FOREIGN KEY ("sourceRequestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
