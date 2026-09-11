-- This table was missing from the initial migration (the project's very
-- first setup appears to have been synced with `prisma db push` before
-- migrations were introduced, so existing databases already have it —
-- this migration exists purely so a FRESH `prisma migrate deploy` also
-- creates it, instead of failing the moment any store-related code runs).
CREATE TABLE IF NOT EXISTS "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "landline" TEXT,
    "mapsUrl" TEXT,
    "mapsEmbedQuery" TEXT,
    "photo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);
