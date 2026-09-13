ALTER TABLE "users"
  ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "twoFactorSecretEncrypted" TEXT,
  ADD COLUMN "twoFactorPendingSecretEncrypted" TEXT,
  ADD COLUMN "twoFactorRecoveryCodes" JSONB;

CREATE TABLE "two_factor_login_challenges" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "two_factor_login_challenges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "two_factor_login_challenges_tokenHash_key" ON "two_factor_login_challenges"("tokenHash");
CREATE INDEX "two_factor_login_challenges_userId_expiresAt_idx" ON "two_factor_login_challenges"("userId", "expiresAt");
CREATE INDEX "two_factor_login_challenges_expiresAt_idx" ON "two_factor_login_challenges"("expiresAt");
ALTER TABLE "two_factor_login_challenges" ADD CONSTRAINT "two_factor_login_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;