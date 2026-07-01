-- AlterTable: migrate `tags` from a JSON-stringified array column to a
-- native Postgres array, preserving existing data.
ALTER TABLE "Message" ADD COLUMN "tags_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Message"
SET "tags_new" = COALESCE(
    (SELECT array_agg(elem) FROM json_array_elements_text("tags"::json) AS elem),
    ARRAY[]::TEXT[]
);

ALTER TABLE "Message" DROP COLUMN "tags";
ALTER TABLE "Message" RENAME COLUMN "tags_new" TO "tags";

-- CreateIndex
CREATE INDEX "Message_topicId_priority_createdAt_idx" ON "Message"("topicId", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Message_tags_idx" ON "Message" USING GIN ("tags");
