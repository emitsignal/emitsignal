-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "PlanSubscription" (
    "id" TEXT NOT NULL,
    "billingInterval" TEXT,
    "cancelAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "plan" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "seats" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "stripeCustomerId" TEXT,
    "stripeScheduleId" TEXT,
    "stripeSubscriptionId" TEXT,
    "trialEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanSubscription_referenceId_idx" ON "PlanSubscription"("referenceId");

-- CreateIndex
CREATE INDEX "PlanSubscription_stripeCustomerId_idx" ON "PlanSubscription"("stripeCustomerId");
