/**
 * A missing deadline is a real, honest state, never inferred (Phase 4,
 * Module 13 of the brief / "no invented deadlines"). Every place a
 * deadline is shown must go through this — never a raw date fallback.
 */
export function formatDeadline(deadline: Date | null): string {
  if (!deadline) return "Deadline not specified";
  return deadline.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

/** Whole days remaining, negative if already past. Null if no deadline set. */
export function daysUntil(deadline: Date | null): number | null {
  if (!deadline) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}
