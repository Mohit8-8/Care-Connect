-- CreateEnum
CREATE TYPE "MedicineOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MEDICINE_STORE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storeAddress" TEXT,
ADD COLUMN     "storeDescription" TEXT,
ADD COLUMN     "storeLicense" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "storePhone" TEXT,
ADD COLUMN     "storeVerificationStatus" "VerificationStatus" DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "manufacturer" TEXT,
    "dosage" TEXT,
    "sideEffects" TEXT,
    "precautions" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineStoreInventory" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "minStockLevel" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineStoreInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineOrder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "MedicineOrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "MedicineOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Medicine_category_idx" ON "Medicine"("category");

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- CreateIndex
CREATE INDEX "MedicineStoreInventory_storeId_idx" ON "MedicineStoreInventory"("storeId");

-- CreateIndex
CREATE INDEX "MedicineStoreInventory_medicineId_idx" ON "MedicineStoreInventory"("medicineId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineStoreInventory_storeId_medicineId_key" ON "MedicineStoreInventory"("storeId", "medicineId");

-- CreateIndex
CREATE INDEX "MedicineOrder_patientId_status_idx" ON "MedicineOrder"("patientId", "status");

-- CreateIndex
CREATE INDEX "MedicineOrder_storeId_status_idx" ON "MedicineOrder"("storeId", "status");

-- CreateIndex
CREATE INDEX "MedicineOrder_status_orderDate_idx" ON "MedicineOrder"("status", "orderDate");

-- AddForeignKey
ALTER TABLE "MedicineStoreInventory" ADD CONSTRAINT "MedicineStoreInventory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineStoreInventory" ADD CONSTRAINT "MedicineStoreInventory_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineOrder" ADD CONSTRAINT "MedicineOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineOrder" ADD CONSTRAINT "MedicineOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineOrder" ADD CONSTRAINT "MedicineOrder_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
