import { describe, expect, it } from "vitest";
import { applyMinorFieldRestrictions } from "@/lib/minors";

describe("applyMinorFieldRestrictions", () => {
  it("passes data through unchanged for a non-minor", () => {
    const data = { linkedinUrl: "https://linkedin.com/in/someone", portfolioUrl: "https://example.com", languages: "English" };
    expect(applyMinorFieldRestrictions(false, data)).toEqual(data);
  });

  it("strips linkedinUrl and portfolioUrl for a minor, regardless of what was submitted", () => {
    const data = { linkedinUrl: "https://linkedin.com/in/someone", portfolioUrl: "https://example.com", languages: "English" };
    const result = applyMinorFieldRestrictions(true, data);
    expect(result.linkedinUrl).toBe("");
    expect(result.portfolioUrl).toBe("");
  });

  it("leaves every other field on the object untouched for a minor", () => {
    const data = { linkedinUrl: "x", portfolioUrl: "y", languages: "English, French", hasLaptop: true };
    const result = applyMinorFieldRestrictions(true, data);
    expect(result.languages).toBe("English, French");
    expect(result.hasLaptop).toBe(true);
  });

  it("is a no-op on already-empty fields", () => {
    const data = { linkedinUrl: "", portfolioUrl: "" };
    expect(applyMinorFieldRestrictions(true, data)).toEqual({ linkedinUrl: "", portfolioUrl: "" });
  });
});
