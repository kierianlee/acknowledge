-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_benefactorId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "benefactorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_benefactorId_fkey" FOREIGN KEY ("benefactorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
