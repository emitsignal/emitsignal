-- AddColumn
-- Re-add the Better Auth core `ipAddress` column. With IP tracking disabled
-- it only ever stores an empty string (no real IP is persisted), but the
-- column must exist or the Prisma adapter rejects session inserts.
ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT;
