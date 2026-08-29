import { ASSESSMENT_QUESTIONS, type TraitKey } from "@/lib/assessment/questions";

export const TRAIT_LABELS: Record<TraitKey, string> = {
  creativity: "Creativity",
  analyticalThinking: "Analytical thinking",
  problemSolving: "Problem-solving drive",
  communication: "Communication",
  leadership: "Leadership",
  teamOrientation: "Team orientation",
  socialOrientation: "Social orientation",
  technologyInterest: "Technology interest",
  businessOrientation: "Business orientation",
  practicalPreference: "Hands-on preference",
  motivation: "Self-motivation",
  structurePreference: "Preference for structure",
};

export type TraitScores = Partial<Record<TraitKey, number>>;

/**
 * Averages 1–5 answers per trait and rescales to 0–100, which is the shape
 * the Phase 2 recommendation engine will read as one input into the
 * Career Fit Score (docs/PRODUCT_STRATEGY.md §8). This is a plain average,
 * not a normed psychometric score — the assessment is explicitly a
 * guidance tool, not a validated instrument.
 */
export function computeTraitScores(
  answers: { trait: string; value: number }[]
): TraitScores {
  const sums = new Map<string, { total: number; count: number }>();
  for (const answer of answers) {
    const entry = sums.get(answer.trait) ?? { total: 0, count: 0 };
    entry.total += answer.value;
    entry.count += 1;
    sums.set(answer.trait, entry);
  }

  const scores: TraitScores = {};
  for (const [trait, { total, count }] of sums) {
    const average = total / count; // 1..5
    scores[trait as TraitKey] = Math.round(((average - 1) / 4) * 100);
  }
  return scores;
}

export const TOTAL_QUESTIONS = ASSESSMENT_QUESTIONS.length;
