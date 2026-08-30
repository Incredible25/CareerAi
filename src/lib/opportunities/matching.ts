/**
 * Deterministic opportunity matching (Phase 4, dev-order 6-7).
 *
 * Same philosophy as src/lib/career-engine/scoring.ts: plain TypeScript
 * over structured rows, never an LLM call, so the score is reproducible
 * and every "why" comes from the same numbers shown to the user. This is
 * a *relevance* score, never a probability of being accepted — that
 * framing must stay out of every string this module produces.
 *
 * Two scored factors, matching the brief's example breakdown (CAREER
 * ALIGNMENT / SKILL ALIGNMENT):
 *   - Career Alignment: reuses the user's own CareerMatch.fitScore for
 *     whichever of their career catalog entries this opportunity is
 *     editorially linked to (OpportunityCareer) — never recomputed from
 *     scratch, so it can't silently drift from what /matches already
 *     told the user.
 *   - Skill Alignment: overlap between OpportunitySkill requirements and
 *     the user's own skills. OpportunitySkill only records whether a
 *     skill is required or a nice-to-have — unlike CareerSkill, it does
 *     not store a required proficiency level — so this is ownership
 *     (has it / doesn't), not a level threshold.
 *
 * Eligibility (education / country / on-site location) is deliberately
 * NOT one of the weighted factors above. Per the brief, these are hard
 * filters that "cap-and-flag rather than exclude": each unmet check adds
 * a plain-language entry to eligibilityFlags and pulls matchScore down
 * to a ceiling, but never removes the opportunity from view or zeroes it
 * out — the user decides what "close enough" means for them.
 *
 * Experience requirement is shown to users as plain informational text
 * elsewhere (ExperienceRequirement on the opportunity itself) but is
 * never scored or flagged here: there is no field anywhere in the data
 * model capturing a user's work experience, and inventing one to compare
 * against would violate the standing "never invent work experience"
 * rule. Silence here is the honest behavior.
 */
import type { EducationLevel, RemoteStatus } from "@prisma/client";
import { meetsEducationLevel } from "@/lib/opportunities/education-level";
import { EDUCATION_LEVEL_LABELS } from "@/lib/opportunities/constants";

export const OPPORTUNITY_ENGINE_VERSION = "1.0.0";

const WEIGHTS = {
  careerAlignment: 0.55,
  skillAlignment: 0.45,
} as const;

export type OpportunitySkillRequirement = {
  skillId: string;
  name: string;
  required: boolean;
};

export type OpportunityUserSkillInput = { skillId: string };

export type OpportunityUserProfileInput = {
  country: string;
  educationLevel: EducationLevel | null;
  userSkills: OpportunityUserSkillInput[];
  /** careerId -> that career's CareerMatch.fitScore for this user, from their latest completed assessment. */
  careerFitByCareerId: Record<string, number>;
};

export type OpportunityForScoring = {
  id: string;
  country: string | null;
  remoteStatus: RemoteStatus;
  eligibleCountries: string[];
  minEducationLevel: EducationLevel | null;
  careerIds: string[];
  skills: OpportunitySkillRequirement[];
};

export type OpportunityMatchBreakdown = {
  careerAlignment: number;
  skillAlignment: number;
};

export type OpportunityMatchResult = {
  matchScore: number;
  breakdown: OpportunityMatchBreakdown;
  reasons: string[];
  eligibilityFlags: string[];
};

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Excellent / Strong / Good / Fair / Limited — the categorical label shown next to every numeric factor. */
export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Limited";
}

function scoreCareerAlignment(profile: OpportunityUserProfileInput, opportunity: OpportunityForScoring) {
  if (opportunity.careerIds.length === 0) {
    return { score: 50, bestCareerId: null as string | null };
  }
  let best = -1;
  let bestCareerId: string | null = null;
  for (const careerId of opportunity.careerIds) {
    const fit = profile.careerFitByCareerId[careerId];
    if (fit !== undefined && fit > best) {
      best = fit;
      bestCareerId = careerId;
    }
  }
  if (best < 0) return { score: 50, bestCareerId: null };
  return { score: best, bestCareerId };
}

function scoreSkillAlignment(profile: OpportunityUserProfileInput, requirements: OpportunitySkillRequirement[]) {
  if (requirements.length === 0) {
    return { score: 50, matchedNames: [] as string[], missingRequiredNames: [] as string[] };
  }
  let total = 0;
  const matchedNames: string[] = [];
  const missingRequiredNames: string[] = [];
  for (const req of requirements) {
    const owned = profile.userSkills.some((s) => s.skillId === req.skillId);
    if (owned) {
      total += 100;
      matchedNames.push(req.name);
    } else if (req.required) {
      missingRequiredNames.push(req.name);
    }
  }
  return { score: round(total / requirements.length), matchedNames, missingRequiredNames };
}

/** Hard-filter checks: each unmet one adds a flag and a ceiling; matchScore is capped at the lowest applicable ceiling. */
function checkEligibility(profile: OpportunityUserProfileInput, opportunity: OpportunityForScoring) {
  const flags: string[] = [];
  const ceilings: number[] = [];

  const educationOk = meetsEducationLevel(profile.educationLevel, opportunity.minEducationLevel);
  if (educationOk === false) {
    flags.push(
      `Requires ${EDUCATION_LEVEL_LABELS[opportunity.minEducationLevel as string]} — your profile shows ${
        EDUCATION_LEVEL_LABELS[profile.educationLevel as string] ?? "no education level set"
      }.`
    );
    ceilings.push(40);
  }

  if (opportunity.eligibleCountries.length > 0 && !opportunity.eligibleCountries.includes(profile.country)) {
    flags.push(
      `Open only to applicants from ${opportunity.eligibleCountries.join(", ")} — your profile shows ${profile.country}.`
    );
    ceilings.push(35);
  }

  if (opportunity.remoteStatus === "ON_SITE" && opportunity.country && opportunity.country !== profile.country) {
    flags.push(`In-person only, based in ${opportunity.country} — your profile shows ${profile.country}.`);
    ceilings.push(45);
  }

  return { flags, ceiling: ceilings.length > 0 ? Math.min(...ceilings) : 100 };
}

export function computeOpportunityMatch(
  profile: OpportunityUserProfileInput,
  opportunity: OpportunityForScoring
): OpportunityMatchResult {
  const career = scoreCareerAlignment(profile, opportunity);
  const skill = scoreSkillAlignment(profile, opportunity.skills);

  const breakdown: OpportunityMatchBreakdown = {
    careerAlignment: career.score,
    skillAlignment: skill.score,
  };

  const rawScore = round(breakdown.careerAlignment * WEIGHTS.careerAlignment + breakdown.skillAlignment * WEIGHTS.skillAlignment);
  const { flags, ceiling } = checkEligibility(profile, opportunity);
  const matchScore = clamp(Math.min(rawScore, ceiling), 0, 100);

  const reasons: string[] = [];
  if (career.bestCareerId && career.score >= 50) {
    reasons.push(`Linked to a career that's a ${scoreLabel(career.score).toLowerCase()} fit for you`);
  }
  if (skill.matchedNames.length > 0) {
    reasons.push(`You already have ${skill.matchedNames.slice(0, 3).join(", ").toLowerCase()}`);
  }
  if (skill.missingRequiredNames.length > 0 && skill.missingRequiredNames.length <= 2) {
    reasons.push(`Just missing ${skill.missingRequiredNames.join(", ").toLowerCase()} from the required skills`);
  }

  return { matchScore, breakdown, reasons, eligibilityFlags: flags };
}

export { WEIGHTS as OPPORTUNITY_MATCH_WEIGHTS };
