-- Stage 6 performance indexes.
-- pg_trgm makes ILIKE/contains searches on catalogue text fields indexable.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx"
  ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_reference_trgm_idx"
  ON "products" USING GIN ("reference" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "brands_name_trgm_idx"
  ON "brands" USING GIN ("name" gin_trgm_ops);

-- Public catalogue queries share these predicates and sort patterns.
CREATE INDEX IF NOT EXISTS "products_public_featured_idx"
  ON "products" ("featured" DESC, "createdAt" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true;

CREATE INDEX IF NOT EXISTS "products_public_created_idx"
  ON "products" ("createdAt" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true;

CREATE INDEX IF NOT EXISTS "products_public_price_idx"
  ON "products" ("price" ASC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true;

CREATE INDEX IF NOT EXISTS "products_public_new_idx"
  ON "products" ("createdAt" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true AND "isNew" = true;

CREATE INDEX IF NOT EXISTS "products_public_promo_idx"
  ON "products" ("discount" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true AND "isPromotion" = true;

CREATE INDEX IF NOT EXISTS "products_public_brand_idx"
  ON "products" ("brandId", "createdAt" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true;

CREATE INDEX IF NOT EXISTS "products_public_category_idx"
  ON "products" ("categoryId", "createdAt" DESC, "id" ASC)
  WHERE "archived" = false AND "published" = true AND "available" = true;
