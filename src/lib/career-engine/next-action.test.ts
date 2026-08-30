import { describe, expect, it } from "vitest";
import { getNextAction, type NextActionContext } from "@/lib/career-engine/next-action";

function ctx(overrides: Partial<NextActionContext> = {}): NextActionContext {
  return {
    assessmentStatus: "done",
    roadmapCount: 1,
    doneTasks: 1,
    portfolioCount: 1,
    hasEligibleOpportunityMatch: false,
    ...overrides,
  };
}

describe("getNextAction — priority ordering", () => {
  it("prioritizes starting the assessment above everything else", () => {
    const action = getNextAction(ctx({ assessmentStatus: "not_started", roadmapCount: 0, doneTasks: 0, portfolioCount: 0 }));
    expect(action.href).toBe("/assessment");
    expect(action.cta).toBe("Start assessment");
  });

  it("prioritizes finishing an in-progress assessment above roadmap/portfolio state", () => {
    const action = getNextAction(ctx({ assessmentStatus: "in_progress", roadmapCount: 5, portfolioCount: 5 }));
    expect(action.href).toBe("/assessment");
    expect(action.cta).toBe("Continue");
  });

  it("recommends picking a career when the assessment is done but no roadmap exists", () => {
    const action = getNextAction(ctx({ roadmapCount: 0 }));
    expect(action.href).toBe("/matches");
    expect(action.label).toBe("Pick a career to build a plan around");
  });

  it("recommends starting the first roadmap task when a roadmap exists but nothing is done", () => {
    const action = getNextAction(ctx({ roadmapCount: 1, doneTasks: 0 }));
    expect(action.label).toBe("Start your first roadmap task");
  });

  it("recommends adding a portfolio project once roadmap progress exists but no portfolio", () => {
    const action = getNextAction(ctx({ doneTasks: 1, portfolioCount: 0 }));
    expect(action.href).toBe("/portfolio");
  });

  it("recommends checking an eligible opportunity once the earlier milestones are all met", () => {
    const action = getNextAction(ctx({ hasEligibleOpportunityMatch: true }));
    expect(action.href).toBe("/opportunities");
  });

  it("falls back to the assistant once everything else is satisfied and there's no eligible opportunity", () => {
    const action = getNextAction(ctx({ hasEligibleOpportunityMatch: false }));
    expect(action.href).toBe("/assistant");
  });

  it("treats a missing hasEligibleOpportunityMatch as false rather than throwing", () => {
    const { hasEligibleOpportunityMatch, ...rest } = ctx();
    const action = getNextAction(rest);
    expect(action.href).toBe("/assistant");
  });

  it("always returns exactly one action object, never a list", () => {
    const action = getNextAction(ctx());
    expect(action).toHaveProperty("label");
    expect(action).toHaveProperty("href");
    expect(action).toHaveProperty("cta");
  });
});
