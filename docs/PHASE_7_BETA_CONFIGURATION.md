# Phase 7 Step 2 — Beta Configuration Mechanism

One centralized module (`src/lib/deployment.ts`) rather than beta checks
scattered across routes, per the phase's explicit instruction. Everything
below was live-verified against the real running app and database, not
just typechecked.

## Distinguishing development / staging / beta / production

`getDeploymentStage()` reads `DEPLOYMENT_STAGE` (one of `development`,
`staging`, `beta`, `production`). Unset, it infers from the existing
`NODE_ENV` convention (`production` → `production`, anything else →
`development`) so every current dev/CI setup keeps working unchanged —
`staging` and `beta` only ever come from an explicit `DEPLOYMENT_STAGE`,
nothing infers them silently.

An invalid value (typo, stray whitespace) falls back to the `NODE_ENV`
inference rather than crashing or silently accepting garbage — verified
by unit test (`src/lib/deployment.test.ts`).

## Identifying beta users

`User.isBetaUser` (new column, migration
`20260901112424_add_is_beta_user`, default `false`). Set only via
`prisma/mark-beta-user.ts <email> <on|off>` — deliberately not a UI flow
or API route, mirroring the existing `prisma/promote-admin.ts` convention
already in the codebase (no self-serve path onto the beta cohort, same as
no self-serve path to admin).

## Tracking beta activity

No new event-log table. Every action Step 6's metrics need
(registration, assessment completion, match generation, feedback) is
already a timestamped row in the existing schema
(`User.createdAt`, `Assessment.completedAt`, `CareerMatch.generatedAt`,
`Feedback.createdAt`). "Track beta activity" is answered by scoping
queries against those existing tables to `User.isBetaUser = true`, not by
building a parallel tracking system — see Step 6 and Step 10 for the
actual queries.

## Monitoring errors

`logError(context, err)` — a thin wrapper around `console.error` that
tags every message with the current deployment stage
(`[beta] AI assistant call failed: ...`), so existing logs are at least
filterable by stage without a new external service. Wired into the two
existing AI-call catch blocks (`src/app/api/assistant/message/route.ts`,
`src/app/api/opportunities/[id]/application-help/route.ts`) that
previously used a bare `console.error`. **Honestly scoped**: this does
not stand up alerting or a dashboard — that's genuinely out of
proportion for a 15-25 person beta (already named as an accepted gap in
`docs/PHASE_6_BETA_PLAN.md` §3); it makes existing logs usable, nothing
more.

## Distinguishing beta feedback

No new field needed on `Feedback` — it already links to a `userId`, and
`User.isBetaUser` is now the join key. Step 10's admin dashboard query
filters on it directly.

## Disabling beta access — the kill switch

`isBetaAccessEnabled()` reads `BETA_ACCESS_ENABLED` (default enabled;
disabled only on the exact literal `"false"`, so a typo can never
accidentally lock everyone out). Enforced in exactly one place —
`src/lib/auth.ts`'s `authorize()`, the same function that already houses
login rate limiting — not scattered across routes: if the deployment is
in beta stage, the account is beta-flagged, and the switch is off, sign-in
fails with the identical generic message a wrong password produces
(never a distinguishable signal, consistent with the existing rate-limit
message pattern).

### Live verification, not assumed

Three real scenarios run against the actual dev server and database,
each restarted with different env vars, with fixture cleanup after:

1. `DEPLOYMENT_STAGE=beta`, `BETA_ACCESS_ENABLED=false`, a real
   `isBetaUser=true` account → **login rejected**, generic message.
2. Same account, same server, `BETA_ACCESS_ENABLED` unset (default
   enabled) → **login succeeds**, lands on `/onboarding`.
3. `BETA_ACCESS_ENABLED=false`, but the same account flipped
   `isBetaUser=false` → **login succeeds** — confirms the switch never
   collaterally blocks a non-beta account.

## Verification

8 new unit tests (`src/lib/deployment.test.ts`) — stage inference,
invalid-value fallback, kill-switch default and exact-match behavior. Full
suite: 84/84 unit, 8/8 E2E, both passing with zero regressions. Typecheck
and lint clean. One fixture account created and deleted for the live
kill-switch verification above.
