import { prisma } from "@/lib/prisma";
import { visibleOpportunityWhere } from "@/lib/opportunities/visibility";
import {
  OPPORTUNITY_ENGINE_VERSION,
  computeOpportunityMatch,
  type OpportunityForScoring,
  type OpportunityUserProfileInput,
} from "@/lib/opportunities/matching";

/** Assembles the structured profile the opportunity engine scores against. */
export async function buildOpportunityUserProfileInput(userId: string): Promise<OpportunityUserProfileInput> {
  const [user, education, userSkills, assessment] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { country: true } }),
    prisma.education.findFirst({ where: { userId, isCurrent: true } }),
    prisma.userSkill.findMany({ where: { userId } }),
    prisma.assessment.findFirst({
      where: { userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const careerFitByCareerId: Record<string, number> = {};
  if (assessment) {
    const careerMatches = await prisma.careerMatch.findMany({
      where: { userId, assessmentId: assessment.id },
      select: { careerId: true, fitScore: true },
    });
    for (const m of careerMatches) careerFitByCareerId[m.careerId] = m.fitScore;
  }

  return {
    country: user.country,
    educationLevel: education?.level ?? null,
    userSkills: userSkills.map((s) => ({ skillId: s.skillId })),
    careerFitByCareerId,
  };
}

/**
 * Scores every currently-visible opportunity (verified, active, not past
 * its deadline — the same gate the public feed will use) against the
 * user's profile and persists the results. Unlike career matches, the
 * visible set can shrink between runs (an opportunity expires, gets
 * unverified, reported and pulled) — so this also deletes this user's
 * stale match rows for anything that dropped out of that set, rather
 * than only ever upserting.
 */
export async function generateOpportunityMatches(userId: string): Promise<void> {
  const [profile, opportunities] = await Promise.all([
    buildOpportunityUserProfileInput(userId),
    prisma.opportunity.findMany({
      where: visibleOpportunityWhere(),
      include: { skills: { include: { skill: true } }, careers: true },
    }),
  ]);

  const scored = opportunities.map((opportunity) => {
    const forScoring: OpportunityForScoring = {
      id: opportunity.id,
      country: opportunity.country,
      remoteStatus: opportunity.remoteStatus,
      eligibleCountries: opportunity.eligibleCountries,
      minEducationLevel: opportunity.minEducationLevel,
      careerIds: opportunity.careers.map((c) => c.careerId),
      skills: opportunity.skills.map((s) => ({
        skillId: s.skillId,
        name: s.skill.name,
        required: s.required,
      })),
    };
    return { opportunity, result: computeOpportunityMatch(profile, forScoring) };
  });

  scored.sort((a, b) => b.result.matchScore - a.result.matchScore);

  const visibleIds = opportunities.map((o) => o.id);

  await Promise.all([
    ...scored.map(({ opportunity, result }, index) =>
      prisma.opportunityMatch.upsert({
        where: { userId_opportunityId: { userId, opportunityId: opportunity.id } },
        update: {
          matchScore: result.matchScore,
          breakdown: result.breakdown,
          reasons: result.reasons,
          eligibilityFlags: result.eligibilityFlags,
          rank: index + 1,
          engineVersion: OPPORTUNITY_ENGINE_VERSION,
          generatedAt: new Date(),
        },
        create: {
          userId,
          opportunityId: opportunity.id,
          matchScore: result.matchScore,
          breakdown: result.breakdown,
          reasons: result.reasons,
          eligibilityFlags: result.eligibilityFlags,
          rank: index + 1,
          engineVersion: OPPORTUNITY_ENGINE_VERSION,
        },
      })
    ),
    prisma.opportunityMatch.deleteMany({
      where: { userId, opportunityId: { notIn: visibleIds } },
    }),
  ]);
}

export async function getOpportunityMatches(userId: string) {
  return prisma.opportunityMatch.findMany({
    where: { userId },
    include: { opportunity: { include: { source: true } } },
    orderBy: { rank: "asc" },
  });
}
