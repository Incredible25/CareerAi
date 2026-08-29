-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "PortfolioStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "career_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relevantSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relevantInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "traitWeights" JSONB NOT NULL,
    "educationPathways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alternativePathways" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beginnerProjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolioRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remoteSuitable" BOOLEAN NOT NULL DEFAULT false,
    "freelanceSuitable" BOOLEAN NOT NULL DEFAULT false,
    "environments" "WorkEnvironment"[] DEFAULT ARRAY[]::"WorkEnvironment"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_skills" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,

    CONSTRAINT "career_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_matches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "fitScore" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "reasons" TEXT[],
    "rank" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_gaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "currentLevel" "SkillLevel",
    "requiredLevel" "SkillLevel" NOT NULL,
    "priority" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "totalWeeks" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "weekStart" INTEGER NOT NULL,
    "weekEnd" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_opportunities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "starterProject" TEXT NOT NULL,
    "portfolioRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientApproachTips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remoteSuitable" BOOLEAN NOT NULL DEFAULT true,
    "freelanceSuitable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_opportunity_skills" (
    "id" TEXT NOT NULL,
    "sideOpportunityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,

    CONSTRAINT "side_opportunity_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_income_matches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sideOpportunityId" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "reasons" TEXT[],
    "missingSkillNames" TEXT[],
    "rank" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "side_income_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "careerId" TEXT,
    "roadmapTaskId" TEXT,
    "status" "PortfolioStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RelatedCareers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "career_profiles_slug_key" ON "career_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "career_skills_careerId_skillId_key" ON "career_skills"("careerId", "skillId");

-- CreateIndex
CREATE INDEX "career_matches_userId_idx" ON "career_matches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "career_matches_userId_careerId_assessmentId_key" ON "career_matches"("userId", "careerId", "assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_gaps_userId_careerId_skillId_key" ON "skill_gaps"("userId", "careerId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_userId_careerId_key" ON "roadmaps"("userId", "careerId");

-- CreateIndex
CREATE UNIQUE INDEX "side_opportunities_slug_key" ON "side_opportunities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "side_opportunity_skills_sideOpportunityId_skillId_key" ON "side_opportunity_skills"("sideOpportunityId", "skillId");

-- CreateIndex
CREATE INDEX "side_income_matches_userId_idx" ON "side_income_matches"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "side_income_matches_userId_sideOpportunityId_key" ON "side_income_matches"("userId", "sideOpportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_projects_roadmapTaskId_key" ON "portfolio_projects"("roadmapTaskId");

-- CreateIndex
CREATE INDEX "portfolio_projects_userId_idx" ON "portfolio_projects"("userId");

-- CreateIndex
CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_RelatedCareers_AB_unique" ON "_RelatedCareers"("A", "B");

-- CreateIndex
CREATE INDEX "_RelatedCareers_B_index" ON "_RelatedCareers"("B");

-- AddForeignKey
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_opportunity_skills" ADD CONSTRAINT "side_opportunity_skills_sideOpportunityId_fkey" FOREIGN KEY ("sideOpportunityId") REFERENCES "side_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_opportunity_skills" ADD CONSTRAINT "side_opportunity_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_income_matches" ADD CONSTRAINT "side_income_matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_income_matches" ADD CONSTRAINT "side_income_matches_sideOpportunityId_fkey" FOREIGN KEY ("sideOpportunityId") REFERENCES "side_opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_projects" ADD CONSTRAINT "portfolio_projects_roadmapTaskId_fkey" FOREIGN KEY ("roadmapTaskId") REFERENCES "roadmap_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedCareers" ADD CONSTRAINT "_RelatedCareers_A_fkey" FOREIGN KEY ("A") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedCareers" ADD CONSTRAINT "_RelatedCareers_B_fkey" FOREIGN KEY ("B") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
