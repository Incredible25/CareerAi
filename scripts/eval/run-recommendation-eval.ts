/**
 * Phase 5, Module 10 — repeatable recommendation-engine evaluation.
 *
 * Runs every fictional profile in test-profiles.ts through the real
 * computeCareerFit() formula against the real seeded career catalog
 * (read-only — no DB writes, no fake users created, nothing to clean up
 * afterward) and reports the top matches for human review, plus a small
 * set of automated sanity checks calibrated against actually-observed
 * behavior (see comments below), not invented thresholds.
 *
 * Usage: npm run eval:recommendations
 * Exit code is non-zero if any sanity check fails, so this can be wired
 * into CI later without anyone having to read the full report by hand.
 */
import { prisma } from "@/lib/prisma";
import { computeCareerFit } from "@/lib/career-engine/scoring";
import type { CareerForScoring, UserProfileInput } from "@/lib/career-engine/types";
import type { TraitKey } from "@/lib/assessment/questions";
import { FICTIONAL_TEST_PROFILES, type FictionalProfile } from "./test-profiles";

type Check = { name: string; pass: boolean; detail: string };

async function main() {
  const [careers, skills] = await Promise.all([
    prisma.careerProfile.findMany({ include: { careerSkills: { include: { skill: true } } } }),
    prisma.skill.findMany(),
  ]);

  if (careers.length === 0) {
    console.error("No careers found in the database — run `npm run prisma:seed-all` first.");
    process.exit(1);
  }

  const skillIdByName = new Map(skills.map((s) => [s.name, s.id]));
  const careersForScoring: CareerForScoring[] = careers.map((career) => ({
    id: career.id,
    name: career.name,
    industry: career.industry,
    relevantInterests: career.relevantInterests,
    relevantSubjects: career.relevantSubjects,
    traitWeights: career.traitWeights as Partial<Record<TraitKey, number>>,
    environments: career.environments,
    careerSkills: career.careerSkills.map((cs) => ({ skillId: cs.skillId, name: cs.skill.name, level: cs.level })),
  }));

  const allChecks: Check[] = [];

  for (const fp of FICTIONAL_TEST_PROFILES) {
    const unresolvedSkills = fp.skillNames.filter((s) => !skillIdByName.has(s.name));
    for (const s of unresolvedSkills) {
      console.warn(`⚠ Profile "${fp.id}": skill "${s.name}" not found in seeded Skill catalog — skipped.`);
    }

    const profile: UserProfileInput = {
      userSkills: fp.skillNames
        .filter((s) => skillIdByName.has(s.name))
        .map((s) => ({ skillId: skillIdByName.get(s.name)!, name: s.name, level: s.level })),
      interestNames: fp.interestNames,
      subjects: fp.subjects,
      traitScores: fp.traitScores,
      preferredEnvironment: fp.preferredEnvironment === "NO_PREFERENCE" ? "NO_PREFERENCE" : fp.preferredEnvironment,
      availableHoursPerWeek: fp.availableHoursPerWeek,
      careerGoals: fp.careerGoals,
    };

    const scored = careersForScoring
      .map((career) => ({ career, result: computeCareerFit(profile, career) }))
      .sort((a, b) => b.result.fitScore - a.result.fitScore);

    console.log(`\n${"=".repeat(72)}`);
    console.log(`${fp.label}`);
    console.log(`Archetype: ${fp.archetype}`);
    console.log(`Expectation: ${fp.expectation}`);
    console.log(`${"-".repeat(72)}`);
    for (const { career, result } of scored.slice(0, 5)) {
      console.log(`  ${result.fitScore.toString().padStart(3)}%  ${career.name} (${career.industry})`);
      for (const reason of result.reasons) console.log(`         - ${reason}`);
      if (result.gapSkillIds.length > 0) console.log(`         gaps: ${result.gapSkillIds.length} skill(s)`);
    }

    const checks = runChecksForProfile(fp, scored);
    allChecks.push(...checks);
  }

  console.log(`\n${"=".repeat(72)}`);
  console.log("SANITY CHECK SUMMARY");
  console.log(`${"=".repeat(72)}`);
  const failed = allChecks.filter((c) => !c.pass);
  for (const c of allChecks) {
    console.log(`  ${c.pass ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`);
  }
  console.log(`\n${allChecks.length - failed.length}/${allChecks.length} checks passed.`);

  await prisma.$disconnect();
  if (failed.length > 0) process.exit(1);
}

function runChecksForProfile(
  fp: FictionalProfile,
  scored: { career: CareerForScoring; result: ReturnType<typeof computeCareerFit> }[]
): Check[] {
  const checks: Check[] = [];
  const top = scored[0];
  if (!top) return checks; // no careers in the catalog — nothing to check

  // Structural checks applied to every profile, regardless of archetype.
  const allInRange = scored.every((s) => s.result.fitScore >= 0 && s.result.fitScore <= 100);
  checks.push({ name: `[${fp.id}] all fitScores in 0-100 range`, pass: allInRange, detail: allInRange ? "ok" : "a score fell outside 0-100" });

  const reasonsBounded = scored.every((s) => s.result.reasons.length <= 4);
  checks.push({ name: `[${fp.id}] reasons capped at 4`, pass: reasonsBounded, detail: reasonsBounded ? "ok" : "a career had >4 reasons" });

  // Archetype-specific checks, calibrated to what the deterministic formula
  // should honestly produce for a profile built with that strong a signal
  // (see scoring.ts — these follow directly from the documented weights,
  // not from a desired outcome).
  if (fp.id === "very-limited-information") {
    // Calibrated against the real formula, not a guess: interestMatch,
    // subjectMatch, and skillMatch only default to 50 when the *career*
    // has no listed data — a populated catalog scores a 0-input user as
    // literal 0 on those three factors (see scoring.test.ts). Only
    // strengthMatch/goalMatch (career-independent 50-defaults) and
    // workPreferenceMatch (100, no stated preference) stay neutral, so a
    // fully empty profile should land low, not mid-range — this check
    // exists to catch the opposite failure mode: a false-confidence high
    // score fabricated from nothing.
    const noFalseConfidence = scored.every((s) => s.result.fitScore <= 55);
    checks.push({
      name: `[${fp.id}] no false-confidence high score from an empty profile`,
      pass: noFalseConfidence,
      detail: noFalseConfidence ? "ok" : `expected all scores <= 55, top was ${top.result.fitScore}`,
    });
  }

  if (fp.id === "aspirational-qualification-gap") {
    const swDev = scored.find((s) => s.career.name === "Software Development");
    const inTop5 = swDev ? scored.slice(0, 5).includes(swDev) : false;
    const hasGaps = swDev ? swDev.result.gapSkillIds.length > 0 : false;
    checks.push({
      name: `[${fp.id}] Software Development surfaces despite the gap`,
      pass: inTop5,
      detail: inTop5 ? "ok" : "Software Development did not make the top 5 despite matching interest + goal",
    });
    checks.push({
      name: `[${fp.id}] gap is honestly reported, not hidden`,
      pass: hasGaps,
      detail: hasGaps ? "ok" : "expected non-empty gapSkillIds for a profile with no relevant skills",
    });
  }

  if (["entrepreneurship-oriented", "creative-careers", "technical-stem", "social-community"].includes(fp.id)) {
    const industryKeywords: Record<string, string[]> = {
      "entrepreneurship-oriented": ["business"],
      "creative-careers": ["creative", "design", "media"],
      "technical-stem": ["technology", "engineering"],
      "social-community": ["health", "education", "social"],
    };
    const keywords = industryKeywords[fp.id] ?? [];
    const matches = keywords.some((k) => top.career.industry.toLowerCase().includes(k));
    checks.push({
      name: `[${fp.id}] top match industry aligns with strong signal`,
      pass: matches,
      detail: matches ? `ok (${top.career.industry})` : `top was "${top.career.name}" (${top.career.industry}), expected one of: ${keywords.join("/")}`,
    });
  }

  return checks;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
