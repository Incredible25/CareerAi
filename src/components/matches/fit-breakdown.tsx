import { CAREER_FIT_WEIGHTS } from "@/lib/career-engine/scoring";
import type { FitBreakdown } from "@/lib/career-engine/types";

const FACTOR_LABELS: Record<keyof FitBreakdown, string> = {
  interestMatch: "Interests",
  skillMatch: "Skills",
  subjectMatch: "Subjects",
  strengthMatch: "Strengths",
  workPreferenceMatch: "Work style",
  goalMatch: "Your stated goal",
  learningFeasibility: "Learning feasibility",
};

// Display order follows weight, heaviest first — matches how the score
// is actually composed, not object key order.
const FACTOR_ORDER: (keyof FitBreakdown)[] = [
  "interestMatch",
  "skillMatch",
  "subjectMatch",
  "strengthMatch",
  "workPreferenceMatch",
  "goalMatch",
  "learningFeasibility",
];

function isFitBreakdown(value: unknown): value is FitBreakdown {
  return typeof value === "object" && value !== null && "interestMatch" in value;
}

export function FitBreakdownDetails({ breakdown }: { breakdown: unknown }) {
  if (!isFitBreakdown(breakdown)) return null;

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">
        See how this score was calculated
      </summary>
      <div className="mt-2.5 space-y-2">
        {FACTOR_ORDER.map((key) => {
          const score = breakdown[key];
          const weight = Math.round(CAREER_FIT_WEIGHTS[key] * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  {FACTOR_LABELS[key]} <span className="text-ink-faint">({weight}% of score)</span>
                </span>
                <span className="font-mono text-ink-faint">{score}%</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        Every factor above is calculated directly from your profile and assessment — nothing here
        is generated or estimated by AI.
      </p>
    </details>
  );
}
