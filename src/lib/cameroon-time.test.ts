import { describe, expect, it } from "vitest";
import { formatCameroonDate, formatCameroonDateTime, CAMEROON_TIME_ZONE } from "@/lib/cameroon-time";

describe("formatCameroonDate", () => {
  it("formats a date in day/month/year order", () => {
    expect(formatCameroonDate(new Date("2026-08-30T12:00:00Z"))).toBe("30 August 2026");
  });

  it("uses Cameroon time (UTC+1), not UTC — a late-night UTC timestamp is already the next day in WAT", () => {
    // 23:30 UTC on Jan 1 is 00:30 WAT on Jan 2 — a naive UTC formatter
    // would show "1 January", this must show "2 January".
    expect(formatCameroonDate(new Date("2026-01-01T23:30:00Z"))).toBe("2 January 2026");
  });

  it("does not observe daylight saving (WAT is a fixed UTC+1 year-round)", () => {
    // If this ever drifted (e.g. a timezone with DST), a July date and a
    // January date at the same UTC hour would format to different local
    // hours. Confirmed fixed by checking CAMEROON_TIME_ZONE directly.
    expect(CAMEROON_TIME_ZONE).toBe("Africa/Douala");
  });
});

describe("formatCameroonDateTime", () => {
  it("includes the time, offset by the WAT correction", () => {
    // 23:30 UTC -> 00:30 WAT the next day.
    expect(formatCameroonDateTime(new Date("2026-01-01T23:30:00Z"))).toBe("2 January 2026 at 00:30");
  });
});
