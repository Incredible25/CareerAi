-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_ORGANIZATION', 'GOVERNMENT', 'UNIVERSITY', 'INTERNATIONAL_ORGANIZATION', 'PARTNER_ORGANIZATION', 'APPROVED_PLATFORM', 'OTHER');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNRATED');

-- CreateEnum
CREATE TYPE "OpportunityCategory" AS ENUM ('JOB', 'INTERNSHIP', 'SCHOLARSHIP', 'FELLOWSHIP', 'GRANT', 'COMPETITION', 'VOLUNTEER', 'REMOTE_WORK', 'FREELANCE', 'TRAINING_PROGRAM', 'MENTORSHIP');

-- CreateEnum
CREATE TYPE "RemoteStatus" AS ENUM ('REMOTE', 'ON_SITE', 'HYBRID', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "ExperienceRequirement" AS ENUM ('NONE', 'ENTRY_LEVEL', 'SOME_EXPERIENCE', 'EXPERIENCED', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REPORTED');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'PLANNING_TO_APPLY', 'APPLIED', 'INTERVIEW_SELECTION', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SUSPICIOUS_OPPORTUNITY', 'BROKEN_LINK', 'INCORRECT_INFORMATION', 'EXPIRED', 'MISLEADING_REQUIREMENTS', 'SUSPICIOUS_ORGANIZATION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "opportunity_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "trustLevel" "TrustLevel" NOT NULL DEFAULT 'UNRATED',
    "lastCheckedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "category" "OpportunityCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "country" TEXT,
    "remoteStatus" "RemoteStatus" NOT NULL DEFAULT 'UNSPECIFIED',
    "eligibleCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eligibilityText" TEXT,
    "minEducationLevel" "EducationLevel",
    "experienceRequirement" "ExperienceRequirement" NOT NULL DEFAULT 'UNSPECIFIED',
    "applicationDeadline" TIMESTAMP(3),
    "applicationUrl" TEXT NOT NULL,
    "datePublished" TIMESTAMP(3),
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "opportunityStatus" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "lastVerifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_skills" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "opportunity_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_careers" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,

    CONSTRAINT "opportunity_careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_matches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "reasons" TEXT[],
    "eligibilityFlags" TEXT[],
    "engineVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "rank" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "note" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunities_category_idx" ON "opportunities"("category");

-- CreateIndex
CREATE INDEX "opportunities_verificationStatus_opportunityStatus_idx" ON "opportunities"("verificationStatus", "opportunityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_skills_opportunityId_skillId_key" ON "opportunity_skills"("opportunityId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_careers_opportunityId_careerId_key" ON "opportunity_careers"("opportunityId", "careerId");

-- CreateIndex
CREATE INDEX "opportunity_matches_userId_idx" ON "opportunity_matches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_matches_userId_opportunityId_key" ON "opportunity_matches"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_applications_userId_idx" ON "opportunity_applications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_applications_userId_opportunityId_key" ON "opportunity_applications"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_reports_opportunityId_idx" ON "opportunity_reports"("opportunityId");

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "opportunity_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_careers" ADD CONSTRAINT "opportunity_careers_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_careers" ADD CONSTRAINT "opportunity_careers_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_matches" ADD CONSTRAINT "opportunity_matches_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_applications" ADD CONSTRAINT "opportunity_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_applications" ADD CONSTRAINT "opportunity_applications_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_reports" ADD CONSTRAINT "opportunity_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_reports" ADD CONSTRAINT "opportunity_reports_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
