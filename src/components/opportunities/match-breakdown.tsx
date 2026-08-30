import { OPPORTUNITY_MATCH_WEIGHTS, scoreLabel, type OpportunityMatchBreakdown } from "@/lib/opportunities/matching";

const FACTOR_LABELS: Record<keyof OpportunityMatchBreakdown, string> = {
  careerAlignment: "Career alignment",
  skillAlignment: "Skill alignment",
};

const FACTOR_ORDER: (keyof OpportunityMatchBreakdown)[] = ["careerAlignment", "skillAlignment"];

function isOpportunityBreakdown(value: unknown): value is OpportunityMatchBreakdown {
  return typeof value === "object" && value !== null && "careerAlignment" in value && "skillAlignment" in value;
}

export function OpportunityMatchBreakdownDetails({ breakdown }: { breakdown: unknown }) {
  if (!isOpportunityBreakdown(breakdown)) return null;

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">
        See how this score was calculated
      </summary>
      <div className="mt-2.5 space-y-2">
        {FACTOR_ORDER.map((key) => {
          const score = breakdown[key];
          const weight = Math.round(OPPORTUNITY_MATCH_WEIGHTS[key] * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">
                  {FACTOR_LABELS[key]} <span className="text-ink-faint">({weight}% of score)</span>
                </span>
                <span className="font-mono text-ink-faint">
                  {scoreLabel(score)} · {score}%
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        Calculated directly from your profile, skills, and career matches — a relevance score, not
        a probability of being accepted. Nothing here is AI-generated.
      </p>
    </details>
  );
}
