import { z } from "zod";

export const feedbackSchema = z.object({
  subjectType: z.enum(["AI_MESSAGE", "CAREER_MATCH"]),
  subjectId: z.string().min(1),
  helpful: z.boolean(),
  reason: z
    .enum([
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
    ])
    .nullable()
    .optional(),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
});
