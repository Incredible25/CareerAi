import { z } from "zod";

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

export const educationStepSchema = z.object({
  level: z.enum(["SECONDARY", "UNIVERSITY", "GRADUATE", "OTHER"]),
  institution: z.string().trim().max(200).optional().or(z.literal("")),
  program: z.string().trim().max(200).optional().or(z.literal("")),
  subjects: commaList,
  strengths: commaList,
});

export const skillsStepSchema = z.object({
  skills: z
    .array(
      z.object({
        skillId: z.string().min(1),
        level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
      })
    )
    .default([]),
  otherSkills: commaList,
});

export const interestsStepSchema = z.object({
  interestIds: z.array(z.string().min(1)).default([]),
});

export const preferencesStepSchema = z.object({
  careerGoals: z.string().trim().max(1000).optional().or(z.literal("")),
  incomeGoal: z.string().trim().max(300).optional().or(z.literal("")),
  preferredEnvironment: z.enum(["REMOTE", "IN_PERSON", "HYBRID", "NO_PREFERENCE"]),
  availableHoursPerWeek: z.coerce.number().int().min(0).max(80),
});

export const accessStepSchema = z.object({
  hasLaptop: z.boolean(),
  hasSmartphone: z.boolean(),
  internetAccess: z.enum(["RELIABLE_DAILY", "INTERMITTENT", "LIMITED"]),
  languages: commaList,
  linkedinUrl: z
    .string()
    .trim()
    .url("Enter a full URL, e.g. https://linkedin.com/in/you")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z
    .string()
    .trim()
    .url("Enter a full URL, e.g. https://yoursite.com")
    .optional()
    .or(z.literal("")),
});

export const onboardingStepSchemas = {
  education: educationStepSchema,
  skills: skillsStepSchema,
  interests: interestsStepSchema,
  preferences: preferencesStepSchema,
  access: accessStepSchema,
} as const;
