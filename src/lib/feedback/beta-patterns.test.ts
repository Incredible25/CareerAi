import { describe, expect, it } from "vitest";
import { computeBetaFeedbackPatterns, type BetaFeedbackPatternsInput } from "@/lib/feedback/beta-patterns";

function row(overrides: Partial<BetaFeedbackPatternsInput["rows"][number]> = {}) {
  return {
    helpful: false,
    reason: null,
    careerName: "Software Development",
    ageRange: "AGE_19_24" as const,
    educationLevel: "UNIVERSITY",
    hasLaptop: true,
    hasSmartphone: true,
    internetAccess: "RELIABLE_DAILY",
    ...overrides,
  };
}

describe("computeBetaFeedbackPatterns", () => {
  it("only counts negative feedback toward the profile-type breakdowns", () => {
    const result = computeBetaFeedbackPatterns({
      rows: [row({ helpful: true }), row({ helpful: false, ageRange: "UNDER_16" })],
    });
    expect(result.negativeFeedbackByAgeRange).toEqual([{ label: "Under 16", count: 1 }]);
  });

  it("buckets by education level with a plain-language label", () => {
    const result = computeBetaFeedbackPatterns({
      rows: [row({ educationLevel: "SECONDARY" }), row({ educationLevel: "SECONDARY" }), row({ educationLevel: "GRADUATE" })],
    });
    expect(result.negativeFeedbackByEducationLevel).toEqual([
      { label: "Secondary school", count: 2 },
      { label: "Graduate / postgraduate", count: 1 },
    ]);
  });

  it("labels device access as a single combined bucket, not separate booleans", () => {
    const result = computeBetaFeedbackPatterns({
      rows: [
        row({ hasLaptop: true, hasSmartphone: false }),
        row({ hasLaptop: false, hasSmartphone: true }),
        row({ hasLaptop: false, hasSmartphone: false }),
      ],
    });
    const labels = result.negativeFeedbackByDeviceAccess.map((b) => b.label).sort();
    expect(labels).toEqual(["Laptop only", "Neither / not stated", "Smartphone only"]);
  });

  it("flags INAPPROPRIATE reason reports as critical, separately from ordinary negative feedback", () => {
    const result = computeBetaFeedbackPatterns({
      rows: [
        row({ reason: "INAPPROPRIATE", careerName: "Nursing & Community Health" }),
        row({ reason: "TOO_GENERIC", careerName: "Nursing & Community Health" }),
      ],
    });
    expect(result.criticalReportCount).toBe(1);
    expect(result.criticalReportsByCareer).toEqual([{ label: "Nursing & Community Health", count: 1 }]);
  });

  it("never includes any user-identifying field or free-text comment in its output shape", () => {
    const result = computeBetaFeedbackPatterns({ rows: [row()] });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/email|userId|comment/i);
  });
});
