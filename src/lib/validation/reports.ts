import { z } from "zod";

export const reportOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  reason: z.enum([
    "SUSPICIOUS_OPPORTUNITY",
    "BROKEN_LINK",
    "INCORRECT_INFORMATION",
    "EXPIRED",
    "MISLEADING_REQUIREMENTS",
    "SUSPICIOUS_ORGANIZATION",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
