ALTER TABLE "product_images"
  ADD COLUMN IF NOT EXISTS "phash" TEXT;

CREATE INDEX IF NOT EXISTS "product_images_phash_idx" ON "product_images"("phash");
