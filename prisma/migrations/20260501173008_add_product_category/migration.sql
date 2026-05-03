-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT DEFAULT 'General',
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
