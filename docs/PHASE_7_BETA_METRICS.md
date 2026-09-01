# Phase 7 Step 6 — Beta Metrics

Every metric in the brief, marked either **DB-queryable** (implemented as
real code, `src/lib/beta-metrics.ts`, live-verified against real data
below) or **log-based** (observable via the existing `logError`/`logTiming`
instrumentation from Step 2, not a numeric dashboard figure) — with the
reasoning for which category each falls into, so nothing is silently
skipped.

## DB-queryable — implemented in `src/lib/beta-metrics.ts`

Same pattern as `src/lib/feedback/aggregate.ts`: a pure `computeBetaMetrics()`
function over already-fetched rows (independently unit-tested, 5 tests),
fed by `fetchBetaMetricsInput()`, which does the actual Prisma queries —
every query scoped to `User.isBetaUser = true`.

| Metric | Source |
|---|---|
| Registration completion | `totalBetaUsers` — a `User` row only ever exists after a successful registration (no partial/draft state in this schema), so this is just the beta cohort count. |
| Assessment completion | `assessmentCompletionCount` / `assessmentCompletionRatePercent` — distinct users with `Assessment.status = COMPLETED`, against the full beta cohort. |
| Recommendation generation success | `recommendationGenerationSuccessCount` — distinct users with at least one `CareerMatch` row. |
| Recommendation feedback / positive / negative | `feedbackCount`, `positiveFeedbackCount`, `negativeFeedbackCount` — `Feedback` rows where `subjectType = CAREER_MATCH`. |
| Recommendation relevance | `recommendationRelevancePercent` — the positive share of career-match feedback; the same honest proxy `docs/PHASE_6_BETA_PLAN.md` metric 1 already uses (a thumbs-up rate), scoped to the beta cohort specifically here. |
| Explanation usefulness | `explanationInsufficiencyRatePercent` — the share of *negative* feedback that specifically cited the new `INSUFFICIENT_EXPLANATION` reason (Step 4). Framed as an insufficiency rate (lower is better) rather than a usefulness score, since there's no positive-signal equivalent to invert it from. |
| User drop-off points | `onboardingDropOffByStep` — a histogram of `Profile.onboardingStep` across beta users who haven't finished onboarding (< 5), bucketed by the same `ONBOARDING_STEPS` labels the UI itself uses. `assessmentInProgressCount` covers the later drop-off point (started but didn't finish the assessment). |

### Live-verified against real data, not assumed

Walked one real beta account through registration → onboarding →
assessment → matches → a 👎 vote with reason `TOO_GENERIC`, marked the
account beta via `prisma/mark-beta-user.ts`, then ran
`fetchBetaMetricsInput()` + `computeBetaMetrics()` against the real
database. Output matched exactly what the walkthrough did:
`totalBetaUsers: 1`, `assessmentCompletionRatePercent: 100`,
`recommendationGenerationSuccessCount: 1`, one negative feedback row with
`recommendationRelevancePercent: 0` (the one vote was negative) and
`explanationInsufficiencyRatePercent: 0` (the reason given was
`TOO_GENERIC`, not `INSUFFICIENT_EXPLANATION` — correctly not counted).
Fixture account deleted after.

## Log-based — instrumented, not stored as a queryable metric

These have no natural row in the existing schema to attach a
success/failure/duration to, since the relevant operations (recommendation
generation, AI calls) are synchronous request-time computations with no
event-log table. Building one would be more infrastructure than a 15-25
person beta needs (the same proportionality judgment already made in
`docs/PHASE_6_BETA_PLAN.md` §3 for alerting generally) — instead, Step 2's
`logError`/`logTiming` helpers (both stage-tagged) are wired into the one
place each of these actually happens:

| Metric | Where it's observable |
|---|---|
| Recommendation generation failure | `logError("recommendation generation failed", err)` — added this step to `generateCareerMatches()` (`src/lib/career-engine/generate.ts`), the single function every call site shares. Grep production logs for `recommendation generation failed` to count occurrences; behavior (the function still throws, same as before) is unchanged, this only adds observability. |
| Average recommendation-generation time | `logTiming("recommendation generation", ms)` — same function, logged on every successful call. Live-verified: `[development] recommendation generation: 82ms` appeared in the dev server log for the walkthrough above. Averaging today means reading log lines; a stored rolling average would be the natural next step if beta volume makes that worthwhile. |
| AI timeout rate | The two AI-call catch blocks (`src/app/api/assistant/message/route.ts`, `src/app/api/opportunities/[id]/application-help/route.ts`) already call `logError` (Step 2). The Anthropic SDK's own request timeout (`REQUEST_TIMEOUT_MS = 25_000`, `src/lib/ai/anthropic.ts`) surfaces as a distinguishable error type in that logged `err` object, so a timeout specifically is identifiable in logs by inspecting the error, even though it isn't tagged as a separate counter today. |
| Technical errors (general) | Every `logError` call across the app, now consistently stage-tagged since Step 2 — this is the general-purpose channel, not specific to recommendations or AI. |
| Mobile issues | No automatic detection exists or is being added — this is inherently a UX judgment call. Reported through the general feedback intake channel (`docs/PHASE_6_BETA_PLAN.md` §5) or the `OTHER` feedback reason with a comment; Step 1's audit already confirmed the core journey works on a 320px viewport, so this metric is about beta-specific device/browser combinations Step 1 couldn't pre-test, not a known gap. |

## Verification

5 new unit tests (`src/lib/beta-metrics.test.ts`), 89/89 total unit tests
passing, 8/8 E2E specs passing, typecheck and lint clean. One live
end-to-end walkthrough against real data, described above, with the
fixture deleted after.
