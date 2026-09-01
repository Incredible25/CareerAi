/**
 * Phase 7 Step 10 — beta-specific feedback patterns, layered on top of
 * (not replacing) src/lib/feedback/aggregate.ts's existing dashboard.
 * Same conventions: a pure function over already-fetched rows, and
 * aggregate-only output — no user id, name, email, or free-text comment
 * anywhere below, consistent with the existing admin feedback dashboard's
 * privacy guarantee (docs/SECURITY_PRIVACY_REVIEW.md §7). Answers the
 * four questions from the Step 10 brief that computeFeedbackDashboard()
 * doesn't: which profile types produce poor recommendations, whether
 * there are age-group patterns, whether there are device/connectivity
 * patterns, and which issues are critical versus quality.
 */
import type { AgeRange, FeedbackReason } from "@prisma/client";
import { AGE_RANGE_LABELS } from "@/lib/validation/auth";

// The one reason Step 5 (docs/PHASE_7_FAILURE_LEVELS.md) treats as
// critical by default, not routine quality triage.
const CRITICAL_REASON: FeedbackReason = "INAPPROPRIATE";

export type LabeledCount = { label: string; count: number };

export type BetaFeedbackPatternsInput = {
  rows: {
    helpful: boolean;
    reason: FeedbackReason | null;
    careerName: string | null;
    ageRange: AgeRange;
    educationLevel: string | null;
    hasLaptop: boolean | null;
    hasSmartphone: boolean | null;
    internetAccess: string | null;
  }[];
};

export type BetaFeedbackPatterns = {
  negativeFeedbackByAgeRange: LabeledCount[];
  negativeFeedbackByEducationLevel: LabeledCount[];
  negativeFeedbackByInternetAccess: LabeledCount[];
  negativeFeedbackByDeviceAccess: LabeledCount[];
  criticalReportsByCareer: LabeledCount[];
  criticalReportCount: number;
};

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  SECONDARY: "Secondary school",
  UNIVERSITY: "University",
  GRADUATE: "Graduate / postgraduate",
  OTHER: "Other / self-directed",
};

const INTERNET_ACCESS_LABELS: Record<string, string> = {
  RELIABLE_DAILY: "Reliable, most days",
  INTERMITTENT: "On and off",
  LIMITED: "Limited",
};

function deviceAccessLabel(hasLaptop: boolean | null, hasSmartphone: boolean | null): string {
  if (hasLaptop && hasSmartphone) return "Laptop + smartphone";
  if (hasLaptop) return "Laptop only";
  if (hasSmartphone) return "Smartphone only";
  return "Neither / not stated";
}

function tally(items: string[]): LabeledCount[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function computeBetaFeedbackPatterns(input: BetaFeedbackPatternsInput): BetaFeedbackPatterns {
  const negative = input.rows.filter((r) => !r.helpful);

  const negativeFeedbackByAgeRange = tally(negative.map((r) => AGE_RANGE_LABELS[r.ageRange]));
  const negativeFeedbackByEducationLevel = tally(
    negative
      .filter((r) => r.educationLevel !== null)
      .map((r) => EDUCATION_LEVEL_LABELS[r.educationLevel!] ?? r.educationLevel!)
  );
  const negativeFeedbackByInternetAccess = tally(
    negative
      .filter((r) => r.internetAccess !== null)
      .map((r) => INTERNET_ACCESS_LABELS[r.internetAccess!] ?? r.internetAccess!)
  );
  const negativeFeedbackByDeviceAccess = tally(
    negative.map((r) => deviceAccessLabel(r.hasLaptop, r.hasSmartphone))
  );

  const criticalRows = input.rows.filter((r) => r.reason === CRITICAL_REASON && r.careerName);
  const criticalReportsByCareer = tally(criticalRows.map((r) => r.careerName!));

  return {
    negativeFeedbackByAgeRange,
    negativeFeedbackByEducationLevel,
    negativeFeedbackByInternetAccess,
    negativeFeedbackByDeviceAccess,
    criticalReportsByCareer,
    criticalReportCount: criticalRows.length,
  };
}
