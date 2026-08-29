import { ONBOARDING_STEPS, ONBOARDING_STEP_LABELS } from "@/lib/onboarding";

export function OnboardingProgressBar({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {ONBOARDING_STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li
            key={step}
            className={
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium " +
              (state === "done"
                ? "border-green-500 bg-green-50 text-green-500"
                : state === "current"
                  ? "border-navy-500 bg-navy-50 text-navy-500"
                  : "border-sand-300 bg-white text-ink-faint")
            }
          >
            <span className="font-mono">{state === "done" ? "✓" : i + 1}</span>
            {ONBOARDING_STEP_LABELS[step]}
          </li>
        );
      })}
    </ol>
  );
}
