ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "preparationEmailSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preparationEmailClaimedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "orders_preparationEmailSentAt_idx" ON "orders"("preparationEmailSentAt");
