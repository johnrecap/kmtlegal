-- Existing drafts/history do not constitute booking consent.
ALTER TABLE "assistant_sessions" ADD COLUMN "dialogue" JSONB NOT NULL DEFAULT '{}';
