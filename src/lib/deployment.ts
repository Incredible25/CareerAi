/**
 * Phase 7 beta configuration (docs/PHASE_7_BETA_CONFIGURATION.md) — the
 * one place the app answers "what environment is this," so beta-specific
 * behavior never has to be scattered across routes as ad-hoc env checks.
 *
 * `DEPLOYMENT_STAGE` is explicit and required for anything other than
 * local dev: unset, it falls back to inferring from `NODE_ENV`
 * ("production" -> "production", anything else -> "development"), which
 * keeps existing dev/CI setups working unchanged. Staging and beta only
 * ever come from an explicit `DEPLOYMENT_STAGE` — nothing infers them,
 * since silently guessing "this might be beta" is exactly the kind of
 * scattered, implicit logic this module exists to avoid.
 */
export type DeploymentStage = "development" | "staging" | "beta" | "production";

const VALID_STAGES: readonly DeploymentStage[] = ["development", "staging", "beta", "production"];

export function getDeploymentStage(): DeploymentStage {
  const raw = process.env.DEPLOYMENT_STAGE?.trim().toLowerCase();
  if (raw && (VALID_STAGES as readonly string[]).includes(raw)) {
    return raw as DeploymentStage;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isBetaStage(): boolean {
  return getDeploymentStage() === "beta";
}

/**
 * The beta kill switch. Only meaningful when `isBetaStage()` is true —
 * checked in `src/lib/auth.ts`'s `authorize()` so a beta account can be
 * locked out without a deploy, without touching non-beta accounts, and
 * without adding a check to every protected route individually. Defaults
 * to enabled (`true`) so an unset env var never accidentally locks
 * everyone out; must be explicitly set to the literal string "false" to
 * disable.
 */
export function isBetaAccessEnabled(): boolean {
  return process.env.BETA_ACCESS_ENABLED !== "false";
}

/**
 * Centralized error logging so beta-relevant failures are at least
 * consistently tagged with the deployment stage in whatever log
 * aggregation the deployment already has — this does not stand up new
 * alerting infrastructure (out of scope for a 15-25 person beta, see
 * docs/PHASE_6_BETA_PLAN.md §3), it just makes existing logs filterable
 * by stage instead of every catch block formatting its own message.
 */
export function logError(context: string, err: unknown): void {
  console.error(`[${getDeploymentStage()}] ${context}:`, err);
}

/**
 * Companion to logError for the non-error side of Step 6's beta metrics
 * that have no natural home in a DB row (recommendation-generation
 * duration, AI call duration) — tags stage the same way, so existing
 * logs are at least grep-able by stage and operation name. Not a metrics
 * store; see docs/PHASE_7_BETA_METRICS.md for what's DB-queryable versus
 * log-only and why.
 */
export function logTiming(context: string, durationMs: number): void {
  console.log(`[${getDeploymentStage()}] ${context}: ${durationMs}ms`);
}
