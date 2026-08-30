import type { Prisma } from "@prisma/client";

/**
 * The single query-time gate for "would an ordinary user ever see this"
 * (Phase 4, Module 5 — Expiration System). Every public-facing query
 * (feed, matching engine, dashboard, once built) must filter through
 * this, not through opportunityStatus alone.
 *
 * Deliberately re-evaluated against `new Date()` on every call rather
 * than trusting a stored EXPIRED flag: a flag only updates when
 * something writes it (an admin action, or the sweep-expired job below),
 * and between those writes it can be stale. A deadline that passed one
 * second ago must stop showing up immediately, not whenever an admin or
 * a cron next happens to run. The bulk sweep exists purely for admin
 * bookkeeping (so the dashboard's stored counts read cleanly) — it is
 * never the thing standing between a user and an expired opportunity.
 */
export function visibleOpportunityWhere(): Prisma.OpportunityWhereInput {
  return {
    verificationStatus: "VERIFIED",
    opportunityStatus: "ACTIVE",
    OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
  };
}

export function isPastDeadline(deadline: Date | null): boolean {
  if (!deadline) return false;
  return deadline.getTime() < Date.now();
}
