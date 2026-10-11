CREATE TABLE "formation_interviews" ("id" UUID NOT NULL,"sessionId" UUID NOT NULL,"serviceRequestId" UUID,"locale" TEXT NOT NULL,"consentAt" TIMESTAMP(3) NOT NULL,"draft" JSONB NOT NULL DEFAULT '{}',"revision" INTEGER NOT NULL DEFAULT 0,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "formation_interviews_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "formation_interviews_sessionId_key" ON "formation_interviews"("sessionId");
CREATE UNIQUE INDEX "formation_interviews_serviceRequestId_key" ON "formation_interviews"("serviceRequestId");
ALTER TABLE "formation_interviews" ADD CONSTRAINT "formation_interviews_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "assistant_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "formation_interviews" ADD CONSTRAINT "formation_interviews_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "formation_reports" ("id" UUID NOT NULL,"interviewId" UUID NOT NULL,"version" INTEGER NOT NULL,"snapshot" JSONB NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "formation_reports_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "formation_reports_interviewId_version_key" ON "formation_reports"("interviewId","version");
ALTER TABLE "formation_reports" ADD CONSTRAINT "formation_reports_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "formation_interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve every historical request kind while allowing the new formation workflow.
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_kind_check";
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_kind_check" CHECK ("kind" IN ('CONTRACT_DRAFT','CONTRACT_REVIEW','HEALTH_CHECK','COMPANY_FORMATION'));
