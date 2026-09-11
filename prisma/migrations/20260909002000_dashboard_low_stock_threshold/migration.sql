ALTER TABLE "store_settings"
ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "products"
ADD COLUMN "styleOverride" TEXT;
