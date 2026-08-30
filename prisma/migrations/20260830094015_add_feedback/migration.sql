-- CreateEnum
CREATE TYPE "FeedbackSubjectType" AS ENUM ('AI_MESSAGE', 'CAREER_MATCH');

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectType" "FeedbackSubjectType" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_subjectType_subjectId_idx" ON "feedback"("subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_userId_subjectType_subjectId_key" ON "feedback"("userId", "subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
