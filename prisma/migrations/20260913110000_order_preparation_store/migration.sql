ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "email" TEXT;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "preparationStoreId" TEXT;
CREATE INDEX IF NOT EXISTS "orders_preparationStoreId_idx" ON "orders"("preparationStoreId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_preparationStoreId_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_preparationStoreId_fkey"
      FOREIGN KEY ("preparationStoreId") REFERENCES "stores"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
