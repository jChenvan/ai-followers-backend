/*
  Warnings:

  - You are about to drop the column `aiId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `humanId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `humanSent` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `aiAuthorId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `humanAuthorId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `Character` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `React` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `recipientId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_aiId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_humanId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_aiAuthorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_humanAuthorId_fkey";

-- DropForeignKey
ALTER TABLE "React" DROP CONSTRAINT "React_postId_fkey";

-- DropForeignKey
ALTER TABLE "React" DROP CONSTRAINT "React_reactionId_fkey";

-- DropForeignKey
ALTER TABLE "React" DROP CONSTRAINT "React_userId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "aiId",
DROP COLUMN "humanId",
DROP COLUMN "humanSent",
ADD COLUMN     "recipientId" INTEGER NOT NULL,
ADD COLUMN     "senderId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "aiAuthorId",
DROP COLUMN "humanAuthorId",
ADD COLUMN     "authorId" INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "Character";

-- DropTable
DROP TABLE "React";

-- DropTable
DROP TABLE "Reaction";

-- CreateTable
CREATE TABLE "AiProfile" (
    "userId" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "AiProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "AiProfile" ADD CONSTRAINT "AiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiProfile" ADD CONSTRAINT "AiProfile_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
