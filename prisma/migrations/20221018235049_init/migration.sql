-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "issueId" TEXT NOT NULL,
    "targetStateId" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "previousPoints" INTEGER NOT NULL,
    "newPoints" INTEGER NOT NULL,
    "rewardId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reward_issueId_key" ON "Reward"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_rewardId_key" ON "Transaction"("rewardId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
