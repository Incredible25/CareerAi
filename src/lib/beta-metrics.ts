/**
 * Phase 7 Step 6 — beta metrics, scoped to User.isBetaUser = true.
 *
 * Same pattern as src/lib/feedback/aggregate.ts: a pure function over
 * already-fetched rows (independently testable, no DB access here), fed
 * by a thin fetch function that does the actual Prisma queries. Covers
 * every metric in the Step 6 brief that is genuinely derivable from
 * existing schema state without a new events table — see
 * docs/PHASE_7_BETA_METRICS.md for the remaining metrics (AI timeout
 * rate, technical error rate, mobile issues) that are log-based instead,
 * and why building a full events pipeline for a 15-25 person beta would
 * be more infrastructure than this phase calls for.
 */
import { prisma } from "@/lib/prisma";
import type { FeedbackReason, FeedbackSubjectType } from "@prisma/client";
import { ONBOARDING_STEPS } from "@/lib/onboarding";

export type BetaMetricsInput = {
  totalBetaUsers: number;
  completedAssessmentUserIds: string[];
  inProgressAssessmentCount: number;
  usersWithMatchesCount: number;
  /** onboardingStep for every beta user who hasn't finished (< ONBOARDING_STEPS.length). */
  incompleteOnboardingSteps: number[];
  careerMatchFeedback: { helpful: boolean; reason: FeedbackReason | null }[];
};

export type BetaMetricsSummary = {
  totalBetaUsers: number;
  registrationCompletionCount: number;
  assessmentCompletionCount: number;
  assessmentCompletionRatePercent: number;
  assessmentInProgressCount: number;
  recommendationGenerationSuccessCount: number;
  onboardingDropOffByStep: { step: string; count: number }[];
  feedbackCount: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  recommendationRelevancePercent: number | null;
  explanationInsufficiencyRatePercent: number | null;
};

function round(value: number): number {
  return Math.round(value);
}

export function computeBetaMetrics(input: BetaMetricsInput): BetaMetricsSummary {
  const {
    totalBetaUsers,
    completedAssessmentUserIds,
    inProgressAssessmentCount,
    usersWithMatchesCount,
    incompleteOnboardingSteps,
    careerMatchFeedback,
  } = input;

  const assessmentCompletionCount = completedAssessmentUserIds.length;
  const assessmentCompletionRatePercent =
    totalBetaUsers > 0 ? round((assessmentCompletionCount / totalBetaUsers) * 100) : 0;

  const stepCounts = new Map<number, number>();
  for (const step of incompleteOnboardingSteps) {
    stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
  }
  const onboardingDropOffByStep = ONBOARDING_STEPS.map((step, index) => ({
    step,
    count: stepCounts.get(index) ?? 0,
  }));

  const feedbackCount = careerMatchFeedback.length;
  const positiveFeedbackCount = careerMatchFeedback.filter((f) => f.helpful).length;
  const negativeFeedbackCount = feedbackCount - positiveFeedbackCount;
  const recommendationRelevancePercent =
    feedbackCount > 0 ? round((positiveFeedbackCount / feedbackCount) * 100) : null;

  const insufficientExplanationCount = careerMatchFeedback.filter(
    (f) => !f.helpful && f.reason === "INSUFFICIENT_EXPLANATION"
  ).length;
  const explanationInsufficiencyRatePercent =
    negativeFeedbackCount > 0 ? round((insufficientExplanationCount / negativeFeedbackCount) * 100) : null;

  return {
    totalBetaUsers,
    registrationCompletionCount: totalBetaUsers,
    assessmentCompletionCount,
    assessmentCompletionRatePercent,
    assessmentInProgressCount: inProgressAssessmentCount,
    recommendationGenerationSuccessCount: usersWithMatchesCount,
    onboardingDropOffByStep,
    feedbackCount,
    positiveFeedbackCount,
    negativeFeedbackCount,
    recommendationRelevancePercent,
    explanationInsufficiencyRatePercent,
  };
}

export async function fetchBetaMetricsInput(): Promise<BetaMetricsInput> {
  const betaUsers = await prisma.user.findMany({
    where: { isBetaUser: true },
    select: { id: true },
  });
  const betaUserIds = betaUsers.map((u) => u.id);

  if (betaUserIds.length === 0) {
    return {
      totalBetaUsers: 0,
      completedAssessmentUserIds: [],
      inProgressAssessmentCount: 0,
      usersWithMatchesCount: 0,
      incompleteOnboardingSteps: [],
      careerMatchFeedback: [],
    };
  }

  const [completedAssessments, inProgressAssessmentCount, matchUsers, incompleteProfiles, feedbackRows] =
    await Promise.all([
      prisma.assessment.findMany({
        where: { userId: { in: betaUserIds }, status: "COMPLETED" },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.assessment.count({
        where: { userId: { in: betaUserIds }, status: "IN_PROGRESS" },
      }),
      prisma.careerMatch.findMany({
        where: { userId: { in: betaUserIds } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.profile.findMany({
        where: { userId: { in: betaUserIds }, onboardingStep: { lt: ONBOARDING_STEPS.length } },
        select: { onboardingStep: true },
      }),
      prisma.feedback.findMany({
        where: {
          userId: { in: betaUserIds },
          subjectType: "CAREER_MATCH" satisfies FeedbackSubjectType,
        },
        select: { helpful: true, reason: true },
      }),
    ]);

  return {
    totalBetaUsers: betaUserIds.length,
    completedAssessmentUserIds: completedAssessments.map((a) => a.userId),
    inProgressAssessmentCount,
    usersWithMatchesCount: matchUsers.length,
    incompleteOnboardingSteps: incompleteProfiles.map((p) => p.onboardingStep),
    careerMatchFeedback: feedbackRows,
  };
}
