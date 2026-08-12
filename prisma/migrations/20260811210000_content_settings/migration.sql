ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryTitleSolaires" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryTitleOptiques" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryTitleNouveautes" TEXT,
  ADD COLUMN IF NOT EXISTS "showPrices" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shape" TEXT;
CREATE INDEX IF NOT EXISTS "products_shape_idx" ON "products"("shape");
