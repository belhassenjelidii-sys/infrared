ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "paymentPublicKey" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentSecretEncrypted" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentMerchantId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentApiBaseUrl" TEXT;

ALTER TABLE "online_payment_sessions"
  ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'PAYPAL',
  ADD COLUMN IF NOT EXISTS "externalPaymentId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "online_payment_sessions_externalPaymentId_key"
  ON "online_payment_sessions"("externalPaymentId");
