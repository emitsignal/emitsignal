-- CreateTable
CREATE TABLE "Counter" (
    "key" TEXT NOT NULL,
    "total" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("key")
);
