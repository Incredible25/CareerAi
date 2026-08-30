import { describe, expect, it } from "vitest";
import { buildRoadmapTasks } from "@/lib/career-engine/roadmap";

describe("buildRoadmapTasks", () => {
  it("is a pure function: identical input produces identical output", () => {
    const input = {
      careerName: "Software Development",
      gapSkillNames: ["JavaScript", "Git"],
      beginnerProjects: ["Build a to-do app"],
      portfolioRequirements: ["A GitHub profile with 2 projects"],
      availableHoursPerWeek: 10,
    };
    expect(buildRoadmapTasks(input)).toEqual(buildRoadmapTasks(input));
  });

  it("produces all 5 phases in order", () => {
    const draft = buildRoadmapTasks({
      careerName: "Software Development",
      gapSkillNames: ["JavaScript"],
      beginnerProjects: ["Build a to-do app"],
      portfolioRequirements: ["A GitHub profile"],
      availableHoursPerWeek: 10,
    });
    const phases = [...new Set(draft.tasks.map((t) => t.phase))];
    expect(phases).toEqual([
      "Understand the field",
      "Build foundational skills",
      "Apply what you're learning",
      "Build your portfolio",
      "Start putting yourself forward",
    ]);
  });

  it("emits one skill-learning task per real gap, not a fixed number", () => {
    const draft = buildRoadmapTasks({
      careerName: "Software Development",
      gapSkillNames: ["JavaScript", "Git", "SQL"],
      beginnerProjects: [],
      portfolioRequirements: [],
      availableHoursPerWeek: 10,
    });
    const skillTasks = draft.tasks.filter((t) => t.phase === "Build foundational skills");
    expect(skillTasks).toHaveLength(3);
    expect(skillTasks.map((t) => t.title)).toEqual([
      "Learn the basics of JavaScript",
      "Learn the basics of Git",
      "Learn the basics of SQL",
    ]);
  });

  it("emits a single fallback task when there are zero skill gaps, instead of an empty phase", () => {
    const draft = buildRoadmapTasks({
      careerName: "Software Development",
      gapSkillNames: [],
      beginnerProjects: [],
      portfolioRequirements: [],
      availableHoursPerWeek: 10,
    });
    const skillTasks = draft.tasks.filter((t) => t.phase === "Build foundational skills");
    expect(skillTasks).toHaveLength(1);
    expect(skillTasks[0]?.title).toBe("Go deeper on what you already have");
  });

  it("never implies a live opportunity listing exists in the final phase", () => {
    const draft = buildRoadmapTasks({
      careerName: "Software Development",
      gapSkillNames: [],
      beginnerProjects: [],
      portfolioRequirements: [],
      availableHoursPerWeek: 10,
    });
    const finalPhaseText = draft.tasks
      .filter((t) => t.phase === "Start putting yourself forward")
      .map((t) => t.description)
      .join(" ");
    expect(finalPhaseText.toLowerCase()).toContain("doesn't list live opportunities yet");
  });

  it("more available hours per week shortens the total roadmap for the same skill gaps", () => {
    const gapSkillNames = ["A", "B", "C", "D"];
    const lowHours = buildRoadmapTasks({
      careerName: "X",
      gapSkillNames,
      beginnerProjects: [],
      portfolioRequirements: [],
      availableHoursPerWeek: 2,
    });
    const highHours = buildRoadmapTasks({
      careerName: "X",
      gapSkillNames,
      beginnerProjects: [],
      portfolioRequirements: [],
      availableHoursPerWeek: 20,
    });
    expect(highHours.totalWeeks).toBeLessThan(lowHours.totalWeeks);
  });

  it("task order is sequential starting at 0 with no gaps or duplicates", () => {
    const draft = buildRoadmapTasks({
      careerName: "Software Development",
      gapSkillNames: ["JavaScript", "Git"],
      beginnerProjects: ["Project A", "Project B"],
      portfolioRequirements: ["Item A"],
      availableHoursPerWeek: 10,
    });
    const orders = draft.tasks.map((t) => t.order);
    expect(orders).toEqual([...orders.keys()]);
  });
});
