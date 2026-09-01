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
  // Phase 7 Step 4 (docs/PHASE_7_BETA_FEEDBACK.md) — added for the beta's
  // D-I reason set.
  CONFUSING: "The explanation was confusing",
  TOO_GENERIC: "Felt too generic",
  CONTRADICTORY: "Seemed contradictory",
  INAPPROPRIATE: "Seemed inappropriate",
  INSUFFICIENT_EXPLANATION: "The explanation wasn't convincing enough",
  TECHNICAL_PROBLEM: "Technical problem",
  OTHER: "Other",
};

export const FEEDBACK_REASON_ORDER: FeedbackReason[] = [
  "NOT_RELEVANT",
  "ALREADY_KNEW",
  "DOESNT_MATCH_INTERESTS",
  "DOESNT_MATCH_SUBJECTS",
  "NOT_ACCESSIBLE",
  "WANT_MORE_INFO",
  "CONFUSING",
  "TOO_GENERIC",
  "CONTRADICTORY",
  "INAPPROPRIATE",
  "INSUFFICIENT_EXPLANATION",
  "TECHNICAL_PROBLEM",
  "OTHER",
];
