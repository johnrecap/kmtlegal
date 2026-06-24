ALTER TABLE "sessions"
  ADD COLUMN "twoFactorAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "twoFactorLockedUntil" TIMESTAMP(3),
  ADD COLUMN "lastTwoFactorFailedAt" TIMESTAMP(3);

CREATE INDEX "sessions_twoFactorLockedUntil_idx" ON "sessions"("twoFactorLockedUntil");
