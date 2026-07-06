-- Drop the redundant Topic.isPublic column; accessMode is now the source of
-- truth (isPublic was always accessMode != 'private'). Postgres drops the
-- dependent "Topic_isPublic_idx" index automatically with the column.
ALTER TABLE "Topic" DROP COLUMN "isPublic";
