# Phase 7 Step 11 — Beta Decision Framework

Objective criteria for classifying CareerAI at the end of the beta,
evaluated against `computeBetaMetrics()` (Step 6) and
`computeBetaFeedbackPatterns()` (Step 10) output, plus whether any
critical failure (`docs/PHASE_7_FAILURE_LEVELS.md`) occurred. **Not**
based on how many participants said they liked the product — a
popularity read is explicitly excluded, per the phase's instruction.

Categories are **not mutually exclusive**. More than one can apply at
once (e.g. a genuinely good recommendation engine with a confusing
onboarding step is both A-adjacent and C) — forcing a single label when
the evidence points two ways would be less honest than reporting both.
Evaluate every category's criteria independently; report all that match.

## E. NOT READY FOR EXPANSION

Any of:
- At least one **critical failure** (`docs/PHASE_7_FAILURE_LEVELS.md`)
  occurred and is unresolved at the time of evaluation.
- More than one critical failure occurred during the beta window, even
  if each was eventually fixed — `docs/PHASE_6_BETA_PLAN.md` metric 6's
  bar is "zero critical bugs, always"; a second occurrence means the
  first fix didn't hold or the class of bug wasn't fully understood.
- `assessmentCompletionRatePercent` is below 50% with no identified
  cause — the reasoned floor from `docs/PHASE_6_BETA_PLAN.md` metric 2,
  applied here as a hard stop rather than just an "investigate" signal,
  because it means the core journey itself isn't working for an
  invited, opted-in cohort.

If E applies, it overrides A regardless of what any other category's
evidence shows — a critical failure or a broken core journey means the
product isn't ready to expand, whatever the recommendation quality looks
like elsewhere.

## D. NEEDS SECURITY/INFRASTRUCTURE WORK

Any of:
- The critical failure that triggered category E (if any) was in the
  privacy/security/access-control/data-leakage class specifically
  (`docs/PHASE_7_FAILURE_LEVELS.md`'s critical table, rows 1-5) — not a
  bad-recommendation class critical failure, which is a B-shaped problem
  instead.
- Any item in `docs/PHASE_7_PRODUCTION_VERIFICATION.md` was run for real
  during the beta window and returned a **Failure** result (a real
  X-Forwarded-For bypass in production, a plaintext DB connection
  accepted, or a prompt-injection reply that violated the system
  prompt's rules).
- `logError`-tagged technical errors (Step 6) show a sustained pattern
  during the beta window, not an isolated one-off — "sustained" here
  means recurring across multiple distinct users/sessions, not the same
  person hitting the same known issue repeatedly.

## B. NEEDS RECOMMENDATION ENGINE IMPROVEMENT

Any of:
- `recommendationRelevancePercent` (Step 6) is below 50% once
  `feedbackCount` reaches at least 20 — the same reasoned floor and
  sample-size threshold `docs/PHASE_6_BETA_PLAN.md` metric 1 already
  established, now computed on real beta data instead of projected.
- `explanationInsufficiencyRatePercent` (Step 6) exceeds 30% of negative
  feedback — meaning insufficient explanation is not an occasional
  complaint but the dominant reason recommendations are rejected.
- The admin beta dashboard's negative-reason breakdown (Step 10) is
  dominated by relevance-shaped reasons specifically —
  `NOT_RELEVANT`/`DOESNT_MATCH_INTERESTS`/`DOESNT_MATCH_SUBJECTS`/
  `TOO_GENERIC`/`CONTRADICTORY` together account for most negative
  feedback, as opposed to `CONFUSING`/technical/UX-shaped reasons.
- A specific profile type or age range (Step 10's breakdowns) shows a
  markedly higher negative-feedback rate than the rest of the cohort —
  evidence the engine works for some student types and not others,
  which is itself a recommendation-quality finding, not a UX one.

**Explicitly not sufficient on its own**: a single participant's
subjective "this felt wrong" report. Per the engagement's standing rule
(also stated in `docs/PHASE_6_BETA_PLAN.md` §6 rule 3), that's an
invitation to investigate with real data, not evidence of a defect by
itself — this category requires the aggregate thresholds above.

## C. NEEDS UX IMPROVEMENT

Any of:
- `onboardingDropOffByStep` (Step 6) shows a strong concentration at one
  specific step, rather than a roughly even spread — a specific step is
  the friction point, not general fatigue.
- `assessmentInProgressCount` (Step 6) is high relative to
  `assessmentCompletionCount` — people are starting but not finishing
  the assessment specifically, as opposed to not starting at all
  (which would show up in registration-to-onboarding drop-off instead).
- The admin beta dashboard's negative-reason breakdown (Step 10) is
  dominated by `CONFUSING`, or by device/connectivity-correlated
  negative feedback (Step 10's internet-access/device-access
  breakdowns) — a signal the *experience* of using the product is the
  problem, not the recommendations it produces.
- General/qualitative feedback (the intake channel named in
  `docs/PHASE_6_BETA_PLAN.md` §5, for issues the structured widget
  doesn't capture) repeatedly names the same UI/flow friction across
  multiple participants.

## A. READY FOR NEXT-STAGE PILOT

All of:
- E's criteria are not met (no unresolved or repeated critical failure,
  healthy assessment completion).
- D's criteria are not met, **and** every item in
  `docs/PHASE_7_PRODUCTION_VERIFICATION.md` has actually been run
  against the real production/staging environment with a real API key
  and returned a Success result — not left unverified. A beta cannot be
  called "ready for the next stage" while those checks are still
  theoretical.
- B's and C's thresholds are not met — recommendation relevance and
  explanation quality are holding up, and no UX friction point dominates
  the feedback.
- The two product decisions Phase 6 left open (Cameroon content depth,
  who operates the next stage) have actually been made, not just
  documented as open — `docs/PHASE_6_BETA_PLAN.md` §1/§9.

## How to apply this at the end of the beta

1. Run `fetchBetaMetricsInput()` + `computeBetaMetrics()` and
   `computeBetaFeedbackPatterns()` (or read them off the admin beta
   dashboard, Step 10) for the real numbers.
2. Check whether any critical failure was logged during the window
   (`docs/PHASE_7_FAILURE_LEVELS.md`'s critical examples, cross-referenced
   against the admin dashboard's critical-reports banner and any manually
   escalated report).
3. Evaluate each category (E through A) against its criteria above, using
   the actual numbers from steps 1-2 — not impression, not how many
   participants said they enjoyed using it.
4. Report every category that matches, not just one. If none of B, C, D,
   or E match, the product is A. If only some match, name exactly which
   ones and why, so the next phase's scope is precise rather than a
   vague "needs more work."
