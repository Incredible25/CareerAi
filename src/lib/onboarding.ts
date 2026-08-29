/**
 * Progressive onboarding (docs/PRODUCT_STRATEGY.md §4): a handful of
 * questions per session rather than one long form. `Profile.onboardingStep`
 * stores how many of these have been completed, so a return visit resumes
 * instead of restarting.
 */
export const ONBOARDING_STEPS = [
  "education",
  "skills",
  "interests",
  "preferences",
  "access",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  education: "Education",
  skills: "Skills",
  interests: "Interests",
  preferences: "Goals & preferences",
  access: "Access & resources",
};

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function isOnboardingComplete(onboardingStep: number): boolean {
  return onboardingStep >= ONBOARDING_STEPS.length;
}

/** Profile-completeness percentage shown on the dashboard (§19). */
export function onboardingCompletenessPercent(onboardingStep: number): number {
  return Math.round(
    (Math.min(onboardingStep, ONBOARDING_STEPS.length) / ONBOARDING_STEPS.length) * 100
  );
}
