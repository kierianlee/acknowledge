/*
  Warnings:

  - A unique constraint covering the columns `[attachmentId]` on the table `Reward` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attachmentId` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "attachmentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reward_attachmentId_key" ON "Reward"("attachmentId");
