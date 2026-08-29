import { prisma } from "@/lib/prisma";
import { computeCareerFit, computeSideIncomeFit } from "@/lib/career-engine/scoring";
import type {
  CareerForScoring,
  SideOpportunityForScoring,
  UserProfileInput,
} from "@/lib/career-engine/types";
import type { TraitScores } from "@/lib/assessment/scoring";
import type { TraitKey } from "@/lib/assessment/questions";

/** Assembles the structured profile the engine scores against (§7, §29). */
export async function buildUserProfileInput(userId: string): Promise<UserProfileInput> {
  const [profile, userSkills, userInterests, education, latestCompletedAssessment] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
      prisma.userInterest.findMany({ where: { userId }, include: { interest: true } }),
      prisma.education.findFirst({ where: { userId, isCurrent: true } }),
      prisma.assessment.findFirst({
        where: { userId, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      }),
    ]);

  return {
    userSkills: userSkills.map((us) => ({ skillId: us.skillId, name: us.skill.name, level: us.level })),
    interestNames: userInterests.map((ui) => ui.interest.name),
    subjects: education?.subjects ?? [],
    traitScores: ((latestCompletedAssessment?.traitScores as TraitScores | null) ?? {}) as Partial<
      Record<TraitKey, number>
    >,
    preferredEnvironment: profile?.preferredEnvironment ?? null,
    availableHoursPerWeek: profile?.availableHoursPerWeek ?? null,
  };
}

/**
 * Scores every career in the catalog against the user's latest completed
 * assessment and persists the results. Returns null if the user hasn't
 * completed an assessment yet — there is nothing to score against.
 * Recomputed (not cached) on every call: with ~24 careers this is cheap
 * pure computation, so matches always reflect the user's current skills.
 */
export async function generateCareerMatches(userId: string): Promise<string | null> {
  const assessment = await prisma.assessment.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
  if (!assessment) return null;

  const [profileInput, careers] = await Promise.all([
    buildUserProfileInput(userId),
    prisma.careerProfile.findMany({ include: { careerSkills: { include: { skill: true } } } }),
  ]);

  const scored = careers.map((career) => {
    const forScoring: CareerForScoring = {
      id: career.id,
      relevantInterests: career.relevantInterests,
      relevantSubjects: career.relevantSubjects,
      traitWeights: career.traitWeights as Partial<Record<TraitKey, number>>,
      environments: career.environments,
      careerSkills: career.careerSkills.map((cs) => ({
        skillId: cs.skillId,
        name: cs.skill.name,
        level: cs.level,
      })),
    };
    return { career, result: computeCareerFit(profileInput, forScoring) };
  });

  scored.sort((a, b) => b.result.fitScore - a.result.fitScore);

  await Promise.all(
    scored.map(({ career, result }, index) =>
      prisma.careerMatch.upsert({
        where: {
          userId_careerId_assessmentId: { userId, careerId: career.id, assessmentId: assessment.id },
        },
        update: { fitScore: result.fitScore, breakdown: result.breakdown, reasons: result.reasons, rank: index + 1 },
        create: {
          userId,
          careerId: career.id,
          assessmentId: assessment.id,
          fitScore: result.fitScore,
          breakdown: result.breakdown,
          reasons: result.reasons,
          rank: index + 1,
        },
      })
    )
  );

  return assessment.id;
}

export async function getLatestCareerMatches(userId: string) {
  const assessment = await prisma.assessment.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
  if (!assessment) return [];

  return prisma.careerMatch.findMany({
    where: { userId, assessmentId: assessment.id },
    include: { career: true },
    orderBy: { rank: "asc" },
  });
}

/**
 * Side-income matching is deliberately decoupled from the assessment —
 * it scores against the user's *current* skills only (§9), so it can run
 * as soon as onboarding is done.
 */
export async function generateSideIncomeMatches(userId: string): Promise<void> {
  const [profileInput, opportunities] = await Promise.all([
    buildUserProfileInput(userId),
    prisma.sideOpportunity.findMany({ include: { skills: { include: { skill: true } } } }),
  ]);

  const scored = opportunities.map((opportunity) => {
    const forScoring: SideOpportunityForScoring = {
      id: opportunity.id,
      skills: opportunity.skills.map((s) => ({ skillId: s.skillId, name: s.skill.name, level: s.level })),
    };
    return { opportunity, result: computeSideIncomeFit(profileInput, forScoring) };
  });

  scored.sort((a, b) => b.result.fitScore - a.result.fitScore);

  await Promise.all(
    scored.map(({ opportunity, result }, index) =>
      prisma.sideIncomeMatch.upsert({
        where: { userId_sideOpportunityId: { userId, sideOpportunityId: opportunity.id } },
        update: {
          fitScore: result.fitScore,
          breakdown: result.breakdown,
          reasons: result.reasons,
          missingSkillNames: result.missingSkillNames,
          rank: index + 1,
        },
        create: {
          userId,
          sideOpportunityId: opportunity.id,
          fitScore: result.fitScore,
          breakdown: result.breakdown,
          reasons: result.reasons,
          missingSkillNames: result.missingSkillNames,
          rank: index + 1,
        },
      })
    )
  );
}

export async function getSideIncomeMatches(userId: string) {
  return prisma.sideIncomeMatch.findMany({
    where: { userId },
    include: { sideOpportunity: true },
    orderBy: { rank: "asc" },
  });
}
