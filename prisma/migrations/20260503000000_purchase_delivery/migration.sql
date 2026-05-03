-- Phase 3: Purchase & Delivery schema migration
-- Applied via `prisma db push` (non-interactive environment)
-- This file documents the changes for migration tracking purposes.

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('INSTANT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- AlterEnum: Add new values to OrderStatus
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'FAILED';

-- CreateEnum
CREATE TYPE "AuditEvent" AS ENUM ('KEY_REVEALED', 'CREDENTIALS_DELIVERED', 'BUYER_CONFIRMED', 'AUTO_CONFIRMED');

-- CreateTable: Category
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "shopName" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExp" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductKey (replaces LicenseKey)
CREATE TABLE "ProductKey" (
    "id" TEXT NOT NULL,
    "keyValue" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductKey_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Product — add Phase 2/3 fields
ALTER TABLE "Product"
    ADD COLUMN IF NOT EXISTS "title" JSONB,
    ADD COLUMN IF NOT EXISTS "platform" TEXT,
    ADD COLUMN IF NOT EXISTS "deliveryType" "DeliveryType" NOT NULL DEFAULT 'INSTANT',
    ADD COLUMN IF NOT EXISTS "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "sellerId" TEXT,
    ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- AlterTable: Order — add Phase 3 fields
ALTER TABLE "Order"
    ADD COLUMN IF NOT EXISTS "buyerId" TEXT,
    ADD COLUMN IF NOT EXISTS "sellerId" TEXT,
    ADD COLUMN IF NOT EXISTS "productKeyId" TEXT,
    ADD COLUMN IF NOT EXISTS "sellerAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "commissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "credentials" TEXT,
    ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "confirmDeadline" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "event" "AuditEvent" NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_shopName_key" ON "User"("shopName");
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
CREATE UNIQUE INDEX "ProductKey_orderId_key" ON "ProductKey"("orderId");
CREATE INDEX "User_shopName_idx" ON "User"("shopName");
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX "Order_buyerId_idx" ON "Order"("buyerId");
CREATE INDEX "Order_sellerId_idx" ON "Order"("sellerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "AuditLog_orderId_idx" ON "AuditLog"("orderId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductKey" ADD CONSTRAINT "ProductKey_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductKey" ADD CONSTRAINT "ProductKey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
