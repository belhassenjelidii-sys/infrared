ALTER TABLE "store_settings"
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentMode" TEXT NOT NULL DEFAULT 'sandbox',
ADD COLUMN "paypalClientId" TEXT,
ADD COLUMN "paypalClientSecretEncrypted" TEXT,
ADD COLUMN "paypalCurrency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN "paypalTndPerUnit" DECIMAL(12,6),
ADD COLUMN "deliveryCompanyName" TEXT,
ADD COLUMN "deliveryCompanyPhone" TEXT,
ADD COLUMN "deliveryCompanyWebsite" TEXT,
ADD COLUMN "deliveryCompanyAccount" TEXT;

ALTER TABLE "orders"
ADD COLUMN "paymentStatus" TEXT,
ADD COLUMN "externalPaymentId" TEXT;

CREATE INDEX "orders_externalPaymentId_idx" ON "orders"("externalPaymentId");

CREATE TABLE "online_payment_sessions" (
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

CREATE UNIQUE INDEX "online_payment_sessions_paypalOrderId_key" ON "online_payment_sessions"("paypalOrderId");
CREATE INDEX "online_payment_sessions_expiresAt_idx" ON "online_payment_sessions"("expiresAt");
