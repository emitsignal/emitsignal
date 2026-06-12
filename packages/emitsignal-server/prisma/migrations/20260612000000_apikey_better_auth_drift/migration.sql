-- Reconciles drift: these columns were added to the live database outside of
-- migration history (Better Auth apiKey plugin upgrade).
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "configId" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "referenceId" TEXT;
