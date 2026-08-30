import { describe, expect, it } from "vitest";
import { computeFeedbackDashboard, MIN_FEEDBACK_FOR_RANKING } from "@/lib/feedback/aggregate";
import type { CareerMatchFeedbackRow } from "@/lib/feedback/aggregate";

function row(overrides: Partial<CareerMatchFeedbackRow> & { subjectId: string }): CareerMatchFeedbackRow {
  return { helpful: true, reason: null, createdAt: new Date("2026-08-01T00:00:00Z"), ...overrides };
}

describe("computeFeedbackDashboard — top-level rates", () => {
  it("returns all zeros without dividing by zero when there's no data at all", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 0,
      careerMatchFeedback: [],
      matchCareerNames: new Map(),
      topRankedCareerNames: [],
    });
    expect(result.feedbackRatePercent).toBe(0);
    expect(result.positiveRatePercent).toBe(0);
    expect(result.totalFeedback).toBe(0);
  });

  it("computes feedback rate and positive rate correctly", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 10,
      careerMatchFeedback: [
        row({ subjectId: "m1", helpful: true }),
        row({ subjectId: "m2", helpful: true }),
        row({ subjectId: "m3", helpful: false }),
      ],
      matchCareerNames: new Map([
        ["m1", "Software Development"],
        ["m2", "Software Development"],
        ["m3", "Software Development"],
      ]),
      topRankedCareerNames: [],
    });
    expect(result.totalFeedback).toBe(3);
    expect(result.feedbackRatePercent).toBe(30); // 3/10
    expect(result.positiveRatePercent).toBe(67); // 2/3 rounded
  });
});

describe("computeFeedbackDashboard — per-career ranking", () => {
  it("excludes careers below the minimum feedback threshold from ranked lists", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 5,
      careerMatchFeedback: [row({ subjectId: "m1", helpful: false })], // only 1 piece of feedback
      matchCareerNames: new Map([["m1", "Graphic Design"]]),
      topRankedCareerNames: [],
    });
    expect(MIN_FEEDBACK_FOR_RANKING).toBeGreaterThan(1);
    expect(result.topRatedCareers).toEqual([]);
    expect(result.bottomRatedCareers).toEqual([]);
  });

  it("ranks top and bottom careers by positive rate once the threshold is met", () => {
    const feedback: CareerMatchFeedbackRow[] = [
      row({ subjectId: "good1", helpful: true }),
      row({ subjectId: "good2", helpful: true }),
      row({ subjectId: "bad1", helpful: false }),
      row({ subjectId: "bad2", helpful: false }),
    ];
    const matchCareerNames = new Map([
      ["good1", "Nursing & Community Health"],
      ["good2", "Nursing & Community Health"],
      ["bad1", "Cybersecurity Fundamentals"],
      ["bad2", "Cybersecurity Fundamentals"],
    ]);
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 20,
      careerMatchFeedback: feedback,
      matchCareerNames,
      topRankedCareerNames: [],
    });
    expect(result.topRatedCareers[0]?.careerName).toBe("Nursing & Community Health");
    expect(result.topRatedCareers[0]?.positiveRatePercent).toBe(100);
    expect(result.bottomRatedCareers[0]?.careerName).toBe("Cybersecurity Fundamentals");
    expect(result.bottomRatedCareers[0]?.positiveRatePercent).toBe(0);
  });

  it("silently skips a feedback row whose match id has no known career (defensive)", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 5,
      careerMatchFeedback: [row({ subjectId: "orphaned", helpful: true })],
      matchCareerNames: new Map(), // no entry for "orphaned"
      topRankedCareerNames: [],
    });
    expect(result.topRatedCareers).toEqual([]);
    // but the top-level count is unaffected — the vote still happened
    expect(result.totalFeedback).toBe(1);
  });
});

describe("computeFeedbackDashboard — negative reasons", () => {
  it("only counts reasons from negative feedback, never positive", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 5,
      careerMatchFeedback: [
        row({ subjectId: "m1", helpful: true, reason: "WANT_MORE_INFO" }),
        row({ subjectId: "m2", helpful: false, reason: "NOT_RELEVANT" }),
        row({ subjectId: "m3", helpful: false, reason: "NOT_RELEVANT" }),
      ],
      matchCareerNames: new Map([
        ["m1", "A"],
        ["m2", "B"],
        ["m3", "C"],
      ]),
      topRankedCareerNames: [],
    });
    expect(result.negativeReasonCounts).toEqual([{ reason: "NOT_RELEVANT", label: "Not relevant", count: 2 }]);
  });

  it("ignores negative feedback with no reason given", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 5,
      careerMatchFeedback: [row({ subjectId: "m1", helpful: false, reason: null })],
      matchCareerNames: new Map([["m1", "A"]]),
      topRankedCareerNames: [],
    });
    expect(result.negativeReasonCounts).toEqual([]);
  });
});

describe("computeFeedbackDashboard — mismatch-flagged careers", () => {
  it("only counts DOESNT_MATCH_INTERESTS/SUBJECTS, not other negative reasons", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 5,
      careerMatchFeedback: [
        row({ subjectId: "m1", helpful: false, reason: "DOESNT_MATCH_INTERESTS" }),
        row({ subjectId: "m2", helpful: false, reason: "NOT_RELEVANT" }),
      ],
      matchCareerNames: new Map([
        ["m1", "Data Analysis"],
        ["m2", "Data Analysis"],
      ]),
      topRankedCareerNames: [],
    });
    expect(result.mismatchFlaggedCareers).toEqual([{ careerName: "Data Analysis", count: 1 }]);
  });
});

describe("computeFeedbackDashboard — most top-matched careers (frequency proxy)", () => {
  it("counts frequency of appearance, sorted descending", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 0,
      careerMatchFeedback: [],
      matchCareerNames: new Map(),
      topRankedCareerNames: ["Software Development", "Software Development", "Graphic Design"],
    });
    expect(result.mostTopMatchedCareers).toEqual([
      { careerName: "Software Development", count: 2 },
      { careerName: "Graphic Design", count: 1 },
    ]);
  });
});

describe("computeFeedbackDashboard — daily trend", () => {
  it("buckets by UTC date and sorts ascending", () => {
    const result = computeFeedbackDashboard({
      totalRecommendationsGenerated: 0,
      careerMatchFeedback: [
        row({ subjectId: "m1", helpful: true, createdAt: new Date("2026-08-02T10:00:00Z") }),
        row({ subjectId: "m2", helpful: false, createdAt: new Date("2026-08-01T09:00:00Z") }),
        row({ subjectId: "m3", helpful: true, createdAt: new Date("2026-08-01T23:00:00Z") }),
      ],
      matchCareerNames: new Map(),
      topRankedCareerNames: [],
    });
    expect(result.dailyTrend).toEqual([
      { date: "2026-08-01", positive: 1, negative: 1 },
      { date: "2026-08-02", positive: 1, negative: 0 },
    ]);
  });
});
