/**
 * The dashboard's progress bars and badges (Phase 2, Module 9).
 * Extracted from src/app/dashboard/page.tsx, which originally defined
 * both inline — same rationale as next-action.ts: independently
 * testable and reusable without dragging the whole dashboard page
 * along with it.
 *
 * Plain arithmetic over already-computed facts, no AI involved.
 */

export type AssessmentStatus = "done" | "in_progress" | "not_started";

export type ProgressInput = {
  assessmentStatus: AssessmentStatus;
  doneTasks: number;
  totalTasks: number;
  completedPortfolioProjects: number;
  opportunityMatchCount: number;
  eligibleOpportunityMatchCount: number;
};

export type ProgressSummary = {
  careerDiscoveryPercent: number;
  skillDevelopmentPercent: number;
  portfolioPercent: number;
  // No unmet hard-eligibility requirement (education/country/on-site
  // location — Phase 4's cap-and-flag matching engine) among the
  // user's top opportunity matches. Not a probability of being
  // accepted anywhere it's shown.
  opportunityReadinessPercent: number;
};

export function computeProgress(input: ProgressInput): ProgressSummary {
  return {
    careerDiscoveryPercent: input.assessmentStatus === "done" ? 100 : input.assessmentStatus === "in_progress" ? 50 : 0,
    skillDevelopmentPercent: input.totalTasks > 0 ? Math.round((input.doneTasks / input.totalTasks) * 100) : 0,
    // Capped at 3 completed projects for 100% — an arbitrary but stable
    // target, same as the original inline version.
    portfolioPercent: Math.min(100, Math.round((input.completedPortfolioProjects / 3) * 100)),
    opportunityReadinessPercent:
      input.opportunityMatchCount > 0
        ? Math.round((input.eligibleOpportunityMatchCount / input.opportunityMatchCount) * 100)
        : 0,
  };
}

export type BadgeContext = {
  assessmentDone: boolean;
  tasksDone: number;
  portfolioCount: number;
  portfolioCompleted: number;
  // New alongside this extraction: the four original badges predate
  // Phase 4 and none of them reflect the opportunity engine at all,
  // the same blind spot Module 7 found in the next-action logic.
  trackedOpportunityCount: number;
};

export type Badge = { key: string; label: string };

const BADGE_DEFINITIONS: (Badge & { earned: (ctx: BadgeContext) => boolean })[] = [
  { key: "explorer", label: "Career Explorer", earned: (ctx) => ctx.assessmentDone },
  { key: "skill-builder", label: "Skill Builder", earned: (ctx) => ctx.tasksDone > 0 },
  { key: "portfolio-starter", label: "Portfolio Starter", earned: (ctx) => ctx.portfolioCount > 0 },
  { key: "first-project", label: "First Project", earned: (ctx) => ctx.portfolioCompleted > 0 },
  { key: "opportunity-seeker", label: "Opportunity Seeker", earned: (ctx) => ctx.trackedOpportunityCount > 0 },
];

export function getEarnedBadges(ctx: BadgeContext): Badge[] {
  return BADGE_DEFINITIONS.filter((b) => b.earned(ctx)).map(({ key, label }) => ({ key, label }));
}
