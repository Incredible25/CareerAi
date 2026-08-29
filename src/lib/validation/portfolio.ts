import { z } from "zod";

export const portfolioProjectSchema = z.object({
  title: z.string().trim().min(2, "Give it a short title.").max(200),
  description: z.string().trim().min(1, "Add a short description.").max(2000),
  link: z.string().trim().url("Enter a full URL, e.g. https://...").optional().or(z.literal("")),
  careerId: z.string().optional().or(z.literal("")),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).default("PLANNED"),
});

export const portfolioStatusSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]),
});
