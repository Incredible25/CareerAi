/**
 * Phase 5, Module 5 — admin feedback aggregation.
 *
 * Pure function over already-fetched rows (no DB access here, same
 * extraction pattern as career-engine/{scoring,progress,next-action}.ts)
 * so the aggregation logic is independently testable and the admin page
 * itself stays a thin fetch-and-render layer.
 *
 * Deliberately aggregate-only: no user id, name, or email appears
 * anywhere in the output — this reports on how the recommendation
 * engine is landing in general, not on any individual student.
 */
import type { FeedbackReason } from "@prisma/client";
import { FEEDBACK_REASON_LABELS } from "@/lib/feedback/constants";

// Below this many feedback entries, a career's positive-rate percentage is
// noise (one vote either way swings it 50+ points) — excluded from the
// ranked lists rather than shown with a misleadingly precise number.
export const MIN_FEEDBACK_FOR_RANKING = 2;
const RANKED_LIST_SIZE = 5;

const MISMATCH_REASONS: FeedbackReason[] = ["DOESNT_MATCH_INTERESTS", "DOESNT_MATCH_SUBJECTS"];

export type CareerMatchFeedbackRow = {
  subjectId: string;
  helpful: boolean;
  reason: FeedbackReason | null;
  createdAt: Date;
};

export type FeedbackAggregateInput = {
  totalRecommendationsGenerated: number;
  careerMatchFeedback: CareerMatchFeedbackRow[];
  /** CareerMatch.id -> career name, for every id referenced above. */
  matchCareerNames: Map<string, string>;
  /** One entry per CareerMatch row with rank <= 5 (duplicates = frequency). */
  topRankedCareerNames: string[];
};

export type CareerFeedbackStat = {
  careerName: string;
  positive: number;
  negative: number;
  total: number;
  positiveRatePercent: number;
};

export type ReasonCount = { reason: FeedbackReason; label: string; count: number };
export type CareerCount = { careerName: string; count: number };
export type DailyTrendPoint = { date: string; positive: number; negative: number };

export type FeedbackDashboardSummary = {
  totalRecommendationsGenerated: number;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  feedbackRatePercent: number;
  positiveRatePercent: number;
  topRatedCareers: CareerFeedbackStat[];
  bottomRatedCareers: CareerFeedbackStat[];
  negativeReasonCounts: ReasonCount[];
  mismatchFlaggedCareers: CareerCount[];
  mostTopMatchedCareers: CareerCount[];
  dailyTrend: DailyTrendPoint[];
  minFeedbackThresholdForRankedCareers: number;
};

function round(value: number): number {
  return Math.round(value);
}

export function computeFeedbackDashboard(input: FeedbackAggregateInput): FeedbackDashboardSummary {
  const { totalRecommendationsGenerated, careerMatchFeedback, matchCareerNames, topRankedCareerNames } = input;

  const totalFeedback = careerMatchFeedback.length;
  const positiveFeedback = careerMatchFeedback.filter((f) => f.helpful).length;
  const negativeFeedback = totalFeedback - positiveFeedback;

  const feedbackRatePercent = totalRecommendationsGenerated > 0 ? round((totalFeedback / totalRecommendationsGenerated) * 100) : 0;
  const positiveRatePercent = totalFeedback > 0 ? round((positiveFeedback / totalFeedback) * 100) : 0;

  // Per-career positive/negative tally.
  const byCareer = new Map<string, { positive: number; negative: number }>();
  for (const row of careerMatchFeedback) {
    const careerName = matchCareerNames.get(row.subjectId);
    if (!careerName) continue; // defensive: a match row that no longer exists
    const entry = byCareer.get(careerName) ?? { positive: 0, negative: 0 };
    if (row.helpful) entry.positive += 1;
    else entry.negative += 1;
    byCareer.set(careerName, entry);
  }

  const careerStats: CareerFeedbackStat[] = [...byCareer.entries()]
    .map(([careerName, { positive, negative }]) => {
      const total = positive + negative;
      return { careerName, positive, negative, total, positiveRatePercent: total > 0 ? round((positive / total) * 100) : 0 };
    })
    .filter((s) => s.total >= MIN_FEEDBACK_FOR_RANKING);

  const topRatedCareers = [...careerStats]
    .sort((a, b) => b.positiveRatePercent - a.positiveRatePercent || b.total - a.total)
    .slice(0, RANKED_LIST_SIZE);

  const bottomRatedCareers = [...careerStats]
    .sort((a, b) => a.positiveRatePercent - b.positiveRatePercent || b.total - a.total)
    .slice(0, RANKED_LIST_SIZE);

  // Reasons behind negative feedback specifically — a positive vote's
  // reason (if any) isn't "why wasn't this useful," so it's excluded here.
  const reasonCounts = new Map<FeedbackReason, number>();
  for (const row of careerMatchFeedback) {
    if (row.helpful || !row.reason) continue;
    reasonCounts.set(row.reason, (reasonCounts.get(row.reason) ?? 0) + 1);
  }
  const negativeReasonCounts: ReasonCount[] = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, label: FEEDBACK_REASON_LABELS[reason], count }))
    .sort((a, b) => b.count - a.count);

  // Careers whose explanation apparently didn't land — flagged as an
  // interest or subject mismatch specifically, not just "not relevant."
  const mismatchCounts = new Map<string, number>();
  for (const row of careerMatchFeedback) {
    if (row.helpful || !row.reason || !MISMATCH_REASONS.includes(row.reason)) continue;
    const careerName = matchCareerNames.get(row.subjectId);
    if (!careerName) continue;
    mismatchCounts.set(careerName, (mismatchCounts.get(careerName) ?? 0) + 1);
  }
  const mismatchFlaggedCareers: CareerCount[] = [...mismatchCounts.entries()]
    .map(([careerName, count]) => ({ careerName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, RANKED_LIST_SIZE);

  // "Frequently requested" isn't literally trackable — there's no request
  // feature — so this reports the closest honest proxy: how often a career
  // lands in someone's top 5 matches, across all users.
  const topMatchCounts = new Map<string, number>();
  for (const name of topRankedCareerNames) {
    topMatchCounts.set(name, (topMatchCounts.get(name) ?? 0) + 1);
  }
  const mostTopMatchedCareers: CareerCount[] = [...topMatchCounts.entries()]
    .map(([careerName, count]) => ({ careerName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, RANKED_LIST_SIZE);

  const trendByDate = new Map<string, { positive: number; negative: number }>();
  for (const row of careerMatchFeedback) {
    const date = row.createdAt.toISOString().slice(0, 10);
    const entry = trendByDate.get(date) ?? { positive: 0, negative: 0 };
    if (row.helpful) entry.positive += 1;
    else entry.negative += 1;
    trendByDate.set(date, entry);
  }
  const dailyTrend: DailyTrendPoint[] = [...trendByDate.entries()]
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalRecommendationsGenerated,
    totalFeedback,
    positiveFeedback,
    negativeFeedback,
    feedbackRatePercent,
    positiveRatePercent,
    topRatedCareers,
    bottomRatedCareers,
    negativeReasonCounts,
    mismatchFlaggedCareers,
    mostTopMatchedCareers,
    dailyTrend,
    minFeedbackThresholdForRankedCareers: MIN_FEEDBACK_FOR_RANKING,
  };
}
