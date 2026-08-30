import { z } from "zod";

export const feedbackSchema = z.object({
  subjectType: z.enum(["AI_MESSAGE", "CAREER_MATCH"]),
  subjectId: z.string().min(1),
  helpful: z.boolean(),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
});
