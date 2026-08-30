import type { FeedbackReason } from "@prisma/client";

/**
 * Phase 5, Module 4 — plain-language labels for structured career-match
 * feedback reasons. Order here is display order everywhere it's rendered
 * (the feedback picker, the admin aggregation dashboard).
 */
export const FEEDBACK_REASON_LABELS: Record<FeedbackReason, string> = {
  NOT_RELEVANT: "Not relevant",
  ALREADY_KNEW: "Already knew this career",
  DOESNT_MATCH_INTERESTS: "Doesn't match my interests",
  DOESNT_MATCH_SUBJECTS: "Doesn't match my subjects",
  NOT_ACCESSIBLE: "Career is not accessible to me",
  WANT_MORE_INFO: "I want more information",
  OTHER: "Other",
};

export const FEEDBACK_REASON_ORDER: FeedbackReason[] = [
  "NOT_RELEVANT",
  "ALREADY_KNEW",
  "DOESNT_MATCH_INTERESTS",
  "DOESNT_MATCH_SUBJECTS",
  "NOT_ACCESSIBLE",
  "WANT_MORE_INFO",
  "OTHER",
];
