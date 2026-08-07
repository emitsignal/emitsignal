-- Backfill rows written before the column existed so the retention sweep can
-- reach them. Uses the free-plan window (3 days); anything already older than
-- that expires immediately on the next sweep, which is the intent.
UPDATE "WebhookDelivery"
SET "expiresAt" = "createdAt" + INTERVAL '3 days'
WHERE "expiresAt" IS NULL;
