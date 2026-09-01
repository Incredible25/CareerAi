# Phase 7 — Controlled Beta & Real-User Validation

Index of everything produced in Phase 7, in the order the phase's 14-step
spec named them. Builds on Phase 6's documentation
(`docs/PHASE_6_INDEX.md`) rather than replacing it — Phase 6's docs are
updated in place where Phase 7 resolved something they left open (see
"What was updated in place" below), referenced everywhere else.

| Step | Document | What it covers |
|---|---|---|
| 1 | `docs/PHASE_7_BETA_READINESS_AUDIT.md` | Live walkthrough of the full journey (landing → registration → onboarding → assessment → recommendations → explanations → feedback → session management) for both a normal and a minor account. No blockers found. |
| 2 | `docs/PHASE_7_BETA_CONFIGURATION.md` | `DEPLOYMENT_STAGE`, `User.isBetaUser`, the `BETA_ACCESS_ENABLED` kill switch, `logError`/`logTiming` — one centralized module (`src/lib/deployment.ts`), live-verified. |
| 3 | `docs/PHASE_7_BETA_INTAKE.md` | Minimum beta-cohort data, mapped onto existing fields — no new PII collected. |
| 4 | `docs/PHASE_7_BETA_FEEDBACK.md` | Extends the existing structured-feedback system with 6 new reasons covering the beta's A-J set. |
| 5 | `docs/PHASE_7_FAILURE_LEVELS.md` | Critical vs. quality failure definitions, with the exact example set and how each is actually caught/reported. |
| 6 | `docs/PHASE_7_BETA_METRICS.md` | `src/lib/beta-metrics.ts` — every DB-queryable metric from the brief, implemented and live-verified; log-based metrics named honestly where a DB row doesn't exist. |
| 7 | `docs/PHASE_7_PRODUCTION_VERIFICATION.md` | Exact commands and pass/fail criteria for DB role/TLS, reverse-proxy behavior, and the live-model prompt-injection test. None run — no production access in this sandbox. |
| 8 | `docs/PHASE_7_BETA_OPERATIONS.md` | The 12-step recruit-to-regression-test workflow, mapped to the actual mechanism for each step. |
| 9 | `docs/PHASE_7_BETA_TEST_SCRIPT.md` | Plain-language participant guide — deliberately not coaching toward positive feedback. |
| 10 | `docs/PHASE_7_ADMIN_BETA_DASHBOARD.md` | Beta-cohort section added to `/admin/feedback`: critical-report banner plus profile-type/age/connectivity/device breakdowns. Live-verified against a real screenshot. |
| 11 | `docs/PHASE_7_BETA_DECISION_FRAMEWORK.md` | Objective, evidence-based criteria for the five end-of-beta classifications (A-E), tied to real metric fields, not participant sentiment. |
| 12 | `docs/PHASE_7_OPPORTUNITY_LAYER_UNTOUCHED.md` | Confirms the hard constraint held — one line changed in that whole area, a logging consistency swap, nothing else. |
| 13 | This document | Index and consolidation. |
| 14 | `docs/PHASE_7_FINAL_REPORT.md` | The final report delivered to you. |

## Known limitations carried into the beta

- **AI assistant chat has no structured feedback reason** — only
  thumbs up/down (`docs/PHASE_7_FAILURE_LEVELS.md`). The A-J reason set
  is specifically about recommendations.
- **Failure/duration metrics are log-based, not a stored metrics
  table** — proportionate for 15-25 users; grep, not a dashboard number
  (`docs/PHASE_7_BETA_METRICS.md`).
- **Mobile issues have no automatic detection** — reported via feedback
  comments or the general intake channel, not a computed metric
  (`docs/PHASE_7_BETA_METRICS.md`).
- **No beta bug-tracking system was built** — the existing feedback
  dashboard plus this workflow document is the whole mechanism
  (`docs/PHASE_7_BETA_OPERATIONS.md`), deliberately, at this cohort size.

## Remaining verification items (not falsely marked verified)

All three items in `docs/PHASE_7_PRODUCTION_VERIFICATION.md` —
database role/TLS, reverse-proxy header behavior, and the live-model
prompt-injection test — require real production or staging access this
sandbox does not have. Each has an exact, copy-pasteable procedure and
pass/fail criteria; none has actually been run.

## Beta results

**BETA NOT YET EXECUTED.** No real beta user has used the product as
part of this phase — everything above is infrastructure, documentation,
and mechanism, built and verified with fixture accounts (created and
deleted, never left in the database) standing in for real users. No
metric in `docs/PHASE_7_BETA_METRICS.md`, no pattern in
`docs/PHASE_7_ADMIN_BETA_DASHBOARD.md`, and no classification in
`docs/PHASE_7_BETA_DECISION_FRAMEWORK.md` reflects real beta usage —
they reflect that the mechanisms work when exercised, which is a
different and narrower claim. Actually recruiting and running the 15-25
person cohort (`docs/PHASE_7_BETA_OPERATIONS.md` step 1 onward) is
outside this phase's scope — it's a human process this document sets up
for, not one Claude can execute.

## What was updated in place (Phase 6 docs)

None of Phase 6's documents needed correction this phase — Phase 7
builds on Phase 6's state rather than revising it. The one place Phase 6
is directly extended rather than referenced is
`docs/PHASE_6_PRODUCTION_READINESS.md`'s item 17 (beta operational
readiness), which this phase's Steps 8-11 now answer in full.

## Decisions for the next phase

1. **Actually run the beta.** Recruit the 15-25 participants
   (`docs/PHASE_7_BETA_INTAKE.md`), send them
   `docs/PHASE_7_BETA_TEST_SCRIPT.md`, and operate it per
   `docs/PHASE_7_BETA_OPERATIONS.md`. This is the one thing this phase
   could not do itself.
2. **Run the three production verification checks** (Step 7) against
   real production/staging access, ideally before or during the beta
   window rather than after.
3. **The two Phase 6 product decisions still need making**: Cameroon
   content-depth timing, and who operates the beta day-to-day
   (`docs/PHASE_6_BETA_PLAN.md` §1/§9) — both are prerequisites the
   decision framework's category A checks for.
4. **Apply the decision framework** (Step 11) once real feedback exists,
   and let its output — not this document — determine what Phase 8 is.
