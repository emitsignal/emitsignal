-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PushToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PushToken" ("createdAt", "deviceId", "id", "platform", "token", "updatedAt", "userId") SELECT "createdAt", "deviceId", "id", "platform", "token", "updatedAt", "userId" FROM "PushToken";
DROP TABLE "PushToken";
ALTER TABLE "new_PushToken" RENAME TO "PushToken";
CREATE INDEX "PushToken_token_idx" ON "PushToken"("token");
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");
CREATE UNIQUE INDEX "PushToken_deviceId_token_key" ON "PushToken"("deviceId", "token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
