import { z } from "zod";

export const sourceSchema = z.object({
  name: z.string().trim().min(2, "Enter a source name.").max(200),
  type: z.enum([
    "OFFICIAL_ORGANIZATION",
    "GOVERNMENT",
    "UNIVERSITY",
    "INTERNATIONAL_ORGANIZATION",
    "PARTNER_ORGANIZATION",
    "APPROVED_PLATFORM",
    "OTHER",
  ]),
  url: z.string().trim().url("Enter a full URL, e.g. https://..."),
  trustLevel: z.enum(["HIGH", "MEDIUM", "LOW", "UNRATED"]).default("UNRATED"),
  active: z.boolean().default(true),
});

const commaList = z
  .string()
  .optional()
  .default("")
  .transform((val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

const optionalDate = z
  .string()
  .optional()
  .transform((val) => (val ? new Date(val) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date");

export const opportunitySchema = z.object({
  title: z.string().trim().min(3, "Enter a title.").max(300),
  organization: z.string().trim().min(2, "Enter an organization name.").max(300),
  category: z.enum([
    "JOB",
    "INTERNSHIP",
    "SCHOLARSHIP",
    "FELLOWSHIP",
    "GRANT",
    "COMPETITION",
    "VOLUNTEER",
    "REMOTE_WORK",
    "FREELANCE",
    "TRAINING_PROGRAM",
    "MENTORSHIP",
  ]),
  description: z.string().trim().min(10, "Add a description."),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  remoteStatus: z.enum(["REMOTE", "ON_SITE", "HYBRID", "UNSPECIFIED"]).default("UNSPECIFIED"),
  eligibleCountries: commaList,
  eligibilityText: z.string().trim().max(2000).optional().or(z.literal("")),
  minEducationLevel: z.enum(["SECONDARY", "UNIVERSITY", "GRADUATE", "OTHER", ""]).optional(),
  experienceRequirement: z
    .enum(["NONE", "ENTRY_LEVEL", "SOME_EXPERIENCE", "EXPERIENCED", "UNSPECIFIED"])
    .default("UNSPECIFIED"),
  applicationDeadline: optionalDate,
  applicationUrl: z.string().trim().url("Enter a full URL, e.g. https://..."),
  datePublished: optionalDate,
  sourceId: z.string().min(1, "Select a source."),
  sourceUrl: z.string().trim().url("Enter a full URL to the specific page this came from."),
  opportunityStatus: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  skillIds: z.array(z.string()).default([]),
  careerIds: z.array(z.string()).default([]),
});
