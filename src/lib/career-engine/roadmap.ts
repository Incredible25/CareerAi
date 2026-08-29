/**
 * Deterministic, templated roadmap generator (docs/PRODUCT_STRATEGY.md §11
 * of the brief). Pure function, no DB access — easy to reason about and
 * test in isolation. Phase structure follows the brief's own example
 * (understand the field → foundational skills → apply → portfolio →
 * put yourself forward), with each phase's *content* filled from the
 * career's real skill gaps and projects, and duration adapted to the
 * user's available hours per week.
 */
export type RoadmapTaskDraft = {
  phase: string;
  weekStart: number;
  weekEnd: number;
  title: string;
  description: string;
  order: number;
};

export type RoadmapDraft = { totalWeeks: number; tasks: RoadmapTaskDraft[] };

export function buildRoadmapTasks(input: {
  careerName: string;
  gapSkillNames: string[]; // already ordered tackle-first
  beginnerProjects: string[];
  portfolioRequirements: string[];
  availableHoursPerWeek: number | null;
}): RoadmapDraft {
  const hours = input.availableHoursPerWeek ?? 5;
  const weeksPerSkill = hours >= 10 ? 1.5 : hours >= 5 ? 2.5 : 4;
  const gapCount = input.gapSkillNames.length;

  const tasks: RoadmapTaskDraft[] = [];
  let order = 0;
  let week = 1;

  // Phase 1 — Understand the field (always 2 weeks: this doesn't compress
  // with more hours, it's about exposure, not effort).
  const phase1: [number, number] = [week, week + 1];
  tasks.push({
    phase: "Understand the field",
    weekStart: phase1[0],
    weekEnd: phase1[1],
    order: order++,
    title: `Learn what people in ${input.careerName} actually do day to day`,
    description: "Read overviews, watch talks, or find one person doing this work and learn what a typical week looks like for them.",
  });
  tasks.push({
    phase: "Understand the field",
    weekStart: phase1[0],
    weekEnd: phase1[1],
    order: order++,
    title: "Find 2-3 free resources you can keep coming back to",
    description: "Communities, creators, or courses covering this field — something to return to throughout the rest of this plan.",
  });
  week = phase1[1] + 1;

  // Phase 2 — Build foundational skills, one task per real gap.
  const skillPhaseWeeks = Math.min(8, Math.max(2, Math.ceil(gapCount * weeksPerSkill)));
  const phase2: [number, number] = [week, week + skillPhaseWeeks - 1];
  if (gapCount === 0) {
    tasks.push({
      phase: "Build foundational skills",
      weekStart: phase2[0],
      weekEnd: phase2[1],
      order: order++,
      title: "Go deeper on what you already have",
      description: "You already meet the core skill requirements for this career — use this phase to strengthen those skills rather than start from zero.",
    });
  } else {
    for (const skillName of input.gapSkillNames) {
      tasks.push({
        phase: "Build foundational skills",
        weekStart: phase2[0],
        weekEnd: phase2[1],
        order: order++,
        title: `Learn the basics of ${skillName}`,
        description: `Start with free resources, then practice with a small real exercise — not just theory.`,
      });
    }
  }
  week = phase2[1] + 1;

  // Phase 3 — Apply what you're learning.
  const projects = input.beginnerProjects.length > 0
    ? input.beginnerProjects
    : ["Complete one small, real project using your new skills"];
  const projectWeeks = Math.max(2, Math.min(4, projects.length * 2));
  const phase3: [number, number] = [week, week + projectWeeks - 1];
  for (const project of projects) {
    tasks.push({
      phase: "Apply what you're learning",
      weekStart: phase3[0],
      weekEnd: phase3[1],
      order: order++,
      title: `Complete: ${project}`,
      description: "Treat this as a real deliverable, not practice — something you'd be comfortable showing someone else.",
    });
  }
  week = phase3[1] + 1;

  // Phase 4 — Build your portfolio.
  const portfolioItems = input.portfolioRequirements.length > 0
    ? input.portfolioRequirements
    : ["Put together 2-3 examples of your work in one place"];
  const phase4: [number, number] = [week, week + 1];
  for (const item of portfolioItems) {
    tasks.push({
      phase: "Build your portfolio",
      weekStart: phase4[0],
      weekEnd: phase4[1],
      order: order++,
      title: item,
      description: "This becomes part of what you show when you start reaching out to people.",
    });
  }
  week = phase4[1] + 1;

  // Phase 5 — Start putting yourself forward. Deliberately generic about
  // where opportunities come from — the opportunity engine doesn't exist
  // yet, so this never implies a live listing exists.
  const phase5: [number, number] = [week, week + 1];
  tasks.push({
    phase: "Start putting yourself forward",
    weekStart: phase5[0],
    weekEnd: phase5[1],
    order: order++,
    title: "Update your portfolio so it's easy for someone else to find and understand",
    description: "A short summary plus the work itself, organized clearly — this is what you'll point people to.",
  });
  tasks.push({
    phase: "Start putting yourself forward",
    weekStart: phase5[0],
    weekEnd: phase5[1],
    order: order++,
    title: "Look for entry points: internships, freelance work, or volunteer projects",
    description: "3Doors doesn't list live opportunities yet — search directly, ask your network, and check organizations you're interested in.",
  });

  return { totalWeeks: phase5[1], tasks };
}
