import { formatCameroonDate } from "@/lib/cameroon-time";

/**
 * A missing deadline is a real, honest state, never inferred (Phase 4,
 * Module 13 of the brief / "no invented deadlines"). Every place a
 * deadline is shown must go through this — never a raw date fallback.
 *
 * Phase 6: formatted in Cameroon time, not the server's or viewer's
 * runtime timezone — a deadline showing the wrong day near midnight is
 * exactly the kind of thing that matters for a real application deadline.
 */
export function formatDeadline(deadline: Date | null): string {
  if (!deadline) return "Deadline not specified";
  return formatCameroonDate(deadline);
}

/** Whole days remaining, negative if already past. Null if no deadline set. */
export function daysUntil(deadline: Date | null): number | null {
  if (!deadline) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}
