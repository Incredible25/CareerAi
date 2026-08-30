import { z } from "zod";

export const saveOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
});

export const applicationUpdateSchema = z.object({
  status: z.enum([
    "SAVED",
    "PLANNING_TO_APPLY",
    "APPLIED",
    "INTERVIEW_SELECTION",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
  ]).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});
