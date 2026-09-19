/*
  Warnings:

  - A unique constraint covering the columns `[externalPaymentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "orders_externalPaymentId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "orders_externalPaymentId_key" ON "orders"("externalPaymentId");
