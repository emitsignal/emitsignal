-- AlterTable
ALTER TABLE "Message" ADD COLUMN "deliveredAt" DATETIME;
ALTER TABLE "Message" ADD COLUMN "scheduledAt" DATETIME;

-- CreateIndex
CREATE INDEX "Message_scheduledAt_idx" ON "Message"("scheduledAt");
