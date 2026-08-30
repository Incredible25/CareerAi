/**
 * Phase 5, Module 10 — controlled fictional test profiles.
 *
 * Every profile here is entirely made up (no real person's data) and
 * represents one of the edge-case student archetypes named in the Phase 5
 * brief (Module 1). These are consumed by scripts/eval/run-recommendation-
 * eval.ts, which scores each one against the real seeded career catalog and
 * reports the result — a repeatable way to sanity-check the recommendation
 * engine without re-registering fake users through the UI every time.
 *
 * Interest names and trait keys here must match real seeded data
 * (Interest.name / assessment TraitKey) — the eval script resolves skill
 * names to real Skill rows at run time and warns if one isn't found, so a
 * reseed that renames something surfaces loudly instead of silently.
 */
import type { TraitKey } from "@/lib/assessment/questions";
import type { WorkEnvironment } from "@prisma/client";

export type FictionalSkill = { name: string; level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" };

export type FictionalProfile = {
  id: string;
  label: string;
  archetype: string;
  interestNames: string[];
  subjects: string[];
  skillNames: FictionalSkill[];
  traitScores: Partial<Record<TraitKey, number>>;
  preferredEnvironment: WorkEnvironment | "NO_PREFERENCE" | null;
  availableHoursPerWeek: number | null;
  careerGoals: string | null;
  /** What a human reviewer should expect to see — not asserted mechanically for every profile. */
  expectation: string;
};

export const FICTIONAL_TEST_PROFILES: FictionalProfile[] = [
  {
    id: "strong-academics-unclear-interests",
    label: "Amina — strong grades, hasn't figured out what she likes yet",
    archetype: "Strong academic performance but unclear interests",
    interestNames: [],
    subjects: ["Mathematics", "Physics", "Chemistry", "English"],
    skillNames: [
      { name: "Spreadsheets & data entry", level: "INTERMEDIATE" },
      { name: "Written English", level: "ADVANCED" },
    ],
    traitScores: { analyticalThinking: 85, problemSolving: 80, communication: 75, motivation: 80, structurePreference: 70 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 10,
    careerGoals: null,
    expectation:
      "No single interest signal to lean on (interestMatch should be low/0 for most careers, not inflated) — strength/subject match should still surface analytical careers without the system pretending it knows her interests.",
  },
  {
    id: "strong-interests-weak-academics",
    label: "Junior — loves design, struggled in school",
    archetype: "Strong interests but weak academic performance",
    interestNames: ["Design & visual arts", "Music & performance"],
    subjects: ["Physical Education", "Agriculture"],
    skillNames: [{ name: "Canva / basic graphic design", level: "BEGINNER" }],
    traitScores: { creativity: 90, analyticalThinking: 30, structurePreference: 25, motivation: 60 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 8,
    careerGoals: "I want to do something creative like design or art",
    expectation:
      "A creative career should still rank near the top from interest+goal+strength signals alone, even with no matching subjects and only a beginner skill — subject mismatch shouldn't zero out an otherwise strong creative fit.",
  },
  {
    id: "multiple-unrelated-interests",
    label: "Divine — into a bit of everything",
    archetype: "Interested in several unrelated fields",
    interestNames: ["Technology & software", "Music & performance", "Law & policy", "Sports & fitness"],
    subjects: ["Literature", "Biology"],
    skillNames: [{ name: "Basic computer literacy", level: "BEGINNER" }],
    traitScores: { creativity: 60, analyticalThinking: 55, communication: 65, socialOrientation: 50 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 6,
    careerGoals: null,
    expectation:
      "No single dominant top match expected — a genuinely scattered profile should produce a spread of moderate scores across different industries, not one career oddly dominating.",
  },
  {
    id: "very-limited-information",
    label: "Blaise — bare-minimum profile",
    archetype: "Student with very limited information",
    interestNames: [],
    subjects: [],
    skillNames: [],
    traitScores: {},
    preferredEnvironment: null,
    availableHoursPerWeek: null,
    careerGoals: null,
    expectation:
      "Must not crash on any of the 32 real careers. Every score should land on or near the neutral defaults (~50) rather than a confident-looking extreme — this profile has told the system almost nothing.",
  },
  {
    id: "subjects-dont-map-to-one-career",
    label: "Ngozi — subject mix that doesn't point anywhere obvious",
    archetype: "Student whose subjects do not clearly correspond to one career",
    interestNames: ["Environment & agriculture"],
    subjects: ["Fine Art", "Biology", "Economics"],
    skillNames: [],
    traitScores: { analyticalThinking: 55, creativity: 55, businessOrientation: 50 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 5,
    careerGoals: null,
    expectation:
      "Subject-match scores should stay modest across the board (no career should claim a suspiciously strong subject match from this scattered combination).",
  },
  {
    id: "aspirational-qualification-gap",
    label: "Fabrice — wants software dev, has none of the groundwork yet",
    archetype: "Interested in a career that requires qualifications they currently lack",
    interestNames: ["Technology & software"],
    subjects: ["History", "Geography"],
    skillNames: [],
    traitScores: { technologyInterest: 70, analyticalThinking: 45 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 4,
    careerGoals: "I want to become a software developer",
    expectation:
      "Software Development should still surface (interest + goal keyword match are real signals) but with a visible, non-empty skill-gap list — the system should show the gap honestly, not hide it behind a falsely high overall score.",
  },
  {
    id: "entrepreneurship-oriented",
    label: "Patricia — wants to run her own business, not work for someone else",
    archetype: "Wants entrepreneurship rather than traditional employment",
    interestNames: ["Business & entrepreneurship", "Marketing & branding"],
    subjects: ["Economics", "Mathematics"],
    skillNames: [
      { name: "Social media platforms", level: "INTERMEDIATE" },
      { name: "Customer communication", level: "INTERMEDIATE" },
    ],
    traitScores: { businessOrientation: 90, leadership: 75, motivation: 85 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 12,
    careerGoals: "I want to start and run my own business someday",
    expectation: "Entrepreneurship & Small Business Management (or another business-industry career) should rank at or near the top.",
  },
  {
    id: "creative-careers",
    label: "Cynthia — clearly creative-leaning",
    archetype: "Interested in creative careers",
    interestNames: ["Design & visual arts", "Writing & storytelling", "Music & performance"],
    subjects: ["Literature", "Fine Art"],
    skillNames: [{ name: "Canva / basic graphic design", level: "INTERMEDIATE" }],
    traitScores: { creativity: 92, communication: 70 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 8,
    careerGoals: "I want a creative career, maybe design or writing",
    expectation: "Top match should be from a creative/design/media industry.",
  },
  {
    id: "technical-stem",
    label: "Emmanuel — clearly STEM-leaning",
    archetype: "Interested in technical/STEM careers",
    interestNames: ["Technology & software", "Engineering & how things work", "Science & research"],
    subjects: ["Mathematics", "Physics", "Computer Science"],
    skillNames: [{ name: "Basic HTML/CSS", level: "BEGINNER" }],
    traitScores: { analyticalThinking: 90, problemSolving: 88, technologyInterest: 85 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 12,
    careerGoals: "I want to work in technology or engineering",
    expectation: "Top match should be from a technology or engineering industry.",
  },
  {
    id: "social-community",
    label: "Grace — clearly community-oriented",
    archetype: "Interested in social/community careers",
    interestNames: ["Community & social impact", "Health & medicine", "Teaching & mentoring"],
    subjects: ["Biology", "Literature"],
    skillNames: [{ name: "Customer communication", level: "INTERMEDIATE" }],
    traitScores: { socialOrientation: 90, communication: 80, teamOrientation: 75 },
    preferredEnvironment: "NO_PREFERENCE",
    availableHoursPerWeek: 8,
    careerGoals: "I want to help people and give back to my community",
    expectation: "Top match should be from health, education, or social-impact industries.",
  },
];
