import { describe, expect, it } from "vitest";
import { computeCareerFit, computeSideIncomeFit, CAREER_FIT_WEIGHTS } from "@/lib/career-engine/scoring";
import type { CareerForScoring, SideOpportunityForScoring, UserProfileInput } from "@/lib/career-engine/types";

function baseProfile(overrides: Partial<UserProfileInput> = {}): UserProfileInput {
  return {
    userSkills: [],
    interestNames: [],
    subjects: [],
    traitScores: {},
    preferredEnvironment: null,
    availableHoursPerWeek: null,
    careerGoals: null,
    ...overrides,
  };
}

function baseCareer(overrides: Partial<CareerForScoring> = {}): CareerForScoring {
  return {
    id: "career-1",
    name: "Software Development",
    industry: "Technology",
    relevantInterests: [],
    relevantSubjects: [],
    traitWeights: {},
    environments: [],
    careerSkills: [],
    ...overrides,
  };
}

describe("computeCareerFit — weight configuration", () => {
  it("weights sum to exactly 1.00", () => {
    const total = Object.values(CAREER_FIT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe("computeCareerFit — determinism", () => {
  it("returns identical output for identical input, called twice", () => {
    const profile = baseProfile({ interestNames: ["Technology & software"], subjects: ["Math"] });
    const career = baseCareer({ relevantInterests: ["Technology & software"], relevantSubjects: ["Math"] });
    const a = computeCareerFit(profile, career);
    const b = computeCareerFit(profile, career);
    expect(a).toEqual(b);
  });
});

describe("computeCareerFit — empty/missing-data profile", () => {
  it("scores every empty-catalog factor at the neutral default (50) when both profile and career data are empty", () => {
    const result = computeCareerFit(baseProfile(), baseCareer());
    // interest/subject/skill/strength all default to 50 when the career lists nothing;
    // goal defaults to 50 when the user typed nothing; work preference defaults to
    // 100 when the user has no stated preference.
    expect(result.breakdown.interestMatch).toBe(50);
    expect(result.breakdown.subjectMatch).toBe(50);
    expect(result.breakdown.skillMatch).toBe(50);
    expect(result.breakdown.strengthMatch).toBe(50);
    expect(result.breakdown.goalMatch).toBe(50);
    expect(result.breakdown.workPreferenceMatch).toBe(100);
  });

  it("produces a fitScore strictly between 0 and 100 for a fully empty profile/career pair", () => {
    const result = computeCareerFit(baseProfile(), baseCareer());
    expect(result.fitScore).toBeGreaterThan(0);
    expect(result.fitScore).toBeLessThanOrEqual(100);
  });

  it("scores interest match as 0 (not 50) when the career lists interests but the user selected none", () => {
    const result = computeCareerFit(baseProfile(), baseCareer({ relevantInterests: ["Technology & software", "Business"] }));
    expect(result.breakdown.interestMatch).toBe(0);
  });
});

describe("computeCareerFit — full match scenario", () => {
  it("scores near-100 when every factor is a strong match", () => {
    const profile = baseProfile({
      interestNames: ["Technology & software"],
      subjects: ["Computer Science"],
      traitScores: { analyticalThinking: 90, problemSolving: 85, technologyInterest: 95 },
      preferredEnvironment: "REMOTE",
      availableHoursPerWeek: 15,
      careerGoals: "I want to build software and solve technical problems",
      userSkills: [{ skillId: "skill-js", name: "JavaScript", level: "ADVANCED" }],
    });
    const career = baseCareer({
      name: "Software Development",
      industry: "Technology",
      relevantInterests: ["Technology & software"],
      relevantSubjects: ["Computer Science"],
      traitWeights: { analyticalThinking: 0.9, problemSolving: 0.9, technologyInterest: 0.9 },
      environments: ["REMOTE"],
      careerSkills: [{ skillId: "skill-js", name: "JavaScript", level: "ADVANCED" }],
    });

    const result = computeCareerFit(profile, career);
    expect(result.fitScore).toBeGreaterThanOrEqual(90);
    expect(result.gapSkillIds).toEqual([]);
  });

  it("produces at most 4 reasons, all non-empty strings", () => {
    const profile = baseProfile({
      interestNames: ["Technology & software", "Business"],
      subjects: ["Computer Science"],
      traitScores: { analyticalThinking: 90, problemSolving: 90 },
      preferredEnvironment: "REMOTE",
      careerGoals: "I want a career in technology",
      userSkills: [{ skillId: "skill-js", name: "JavaScript", level: "ADVANCED" }],
    });
    const career = baseCareer({
      relevantInterests: ["Technology & software", "Business"],
      relevantSubjects: ["Computer Science"],
      traitWeights: { analyticalThinking: 0.9, problemSolving: 0.9 },
      environments: ["REMOTE"],
      careerSkills: [{ skillId: "skill-js", name: "JavaScript", level: "ADVANCED" }],
    });

    const result = computeCareerFit(profile, career);
    expect(result.reasons.length).toBeLessThanOrEqual(4);
    for (const reason of result.reasons) {
      expect(typeof reason).toBe("string");
      expect(reason.length).toBeGreaterThan(0);
    }
  });
});

describe("computeCareerFit — skill gap scenarios", () => {
  it("gives partial credit (not zero) for an owned-but-below-level skill, and flags it as a gap", () => {
    const profile = baseProfile({ userSkills: [{ skillId: "skill-js", name: "JavaScript", level: "BEGINNER" }] });
    const career = baseCareer({ careerSkills: [{ skillId: "skill-js", name: "JavaScript", level: "ADVANCED" }] });
    const result = computeCareerFit(profile, career);
    expect(result.breakdown.skillMatch).toBe(60);
    expect(result.gapSkillIds).toEqual(["skill-js"]);
  });

  it("gives zero credit for a skill the user doesn't own at all", () => {
    const profile = baseProfile({ userSkills: [] });
    const career = baseCareer({ careerSkills: [{ skillId: "skill-js", name: "JavaScript", level: "BEGINNER" }] });
    const result = computeCareerFit(profile, career);
    expect(result.breakdown.skillMatch).toBe(0);
    expect(result.gapSkillIds).toEqual(["skill-js"]);
  });

  it("more skill gaps reduce learningFeasibility", () => {
    const profileNoSkills = baseProfile({ availableHoursPerWeek: 20 });
    const careerManyGaps = baseCareer({
      careerSkills: [
        { skillId: "s1", name: "Skill 1", level: "BEGINNER" },
        { skillId: "s2", name: "Skill 2", level: "BEGINNER" },
        { skillId: "s3", name: "Skill 3", level: "BEGINNER" },
      ],
    });
    const careerNoSkills = baseCareer({ careerSkills: [] });

    const withGaps = computeCareerFit(profileNoSkills, careerManyGaps);
    const withoutGaps = computeCareerFit(profileNoSkills, careerNoSkills);
    // careerNoSkills defaults skillMatch to 50 (no requirements), careerManyGaps
    // scores 0 skillMatch (3 unmet requirements) — feasibility should reflect
    // the 3 gaps distinctly from the "no data" 50-default case.
    expect(withGaps.breakdown.learningFeasibility).toBeLessThan(withoutGaps.breakdown.learningFeasibility);
  });

  it("low available hours per week discounts learning feasibility", () => {
    const career = baseCareer({ careerSkills: [{ skillId: "s1", name: "Skill 1", level: "BEGINNER" }] });
    const lowHours = computeCareerFit(baseProfile({ availableHoursPerWeek: 1 }), career);
    const highHours = computeCareerFit(baseProfile({ availableHoursPerWeek: 20 }), career);
    expect(lowHours.breakdown.learningFeasibility).toBeLessThan(highHours.breakdown.learningFeasibility);
  });
});

describe("computeCareerFit — work preference", () => {
  it("scores 100 when the user has no preference, regardless of career environments", () => {
    const result = computeCareerFit(
      baseProfile({ preferredEnvironment: "NO_PREFERENCE" }),
      baseCareer({ environments: ["IN_PERSON"] })
    );
    expect(result.breakdown.workPreferenceMatch).toBe(100);
  });

  it("scores 30 when the user's preference doesn't match any of the career's environments", () => {
    const result = computeCareerFit(
      baseProfile({ preferredEnvironment: "REMOTE" }),
      baseCareer({ environments: ["IN_PERSON"] })
    );
    expect(result.breakdown.workPreferenceMatch).toBe(30);
  });
});

describe("computeCareerFit — goal match (deterministic keyword overlap)", () => {
  it("does not match on stopwords alone", () => {
    const result = computeCareerFit(
      baseProfile({ careerGoals: "I want a good career and a job" }),
      baseCareer({ name: "Software Development", industry: "Technology" })
    );
    // every token in the goal is a stopword ("want", "a", "good"[not stopword but
    // also not in career vocab], "career", "and", "job") — expect no fabricated match
    expect(result.breakdown.goalMatch).toBeLessThanOrEqual(50);
  });

  it("matches when the user's own words appear in the career's name/industry/interests", () => {
    const result = computeCareerFit(
      baseProfile({ careerGoals: "I want to work in technology and software" }),
      baseCareer({ name: "Software Development", industry: "Technology", relevantInterests: [] })
    );
    expect(result.breakdown.goalMatch).toBeGreaterThan(50);
  });
});

describe("computeSideIncomeFit", () => {
  function baseOpportunity(overrides: Partial<SideOpportunityForScoring> = {}): SideOpportunityForScoring {
    return { id: "opp-1", skills: [], ...overrides };
  }

  it("is deterministic", () => {
    const profile = baseProfile({ userSkills: [{ skillId: "s1", name: "Writing", level: "INTERMEDIATE" }] });
    const opp = baseOpportunity({ skills: [{ skillId: "s1", name: "Writing", level: "BEGINNER" }] });
    expect(computeSideIncomeFit(profile, opp)).toEqual(computeSideIncomeFit(profile, opp));
  });

  it("lists missing skill names for gaps", () => {
    const profile = baseProfile({ userSkills: [] });
    const opp = baseOpportunity({ skills: [{ skillId: "s1", name: "Writing", level: "BEGINNER" }] });
    const result = computeSideIncomeFit(profile, opp);
    expect(result.missingSkillNames).toEqual(["Writing"]);
  });

  it("fitScore is 0-100 bounded", () => {
    const profile = baseProfile({ userSkills: [{ skillId: "s1", name: "Writing", level: "ADVANCED" }] });
    const opp = baseOpportunity({ skills: [{ skillId: "s1", name: "Writing", level: "BEGINNER" }] });
    const result = computeSideIncomeFit(profile, opp);
    expect(result.fitScore).toBeGreaterThanOrEqual(0);
    expect(result.fitScore).toBeLessThanOrEqual(100);
  });
});
