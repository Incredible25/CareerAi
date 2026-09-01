"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS, ONBOARDING_STEP_LABELS, type OnboardingStep } from "@/lib/onboarding";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";
import { EducationStep, type EducationStepValues } from "@/components/onboarding/steps/education-step";
import { SkillsStep, type SkillsStepValues } from "@/components/onboarding/steps/skills-step";
import { InterestsStep, type InterestsStepValues } from "@/components/onboarding/steps/interests-step";
import { PreferencesStep, type PreferencesStepValues } from "@/components/onboarding/steps/preferences-step";
import { AccessStep, type AccessStepValues } from "@/components/onboarding/steps/access-step";
import { Logo } from "@/components/logo";

type CatalogItem = { id: string; name: string; category: string | null };

type InitialData = {
  education: EducationStepValues | null;
  skills: { skillId: string; level: string }[];
  interestIds: string[];
  preferences: PreferencesStepValues;
  access: AccessStepValues;
};

export function OnboardingFlow({
  startStepIndex,
  firstName,
  skillCatalog,
  interestCatalog,
  initialData,
  isMinor,
}: {
  startStepIndex: number;
  firstName: string;
  skillCatalog: CatalogItem[];
  interestCatalog: CatalogItem[];
  initialData: InitialData;
  isMinor: boolean;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(startStepIndex, ONBOARDING_STEPS.length - 1)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: OnboardingStep = ONBOARDING_STEPS[currentIndex]!;

  async function submitStep(data: unknown) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't save that step. Please try again.");
        setSubmitting(false);
        return;
      }
      if (currentIndex === ONBOARDING_STEPS.length - 1) {
        router.push("/assessment");
        router.refresh();
        return;
      }
      setCurrentIndex((i) => i + 1);
      setSubmitting(false);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>

      <main className="mx-auto max-w-xl px-6 pb-24">
        <h1 className="text-2xl font-bold text-ink">
          {currentIndex === 0 ? `Let's get to know you, ${firstName}` : ONBOARDING_STEP_LABELS[step]}
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Step {currentIndex + 1} of {ONBOARDING_STEPS.length} — you can stop anytime and pick up
          where you left off.
        </p>

        <div className="mt-6">
          <OnboardingProgressBar currentIndex={currentIndex} />
        </div>

        <div className="card mt-8">
          {error && (
            <p role="alert" className="mb-4 rounded-lg2 border border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-600">
              {error}
            </p>
          )}

          {step === "education" && (
            <EducationStep
              defaultValues={initialData.education}
              submitting={submitting}
              onSubmit={(data: EducationStepValues) => submitStep(data)}
            />
          )}
          {step === "skills" && (
            <SkillsStep
              catalog={skillCatalog}
              defaultSelected={initialData.skills}
              submitting={submitting}
              onSubmit={(data: SkillsStepValues) => submitStep(data)}
            />
          )}
          {step === "interests" && (
            <InterestsStep
              catalog={interestCatalog}
              defaultSelected={initialData.interestIds}
              submitting={submitting}
              onSubmit={(data: InterestsStepValues) => submitStep(data)}
            />
          )}
          {step === "preferences" && (
            <PreferencesStep
              defaultValues={initialData.preferences}
              submitting={submitting}
              onSubmit={(data: PreferencesStepValues) => submitStep(data)}
            />
          )}
          {step === "access" && (
            <AccessStep
              defaultValues={initialData.access}
              submitting={submitting}
              isMinor={isMinor}
              onSubmit={(data: AccessStepValues) => submitStep(data)}
            />
          )}
        </div>

        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="mt-4 text-sm font-medium text-ink-soft hover:text-ink"
          >
            ← Back
          </button>
        )}
      </main>
    </div>
  );
}
