ALTER TABLE "store_settings"
ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMode" TEXT NOT NULL DEFAULT 'sandbox',
ADD COLUMN IF NOT EXISTS "paypalClientId" TEXT,
ADD COLUMN IF NOT EXISTS "paypalClientSecretEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "paypalCurrency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS "paypalTndPerUnit" DECIMAL(12,6),
ADD COLUMN IF NOT EXISTS "deliveryCompanyName" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryCompanyPhone" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryCompanyWebsite" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryCompanyAccount" TEXT;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "externalPaymentId" TEXT;

CREATE INDEX IF NOT EXISTS "orders_externalPaymentId_idx" ON "orders"("externalPaymentId");

CREATE TABLE IF NOT EXISTS "online_payment_sessions" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "paypalOrderId" TEXT NOT NULL,
  "customerSnapshot" JSONB NOT NULL,
  "fulfillmentSnapshot" JSONB,
  "amountTnd" DECIMAL(12,3) NOT NULL,
  "amountPayPal" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "online_payment_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "online_payment_sessions_paypalOrderId_key" ON "online_payment_sessions"("paypalOrderId");
CREATE INDEX IF NOT EXISTS "online_payment_sessions_expiresAt_idx" ON "online_payment_sessions"("expiresAt");
