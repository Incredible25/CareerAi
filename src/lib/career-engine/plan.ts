import { prisma } from "@/lib/prisma";
import { buildUserProfileInput } from "@/lib/career-engine/generate";
import { SKILL_LEVEL_ORDER, meetsLevel } from "@/lib/career-engine/skill-level";
import { buildRoadmapTasks } from "@/lib/career-engine/roadmap";

/**
 * Recomputes skill gaps for a (user, career) pair from the user's current
 * skills. Stateless — safe to recompute on every visit, unlike the
 * roadmap below, which carries user-set task status.
 */
export async function generateSkillGaps(userId: string, careerId: string) {
  const [profileInput, career] = await Promise.all([
    buildUserProfileInput(userId),
    prisma.careerProfile.findUniqueOrThrow({
      where: { id: careerId },
      include: { careerSkills: { include: { skill: true } } },
    }),
  ]);

  const gaps = career.careerSkills
    .map((cs) => {
      const owned = profileInput.userSkills.find((s) => s.skillId === cs.skillId);
      if (owned && meetsLevel(owned.level, cs.level)) return null;
      const currentOrdinal = owned ? SKILL_LEVEL_ORDER[owned.level] : 0;
      const diff = SKILL_LEVEL_ORDER[cs.level] - currentOrdinal;
      return {
        skillId: cs.skillId,
        skillName: cs.skill.name,
        currentLevel: owned?.level ?? null,
        requiredLevel: cs.level,
        // Lower priority number = tackle first: required level first
        // (beginner requirements before advanced ones), then smaller
        // gaps within the same level (quick wins first).
        priority: SKILL_LEVEL_ORDER[cs.level] * 10 + diff,
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => a.priority - b.priority);

  await prisma.$transaction([
    prisma.skillGap.deleteMany({ where: { userId, careerId } }),
    ...gaps.map((gap) =>
      prisma.skillGap.create({
        data: {
          userId,
          careerId,
          skillId: gap.skillId,
          currentLevel: gap.currentLevel,
          requiredLevel: gap.requiredLevel,
          priority: gap.priority,
        },
      })
    ),
  ]);

  return gaps;
}

/**
 * Returns the user's roadmap for a career, generating it once from the
 * current skill gaps if it doesn't exist yet. Deliberately NOT
 * regenerated on later visits — RoadmapTask.status is real user progress
 * (docs/PRODUCT_STRATEGY.md §11), and wiping it on every page load would
 * discard that.
 */
export async function getOrCreateRoadmap(userId: string, careerId: string) {
  const existing = await prisma.roadmap.findUnique({
    where: { userId_careerId: { userId, careerId } },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (existing) return existing;

  const [career, profileInput, gaps] = await Promise.all([
    prisma.careerProfile.findUniqueOrThrow({ where: { id: careerId } }),
    buildUserProfileInput(userId),
    prisma.skillGap.findMany({
      where: { userId, careerId },
      include: { skill: true },
      orderBy: { priority: "asc" },
    }),
  ]);

  const { totalWeeks, tasks } = buildRoadmapTasks({
    careerName: career.name,
    gapSkillNames: gaps.map((g) => g.skill.name),
    beginnerProjects: career.beginnerProjects,
    portfolioRequirements: career.portfolioRequirements,
    availableHoursPerWeek: profileInput.availableHoursPerWeek,
  });

  return prisma.roadmap.create({
    data: {
      userId,
      careerId,
      totalWeeks,
      tasks: { create: tasks },
    },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
}

/** Full plan for a career: skill gaps (fresh) + roadmap (stable). */
export async function getCareerPlan(userId: string, careerId: string) {
  const gaps = await generateSkillGaps(userId, careerId);
  const roadmap = await getOrCreateRoadmap(userId, careerId);
  return { gaps, roadmap };
}
