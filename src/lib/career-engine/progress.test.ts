import { describe, expect, it } from "vitest";
import { computeProgress, getEarnedBadges } from "@/lib/career-engine/progress";

describe("computeProgress", () => {
  it("careerDiscoveryPercent reflects assessment status directly", () => {
    expect(computeProgress({ assessmentStatus: "not_started", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 }).careerDiscoveryPercent).toBe(0);
    expect(computeProgress({ assessmentStatus: "in_progress", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 }).careerDiscoveryPercent).toBe(50);
    expect(computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 }).careerDiscoveryPercent).toBe(100);
  });

  it("skillDevelopmentPercent is 0 when there are no tasks at all (not NaN)", () => {
    const result = computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 });
    expect(result.skillDevelopmentPercent).toBe(0);
  });

  it("skillDevelopmentPercent is the done/total ratio", () => {
    const result = computeProgress({ assessmentStatus: "done", doneTasks: 3, totalTasks: 4, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 });
    expect(result.skillDevelopmentPercent).toBe(75);
  });

  it("portfolioPercent caps at 100 for 3+ completed projects", () => {
    const three = computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 3, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 });
    const five = computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 5, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 });
    expect(three.portfolioPercent).toBe(100);
    expect(five.portfolioPercent).toBe(100);
  });

  it("opportunityReadinessPercent is 0 with no matches (not NaN)", () => {
    const result = computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 0, eligibleOpportunityMatchCount: 0 });
    expect(result.opportunityReadinessPercent).toBe(0);
  });

  it("opportunityReadinessPercent is the eligible/total ratio", () => {
    const result = computeProgress({ assessmentStatus: "done", doneTasks: 0, totalTasks: 0, completedPortfolioProjects: 0, opportunityMatchCount: 4, eligibleOpportunityMatchCount: 1 });
    expect(result.opportunityReadinessPercent).toBe(25);
  });
});

describe("getEarnedBadges", () => {
  const noBadges = { assessmentDone: false, tasksDone: 0, portfolioCount: 0, portfolioCompleted: 0, trackedOpportunityCount: 0 };

  it("earns nothing for a fresh user", () => {
    expect(getEarnedBadges(noBadges)).toEqual([]);
  });

  it("earns exactly the badges whose condition is met", () => {
    const badges = getEarnedBadges({ ...noBadges, assessmentDone: true, trackedOpportunityCount: 1 });
    const keys = badges.map((b) => b.key);
    expect(keys).toContain("explorer");
    expect(keys).toContain("opportunity-seeker");
    expect(keys).not.toContain("skill-builder");
    expect(keys).not.toContain("portfolio-starter");
    expect(keys).not.toContain("first-project");
  });

  it("earns all 5 badges when every condition is met", () => {
    const badges = getEarnedBadges({
      assessmentDone: true,
      tasksDone: 1,
      portfolioCount: 1,
      portfolioCompleted: 1,
      trackedOpportunityCount: 1,
    });
    expect(badges).toHaveLength(5);
  });
});
