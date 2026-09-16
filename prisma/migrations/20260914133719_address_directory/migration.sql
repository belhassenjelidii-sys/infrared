-- CreateTable
CREATE TABLE "address_governorates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_delegations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "governorateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_localities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postalCode" TEXT,
    "delegationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "address_localities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "address_governorates_name_key" ON "address_governorates"("name");

-- CreateIndex
CREATE INDEX "address_delegations_governorateId_idx" ON "address_delegations"("governorateId");

-- CreateIndex
CREATE UNIQUE INDEX "address_delegations_governorateId_name_key" ON "address_delegations"("governorateId", "name");

-- CreateIndex
CREATE INDEX "address_localities_delegationId_idx" ON "address_localities"("delegationId");

-- CreateIndex
CREATE UNIQUE INDEX "address_localities_delegationId_name_postalCode_key" ON "address_localities"("delegationId", "name", "postalCode");

-- AddForeignKey
ALTER TABLE "address_delegations" ADD CONSTRAINT "address_delegations_governorateId_fkey" FOREIGN KEY ("governorateId") REFERENCES "address_governorates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address_localities" ADD CONSTRAINT "address_localities_delegationId_fkey" FOREIGN KEY ("delegationId") REFERENCES "address_delegations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
