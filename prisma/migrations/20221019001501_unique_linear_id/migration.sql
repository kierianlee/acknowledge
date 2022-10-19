/*
  Warnings:

  - A unique constraint covering the columns `[linearId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Player_linearId_key" ON "Player"("linearId");
