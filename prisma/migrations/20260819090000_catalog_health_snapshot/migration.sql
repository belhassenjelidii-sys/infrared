CREATE TABLE IF NOT EXISTS "catalog_health_snapshots" (
    "id" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagesChecked" INTEGER NOT NULL DEFAULT 0,
    "brokenImages" INTEGER NOT NULL DEFAULT 0,
    "heavyImages" INTEGER NOT NULL DEFAULT 0,
    "detailsJson" TEXT,

    CONSTRAINT "catalog_health_snapshots_pkey" PRIMARY KEY ("id")
);
