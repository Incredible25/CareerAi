-- CreateTable
CREATE TABLE "career_side_opportunities" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "sideOpportunityId" TEXT NOT NULL,

    CONSTRAINT "career_side_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "career_side_opportunities_careerId_sideOpportunityId_key" ON "career_side_opportunities"("careerId", "sideOpportunityId");

-- AddForeignKey
ALTER TABLE "career_side_opportunities" ADD CONSTRAINT "career_side_opportunities_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "career_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_side_opportunities" ADD CONSTRAINT "career_side_opportunities_sideOpportunityId_fkey" FOREIGN KEY ("sideOpportunityId") REFERENCES "side_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
