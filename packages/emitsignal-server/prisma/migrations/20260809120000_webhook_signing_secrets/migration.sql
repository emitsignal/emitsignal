-- AlterTable
ALTER TABLE "Webhook" ADD COLUMN     "secretCiphertext" TEXT,
ADD COLUMN     "verification" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "verificationConfig" TEXT;
