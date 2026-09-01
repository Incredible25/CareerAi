# Phase 7 Step 4 — Beta Feedback System

**No new feedback architecture was built.** The existing Phase 5 Module 4
system (`FeedbackReason` enum → `FEEDBACK_REASON_LABELS`/`FEEDBACK_REASON_ORDER`
constants → a data-driven reason picker in `MatchFeedback` → aggregated by
`computeFeedbackDashboard()`) already covers exactly the shape the beta
needs: a thumbs up/down vote plus an optional structured reason. This step
extended the reason set to cover the beta brief's A-J list and confirmed
the rest of the pipeline needed zero changes to carry the new reasons
through — exactly the "don't build a separate architecture" instruction.

## A-J, mapped to the actual mechanism

| Beta reason | How it's represented |
|---|---|
| A. Recommendation was useful | `helpful: true` (existing 👍 vote) |
| B. Recommendation was not useful | `helpful: false` (existing 👎 vote) |
| C. Did not match my profile | Already covered — `DOESNT_MATCH_INTERESTS` / `DOESNT_MATCH_SUBJECTS` (existing reasons, more precise than a single "didn't match" code since they distinguish *which* part of the profile) |
| D. Confusing | **New**: `CONFUSING` — "The explanation was confusing" |
| E. Too generic | **New**: `TOO_GENERIC` — "Felt too generic" |
| F. Contradictory | **New**: `CONTRADICTORY` — "Seemed contradictory" |
| G. Inappropriate | **New**: `INAPPROPRIATE` — "Seemed inappropriate" |
| H. Insufficient explanation/evidence | **New**: `INSUFFICIENT_EXPLANATION` — "The explanation wasn't convincing enough" |
| I. Technical problem | **New**: `TECHNICAL_PROBLEM` |
| J. Other | Already covered — `OTHER` (with the existing free-text follow-up field) |

Six new `FeedbackReason` enum values (migration
`20260901113404_add_beta_feedback_reasons`); everything else — the zod
validation schema, the label/order constants, the picker component, and
the aggregation function — either needed the same three-line addition
(new enum members in the constants file) or **needed nothing at all**:
`computeFeedbackDashboard()` iterates reasons generically via
`FEEDBACK_REASON_LABELS[reason]`, so the six new reasons already flow
into the admin dashboard's `negativeReasonCounts` breakdown without any
change to that function.

## Connected to the existing admin aggregation dashboard

Confirmed by reading `src/lib/feedback/aggregate.ts`, not assumed: the
per-reason breakdown (`negativeReasonCounts`) is generic over whatever
reasons exist in the data — it was never a hardcoded list. The six new
reasons appear there automatically once beta users start selecting them.
Step 10 covers what, if anything, the admin *view* itself should add on
top of this (e.g. surfacing `INAPPROPRIATE` specifically, since that maps
to a critical failure per Step 5) — this step only confirms the data
pipeline already carries them through correctly.

## Live verification, not assumed

A stale-Prisma-client dev server (running from before the migration)
initially produced a real `PrismaClientValidationError` when submitting a
new reason — caught immediately, traced to the running Node process still
holding the old-generated client in memory, fixed by fully killing and
restarting the dev server (confirmed no stray process remained via
`fuser`/`ps` before restarting). After that, a full live run through a
real registered account confirmed:

- All six new reason buttons render in the match-feedback UI.
- Selecting `CONTRADICTORY` posts `{"reason":"CONTRADICTORY", ...}` to
  `/api/feedback`, gets a `200` with the reason persisted in the response
  body, and the button's `aria-pressed` flips to `true`.
- Direct DB read after submission confirms the row.

Fixture accounts deleted after.

## Verification

84/84 unit tests, 8/8 E2E specs, typecheck and lint all pass.
