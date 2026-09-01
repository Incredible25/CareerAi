import { describe, expect, it } from "vitest";
import { computeBetaMetrics, type BetaMetricsInput } from "@/lib/beta-metrics";

function baseInput(overrides: Partial<BetaMetricsInput> = {}): BetaMetricsInput {
  return {
    totalBetaUsers: 0,
    completedAssessmentUserIds: [],
    inProgressAssessmentCount: 0,
    usersWithMatchesCount: 0,
    incompleteOnboardingSteps: [],
    careerMatchFeedback: [],
    ...overrides,
  };
}

describe("computeBetaMetrics", () => {
  it("returns all zeros / nulls for an empty beta cohort", () => {
    const result = computeBetaMetrics(baseInput());
    expect(result.totalBetaUsers).toBe(0);
    expect(result.assessmentCompletionRatePercent).toBe(0);
    expect(result.recommendationRelevancePercent).toBeNull();
    expect(result.explanationInsufficiencyRatePercent).toBeNull();
  });

  it("computes assessment completion rate against the full beta cohort, not just completers", () => {
    const result = computeBetaMetrics(
      baseInput({ totalBetaUsers: 4, completedAssessmentUserIds: ["a", "b"] })
    );
    expect(result.assessmentCompletionCount).toBe(2);
    expect(result.assessmentCompletionRatePercent).toBe(50);
  });

  it("buckets incomplete onboarding by step in step order", () => {
    const result = computeBetaMetrics(
      baseInput({ incompleteOnboardingSteps: [0, 0, 2, 4] })
    );
    expect(result.onboardingDropOffByStep).toEqual([
      { step: "education", count: 2 },
      { step: "skills", count: 0 },
      { step: "interests", count: 1 },
      { step: "preferences", count: 0 },
      { step: "access", count: 1 },
    ]);
  });

  it("computes recommendation relevance as the positive share of career-match feedback", () => {
    const result = computeBetaMetrics(
      baseInput({
        careerMatchFeedback: [
          { helpful: true, reason: null },
          { helpful: true, reason: null },
          { helpful: false, reason: "TOO_GENERIC" },
        ],
      })
    );
    expect(result.feedbackCount).toBe(3);
    expect(result.positiveFeedbackCount).toBe(2);
    expect(result.negativeFeedbackCount).toBe(1);
    expect(result.recommendationRelevancePercent).toBe(67);
  });

  it("computes explanation-insufficiency rate as a share of negative feedback specifically", () => {
    const result = computeBetaMetrics(
      baseInput({
        careerMatchFeedback: [
          { helpful: false, reason: "INSUFFICIENT_EXPLANATION" },
          { helpful: false, reason: "TOO_GENERIC" },
          { helpful: true, reason: null }, // excluded — not negative feedback
        ],
      })
    );
    expect(result.explanationInsufficiencyRatePercent).toBe(50);
  });
});
