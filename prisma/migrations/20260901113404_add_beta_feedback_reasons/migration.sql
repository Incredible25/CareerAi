-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FeedbackReason" ADD VALUE 'CONFUSING';
ALTER TYPE "FeedbackReason" ADD VALUE 'TOO_GENERIC';
ALTER TYPE "FeedbackReason" ADD VALUE 'CONTRADICTORY';
ALTER TYPE "FeedbackReason" ADD VALUE 'INAPPROPRIATE';
ALTER TYPE "FeedbackReason" ADD VALUE 'INSUFFICIENT_EXPLANATION';
ALTER TYPE "FeedbackReason" ADD VALUE 'TECHNICAL_PROBLEM';
