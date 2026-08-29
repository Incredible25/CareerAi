/*
  Warnings:

  - Added the required column `learningNotes` to the `side_opportunities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "side_opportunities" ADD COLUMN     "learningNotes" TEXT NOT NULL;
