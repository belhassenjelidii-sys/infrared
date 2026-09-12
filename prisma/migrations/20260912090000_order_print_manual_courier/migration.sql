CREATE TABLE IF NOT EXISTS "delivery_companies" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "website" TEXT,
  "accountCode" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "delivery_companies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "deliveryCompanyId" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "manualDeliveryFirstName" TEXT,
  ADD COLUMN IF NOT EXISTS "manualDeliveryLastName" TEXT,
  ADD COLUMN IF NOT EXISTS "manualDeliveryPhone" TEXT;

CREATE INDEX IF NOT EXISTS "delivery_companies_active_name_idx" ON "delivery_companies"("active", "name");
CREATE INDEX IF NOT EXISTS "orders_deliveryCompanyId_idx" ON "orders"("deliveryCompanyId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_deliveryCompanyId_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_deliveryCompanyId_fkey"
      FOREIGN KEY ("deliveryCompanyId") REFERENCES "delivery_companies"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
