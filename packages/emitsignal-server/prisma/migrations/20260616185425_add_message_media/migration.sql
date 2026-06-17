-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "bannerImage" TEXT,
ADD COLUMN     "inlineAttachments" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "inlineImages" TEXT NOT NULL DEFAULT '[]';
