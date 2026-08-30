import { describe, expect, it } from "vitest";
import { computeTraitScores } from "@/lib/assessment/scoring";

describe("computeTraitScores", () => {
  it("rescales a single answer of 1 to 0", () => {
    const scores = computeTraitScores([{ trait: "creativity", value: 1 }]);
    expect(scores.creativity).toBe(0);
  });

  it("rescales a single answer of 5 to 100", () => {
    const scores = computeTraitScores([{ trait: "creativity", value: 5 }]);
    expect(scores.creativity).toBe(100);
  });

  it("rescales a single answer of 3 (neutral) to 50", () => {
    const scores = computeTraitScores([{ trait: "creativity", value: 3 }]);
    expect(scores.creativity).toBe(50);
  });

  it("averages multiple answers for the same trait before rescaling", () => {
    // creativity: (2 + 4) / 2 = 3 -> 50
    const scores = computeTraitScores([
      { trait: "creativity", value: 2 },
      { trait: "creativity", value: 4 },
    ]);
    expect(scores.creativity).toBe(50);
  });

  it("keeps traits independent of one another", () => {
    const scores = computeTraitScores([
      { trait: "creativity", value: 5 },
      { trait: "analyticalThinking", value: 1 },
    ]);
    expect(scores.creativity).toBe(100);
    expect(scores.analyticalThinking).toBe(0);
  });

  it("returns an empty object for no answers", () => {
    expect(computeTraitScores([])).toEqual({});
  });

  it("does not include a trait with zero answers", () => {
    const scores = computeTraitScores([{ trait: "creativity", value: 5 }]);
    expect(scores.problemSolving).toBeUndefined();
  });
});
