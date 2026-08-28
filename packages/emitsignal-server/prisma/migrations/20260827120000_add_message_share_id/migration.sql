-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "shareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Message_shareId_key" ON "Message"("shareId");
