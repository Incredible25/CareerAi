# Phase 7 Step 10 — Admin Beta Dashboard

Extends the existing `/admin/feedback` page (Phase 5 Module 5) with one
new "Beta cohort" section, rather than a separate admin page — same
guarantee, same layout language, same aggregate-only rule. Answers
exactly the eight questions in the brief; nothing beyond them was added.

| Question | Where it's answered |
|---|---|
| What recommendations are users rejecting most? | Already answered by the existing "Most negatively rated careers" card (Module 5) — unchanged. |
| Which explanations receive the most negative feedback? | Already answered by "Common reasons for negative feedback," now carrying the Step 4 reasons automatically (`CONFUSING`, `INSUFFICIENT_EXPLANATION`, etc.) — unchanged code, richer data. |
| Which profile types produce poor recommendations? | **New**: "Negative feedback by education level" — the direct proxy for student-type mix (Step 3's mapping). |
| Are there patterns among different age groups? | **New**: "Negative feedback by age range." |
| Are there mobile/connectivity problems? | **New**: "Negative feedback by internet access" and "by device access." |
| What technical problems occur most frequently? | Already answered generically by "Common reasons for negative feedback" (`TECHNICAL_PROBLEM` now included) — no beta-specific version needed since technical problems aren't profile-correlated the way relevance issues are. |
| Which issues are critical? | **New**: a dedicated orange-flagged card, shown only when `criticalReportCount > 0`, listing which careers received an `INAPPROPRIATE`-reason report — the one reason `docs/PHASE_7_FAILURE_LEVELS.md` treats as critical by default. |
| Which issues are quality improvements? | Everything else in "Common reasons for negative feedback" — no new code, same existing breakdown. |

## Implementation

`src/lib/feedback/beta-patterns.ts` — a new pure function
(`computeBetaFeedbackPatterns`), same pattern as
`src/lib/feedback/aggregate.ts`: independently unit-tested (5 tests), no
DB access inside it. `src/app/admin/feedback/page.tsx` adds one query
(feedback rows scoped to `user.isBetaUser: true`, joined just far enough
to reach `ageRange`, current `Education.level`, and `Profile`'s
device/connectivity fields) and one new rendered section.

**No unnecessary user information exposed**: verified by a dedicated unit
test asserting the JSON-serialized output never matches
`/email|userId|comment/i` — the same no-PII, no-free-text-comment
guarantee the original Module 5 dashboard already holds (comments were
never surfaced there either, confirmed by grep before writing this). The
critical-reports card shows a career name and a count, never which
participant reported it or what they wrote.

## Live verification, not assumed

Walked a real `AGE_16_18` / secondary-school / no-laptop / limited-
internet account through the full journey, submitted a `👎 Seemed
inappropriate` vote on a match, marked the account beta, promoted a
second real account to admin, and loaded `/admin/feedback` as that admin.
Confirmed on the rendered page (screenshot reviewed): the critical banner
("1 report flagged as inappropriate"), the correct career name
(Software Development), and all four new breakdowns showing the exact
values from the walkthrough (Secondary school, 16–18, Limited,
Smartphone only). All fixture accounts deleted after — zero
`phase7`-prefixed accounts remain in the database.

## Verification

5 new unit tests, 94/94 total unit tests, 8/8 E2E specs, typecheck and
lint all pass.
