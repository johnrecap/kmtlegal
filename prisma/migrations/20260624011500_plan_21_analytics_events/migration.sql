-- CreateEnum
CREATE TYPE "AnalyticsEventSource" AS ENUM ('PUBLIC', 'PORTAL', 'ADMIN', 'SERVER');

-- CreateEnum
CREATE TYPE "AnalyticsEventOutcome" AS ENUM ('INFO', 'SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source" "AnalyticsEventSource" NOT NULL,
    "outcome" "AnalyticsEventOutcome" NOT NULL DEFAULT 'INFO',
    "properties" JSONB NOT NULL,
    "requestId" TEXT,
    "actorHash" TEXT,
    "actorRole" TEXT,
    "environment" TEXT NOT NULL,
    "release" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_name_idx" ON "analytics_events"("name");

-- CreateIndex
CREATE INDEX "analytics_events_source_idx" ON "analytics_events"("source");

-- CreateIndex
CREATE INDEX "analytics_events_outcome_idx" ON "analytics_events"("outcome");

-- CreateIndex
CREATE INDEX "analytics_events_requestId_idx" ON "analytics_events"("requestId");

-- CreateIndex
CREATE INDEX "analytics_events_actorHash_idx" ON "analytics_events"("actorHash");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
