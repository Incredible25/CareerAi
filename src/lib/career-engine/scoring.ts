/**
 * Deterministic career & side-income fit scoring
 * (docs/PRODUCT_STRATEGY.md §8, §9, and the "AI architecture" implementation
 * note added in the August 2026 scope amendment).
 *
 * This is plain TypeScript, not an LLM call: every factor below is
 * computable directly from structured rows, and computing it in code
 * means the score is reproducible, auditable, and impossible to
 * hallucinate — the "why" text is built from the same sub-scores shown
 * to the user, not separately generated prose that could drift from the
 * number next to it. See §7 of the strategy doc for the full reasoning.
 *
 * Weights are the MVP v1 formula: the original 8-factor design's Goal
 * Match and Opportunity Relevance factors are dropped (not honestly
 * computable yet) and the remaining six are renormalized to 100%.
 */
import { meetsLevel, SKILL_LEVEL_ORDER } from "@/lib/career-engine/skill-level";
import { TRAIT_LABELS } from "@/lib/assessment/scoring";
import type { TraitKey } from "@/lib/assessment/questions";
import type {
  CareerForScoring,
  FitBreakdown,
  FitResult,
  SideIncomeBreakdown,
  SideIncomeFitResult,
  SideOpportunityForScoring,
  UserProfileInput,
} from "@/lib/career-engine/types";

/**
 * Bump this whenever the scoring formula itself changes (weights, factors
 * added/removed, the underlying math) — never for catalog content changes
 * like new careers. Stored on every CareerMatch/SideIncomeMatch row
 * (Phase 2, Module 2) so results stay auditable: which rows were computed
 * under which rules.
 */
export const CAREER_ENGINE_VERSION = "1.0.0";

const WEIGHTS = {
  interestMatch: 0.25,
  skillMatch: 0.25,
  subjectMatch: 0.15,
  strengthMatch: 0.15,
  workPreferenceMatch: 0.1,
  learningFeasibility: 0.1,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value);
}

function scoreInterestMatch(profile: UserProfileInput, career: CareerForScoring) {
  const relevant = career.relevantInterests;
  if (relevant.length === 0) return { score: 50, matched: [] as string[] };
  const matched = relevant.filter((name) => profile.interestNames.includes(name));
  return { score: round((matched.length / relevant.length) * 100), matched };
}

function scoreSubjectMatch(profile: UserProfileInput, career: CareerForScoring) {
  const relevant = career.relevantSubjects;
  if (relevant.length === 0) return { score: 50, matched: [] as string[] };
  const normalizedUser = profile.subjects.map((s) => s.toLowerCase().trim()).filter(Boolean);
  const matched = relevant.filter((subject) => {
    const s = subject.toLowerCase();
    return normalizedUser.some((u) => u.includes(s) || s.includes(u));
  });
  return { score: round((matched.length / relevant.length) * 100), matched };
}

function scoreSkillMatch(profile: UserProfileInput, requirements: { skillId: string; name: string; level: import("@prisma/client").SkillLevel }[]) {
  if (requirements.length === 0) {
    return { score: 50, matchedNames: [] as string[], gapSkillIds: [] as string[], gapCount: 0 };
  }
  let total = 0;
  const matchedNames: string[] = [];
  const gapSkillIds: string[] = [];
  for (const req of requirements) {
    const owned = profile.userSkills.find((s) => s.skillId === req.skillId);
    if (owned && meetsLevel(owned.level, req.level)) {
      total += 100;
      matchedNames.push(req.name);
    } else if (owned) {
      total += 60; // has the skill, below the required level — partial credit, still a gap
      gapSkillIds.push(req.skillId);
    } else {
      gapSkillIds.push(req.skillId);
    }
  }
  return {
    score: round(total / requirements.length),
    matchedNames,
    gapSkillIds,
    gapCount: gapSkillIds.length,
  };
}

function scoreStrengthMatch(profile: UserProfileInput, career: CareerForScoring) {
  const entries = Object.entries(career.traitWeights) as [TraitKey, number][];
  if (entries.length === 0) return { score: 50, topTraits: [] as TraitKey[] };

  let weightedSum = 0;
  let weightTotal = 0;
  for (const [trait, weight] of entries) {
    const userScore = profile.traitScores[trait] ?? 50;
    weightedSum += weight * userScore;
    weightTotal += weight;
  }

  const topTraits = entries
    .filter(([trait]) => (profile.traitScores[trait] ?? 0) >= 65)
    .sort(([, wa], [, wb]) => wb - wa)
    .slice(0, 2)
    .map(([trait]) => trait);

  return { score: weightTotal > 0 ? round(weightedSum / weightTotal) : 50, topTraits };
}

function scoreWorkPreferenceMatch(profile: UserProfileInput, career: CareerForScoring) {
  if (!profile.preferredEnvironment || profile.preferredEnvironment === "NO_PREFERENCE") return 100;
  if (career.environments.length === 0) return 50;
  return career.environments.includes(profile.preferredEnvironment) ? 100 : 30;
}

function scoreLearningFeasibility(profile: UserProfileInput, gapCount: number) {
  let base = clamp(100 - gapCount * 12, 0, 100);
  const hours = profile.availableHoursPerWeek ?? 5;
  if (hours < 3) base *= 0.7;
  else if (hours < 10) base *= 0.85;
  return round(base);
}

export function computeCareerFit(profile: UserProfileInput, career: CareerForScoring): FitResult {
  const interest = scoreInterestMatch(profile, career);
  const subject = scoreSubjectMatch(profile, career);
  const skill = scoreSkillMatch(profile, career.careerSkills);
  const strength = scoreStrengthMatch(profile, career);
  const workPreference = scoreWorkPreferenceMatch(profile, career);
  const feasibility = scoreLearningFeasibility(profile, skill.gapCount);

  const breakdown: FitBreakdown = {
    interestMatch: interest.score,
    skillMatch: skill.score,
    subjectMatch: subject.score,
    strengthMatch: strength.score,
    workPreferenceMatch: workPreference,
    learningFeasibility: feasibility,
  };

  const fitScore = round(
    breakdown.interestMatch * WEIGHTS.interestMatch +
      breakdown.skillMatch * WEIGHTS.skillMatch +
      breakdown.subjectMatch * WEIGHTS.subjectMatch +
      breakdown.strengthMatch * WEIGHTS.strengthMatch +
      breakdown.workPreferenceMatch * WEIGHTS.workPreferenceMatch +
      breakdown.learningFeasibility * WEIGHTS.learningFeasibility
  );

  // Reasons are built from the same sub-scores above, ranked by
  // contribution — never separately generated text.
  const candidates: { weight: number; text: string }[] = [];
  for (const name of interest.matched.slice(0, 2)) {
    candidates.push({ weight: WEIGHTS.interestMatch * interest.score, text: `Strong interest in ${name.toLowerCase()}` });
  }
  for (const name of skill.matchedNames.slice(0, 2)) {
    candidates.push({ weight: WEIGHTS.skillMatch * skill.score, text: `You already have ${name.toLowerCase()}` });
  }
  for (const trait of strength.topTraits) {
    candidates.push({
      weight: WEIGHTS.strengthMatch * (profile.traitScores[trait] ?? 0),
      text: `Matches your strength in ${TRAIT_LABELS[trait].toLowerCase()}`,
    });
  }
  for (const subj of subject.matched.slice(0, 1)) {
    candidates.push({ weight: WEIGHTS.subjectMatch * subject.score, text: `Your background in ${subj} lines up with this field` });
  }
  if (workPreference === 100 && profile.preferredEnvironment && profile.preferredEnvironment !== "NO_PREFERENCE") {
    const label = profile.preferredEnvironment === "REMOTE" ? "remote" : profile.preferredEnvironment === "IN_PERSON" ? "in-person" : "hybrid";
    candidates.push({ weight: WEIGHTS.workPreferenceMatch * 100, text: `Fits your preference for ${label} work` });
  }

  const reasons = candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((c) => c.text);

  return { fitScore, breakdown, reasons, gapSkillIds: skill.gapSkillIds };
}

export function computeSideIncomeFit(
  profile: UserProfileInput,
  opportunity: SideOpportunityForScoring
): SideIncomeFitResult {
  const skill = scoreSkillMatch(profile, opportunity.skills);
  const feasibility = scoreLearningFeasibility(profile, skill.gapCount);

  const breakdown: SideIncomeBreakdown = {
    skillMatch: skill.score,
    learningFeasibility: feasibility,
  };

  const fitScore = round(breakdown.skillMatch * 0.65 + breakdown.learningFeasibility * 0.35);

  const reasons = skill.matchedNames
    .slice(0, 3)
    .map((name) => `You already have ${name.toLowerCase()}`);

  const missingSkillNames = opportunity.skills
    .filter((req) => skill.gapSkillIds.includes(req.skillId))
    .map((req) => req.name);

  return { fitScore, breakdown, reasons, missingSkillNames };
}

export { WEIGHTS as CAREER_FIT_WEIGHTS, SKILL_LEVEL_ORDER };
