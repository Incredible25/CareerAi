import { z } from "zod";

export const AGE_RANGES = [
  "UNDER_16",
  "AGE_16_18",
  "AGE_19_24",
  "AGE_25_30",
  "OVER_30",
] as const;

export const AGE_RANGE_LABELS: Record<(typeof AGE_RANGES)[number], string> = {
  UNDER_16: "Under 16",
  AGE_16_18: "16–18",
  AGE_19_24: "19–24",
  AGE_25_30: "25–30",
  OVER_30: "Over 30",
};

// Age ranges that trigger the minor-safeguarding defaults described in
// docs/PRODUCT_STRATEGY.md §13: minimum-necessary profile fields, no
// behavioral marketing, consent copy written for a younger reader.
export const MINOR_AGE_RANGES = new Set(["UNDER_16", "AGE_16_18"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200),
  ageRange: z.enum(AGE_RANGES),
  country: z.string().trim().min(2, "Select your country."),
  city: z.string().trim().max(120).optional().or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Enter your password."),
});
