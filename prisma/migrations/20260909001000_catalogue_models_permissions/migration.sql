-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SUNGLASSES', 'OPTICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE 'MARKETING';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "permissionOverrides" JSONB;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "bridgeWidth" INTEGER,
ADD COLUMN     "commercialSize" TEXT,
ADD COLUMN     "ean" TEXT,
ADD COLUMN     "frameColorFamily" TEXT,
ADD COLUMN     "frameColorLabel" TEXT,
ADD COLUMN     "frameTypeOverride" TEXT,
ADD COLUMN     "genderOverride" "Target",
ADD COLUMN     "gradient" BOOLEAN,
ADD COLUMN     "lensColorFamily" TEXT,
ADD COLUMN     "lensColorLabel" TEXT,
ADD COLUMN     "lensHeight" INTEGER,
ADD COLUMN     "lensWidth" INTEGER,
ADD COLUMN     "materialFamilyOverride" TEXT,
ADD COLUMN     "materialOverride" TEXT,
ADD COLUMN     "mirrored" BOOLEAN,
ADD COLUMN     "photochromic" BOOLEAN,
ADD COLUMN     "polarized" BOOLEAN,
ADD COLUMN     "prescriptionCompatible" BOOLEAN,
ADD COLUMN     "productModelId" TEXT,
ADD COLUMN     "shapeOverride" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "solarIndex" INTEGER,
ADD COLUMN     "stock" INTEGER,
ADD COLUMN     "templeLength" INTEGER,
ADD COLUMN     "totalWidth" INTEGER,
ADD COLUMN     "type" "ProductType",
ADD COLUMN     "variantReference" TEXT,
ADD COLUMN     "weight" DECIMAL(8,3),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,3),
ALTER COLUMN "oldPrice" SET DATA TYPE DECIMAL(12,3);

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "features" JSONB;

-- CreateTable
CREATE TABLE "product_models" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collection" TEXT,
    "shape" TEXT,
    "materialLabel" TEXT,
    "materialFamily" TEXT,
    "gender" "Target" NOT NULL DEFAULT 'MIXTE',
    "frameType" TEXT,
    "style" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_policies" (
    "role" "Role" NOT NULL,
    "permissions" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_policies_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "customerSnapshot" JSONB NOT NULL,
    "fulfillmentSnapshot" JSONB,
    "paymentMethod" TEXT,
    "total" DECIMAL(12,3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    "productName" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "modelCode" TEXT,
    "reference" TEXT NOT NULL,
    "size" TEXT,
    "frameColor" TEXT,
    "lensColor" TEXT,
    "unitPrice" DECIMAL(12,3) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_models_categoryId_idx" ON "product_models"("categoryId");

-- CreateIndex
CREATE INDEX "product_models_type_active_createdAt_idx" ON "product_models"("type", "active", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_models_brandId_code_type_key" ON "product_models"("brandId", "code", "type");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "cart_items_variantId_idx" ON "cart_items"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_variantId_key" ON "cart_items"("cartId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "orders"("number");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_ean_key" ON "products"("ean");

-- CreateIndex
CREATE INDEX "products_productModelId_idx" ON "products"("productModelId");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "products"("type");

-- CreateIndex
CREATE INDEX "products_archived_published_createdAt_idx" ON "products"("archived", "published", "createdAt");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "product_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_stock_nonnegative" CHECK (stock IS NULL OR stock >= 0);
