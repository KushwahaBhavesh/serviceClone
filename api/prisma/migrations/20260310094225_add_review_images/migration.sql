-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "image_url" TEXT[] DEFAULT ARRAY[]::TEXT[];
