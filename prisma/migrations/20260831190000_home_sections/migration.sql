CREATE TABLE IF NOT EXISTS "home_sections" (
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL,
  "productIdsJson" TEXT,
  "categoryIdsJson" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "home_sections_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "home_sections_sortOrder_idx" ON "home_sections"("sortOrder");
