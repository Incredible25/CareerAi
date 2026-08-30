import { describe, expect, it } from "vitest";
import { meetsLevel } from "@/lib/career-engine/skill-level";

describe("meetsLevel", () => {
  it("returns false when the user has no level at all", () => {
    expect(meetsLevel(null, "BEGINNER")).toBe(false);
    expect(meetsLevel(undefined, "BEGINNER")).toBe(false);
  });

  it("returns true when the current level exactly matches the required level", () => {
    expect(meetsLevel("INTERMEDIATE", "INTERMEDIATE")).toBe(true);
  });

  it("returns true when the current level exceeds the required level", () => {
    expect(meetsLevel("ADVANCED", "BEGINNER")).toBe(true);
  });

  it("returns false when the current level is below the required level", () => {
    expect(meetsLevel("BEGINNER", "ADVANCED")).toBe(false);
  });
});
