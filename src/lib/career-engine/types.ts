import type { SkillLevel, WorkEnvironment } from "@prisma/client";
import type { TraitKey } from "@/lib/assessment/questions";

export type UserSkillInput = { skillId: string; name: string; level: SkillLevel };

/** The structured profile the scoring engine reads (docs/PRODUCT_STRATEGY.md §7/§29). */
export type UserProfileInput = {
  userSkills: UserSkillInput[];
  interestNames: string[];
  subjects: string[];
  traitScores: Partial<Record<TraitKey, number>>;
  preferredEnvironment: WorkEnvironment | null;
  availableHoursPerWeek: number | null;
};

export type CareerSkillRequirement = { skillId: string; name: string; level: SkillLevel };

export type CareerForScoring = {
  id: string;
  relevantInterests: string[];
  relevantSubjects: string[];
  traitWeights: Partial<Record<TraitKey, number>>;
  environments: WorkEnvironment[];
  careerSkills: CareerSkillRequirement[];
};

export type SideOpportunityForScoring = {
  id: string;
  skills: CareerSkillRequirement[];
};

export type FitBreakdown = {
  interestMatch: number;
  skillMatch: number;
  subjectMatch: number;
  strengthMatch: number;
  workPreferenceMatch: number;
  learningFeasibility: number;
};

export type FitResult = {
  fitScore: number;
  breakdown: FitBreakdown;
  reasons: string[];
  gapSkillIds: string[];
};

export type SideIncomeBreakdown = {
  skillMatch: number;
  learningFeasibility: number;
};

export type SideIncomeFitResult = {
  fitScore: number;
  breakdown: SideIncomeBreakdown;
  reasons: string[];
  missingSkillNames: string[];
};
