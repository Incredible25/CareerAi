# Phase 7 Step 8 — Beta Operations Workflow

The 12-step workflow from the brief, with each step mapped to the actual
mechanism that exists for it — this is an operating procedure for people,
not new code; every step below either points at something already built
in this phase or an earlier one, or names the human judgment call it
requires.

1. **Recruit user** — human process, per `docs/PHASE_7_BETA_INTAKE.md`:
   deliberately mixed across student type, age, device, connectivity, and
   digital-literacy comfort. No code involved.

2. **Create/invite account** — the recruited person registers themselves
   through the real, already-audited registration flow (Step 1). Once
   registered, whoever operates the beta runs
   `npx tsx prisma/mark-beta-user.ts <email> on` to add them to the
   cohort (`docs/PHASE_7_BETA_CONFIGURATION.md`).

3. **User completes assessment** — the existing onboarding → assessment
   flow, unchanged. `Profile.onboardingStep` and `Assessment.status`
   make partial progress visible if someone stalls (feeds Step 6's
   drop-off metric).

4. **User receives recommendations** — `generateCareerMatches()`, now
   with duration/failure logging (Step 6) so a slow or failed generation
   is observable, not silent.

5. **User evaluates recommendations** — the matches page, with each
   card's explanation (reasons list) and fit-breakdown, unchanged from
   Phase 5/6.

6. **User submits feedback** — the thumbs up/down plus the now-full A-J
   reason set (Step 4), directly on each match card.

7. **Admin reviews feedback** — `/admin/feedback`, extended in Step 10
   with the beta-specific view.

8. **Team classifies issue** — against the definitions in
   `docs/PHASE_7_FAILURE_LEVELS.md`: critical (pause and fix now) versus
   quality (track and pattern-match). The `INAPPROPRIATE` reason is
   treated as critical by default per that document, not routine triage.

9. **Critical issues are escalated immediately** — no queue, no batching:
   per `docs/PHASE_6_BETA_PLAN.md` §6 rule 1, a critical failure pauses
   beta expansion until fixed, whatever else is in flight.

10. **Quality issues are grouped by pattern** — this is the actual point
    of `computeFeedbackDashboard()`'s `negativeReasonCounts` and
    `mismatchFlaggedCareers` (existing Module 5 aggregation, now carrying
    the six new reasons from Step 4 automatically): a single person
    calling one match "too generic" is a data point; five people citing
    `TOO_GENERIC` on the same career, or a reason spiking in the
    beta-scoped view (Step 10), is a pattern worth acting on. **This is
    the workflow's explicit anti-goal-check**: don't react to individual
    preference, react to a pattern the aggregation surfaces.

11. **Fixes are prioritized** — `docs/PHASE_6_BETA_PLAN.md` §6's priority
    order: critical first always;
    quality issues by frequency and by which of the four trust adjectives
    (relevant/understandable/trustworthy/actionable) they undermine; any
    fix that would touch the deterministic scoring algorithm follows the
    engagement's standing rule — only after a concrete, proven
    input/output inconsistency, never on a single subjective report.

12. **Regression tests are added for confirmed defects** — the practice
    already used throughout every prior phase (e.g. `e2e/mobile-ux.spec.ts`
    added as a permanent test after Phase 5 Module 8's viewport-overflow
    fix; `src/lib/rate-limit.test.ts` added after Phase 6's spoofing fix):
    a confirmed beta defect gets a test that would have caught it, not
    just a one-off patch. Applies identically here — this workflow
    doesn't introduce a new testing convention, it just says explicitly
    that beta-sourced defects follow the same rule as everything else in
    this engagement.

## What this workflow deliberately doesn't do

No new database table, admin page, or ticketing system was built to
track "issue → classified → escalated → fixed → regression-tested" as a
formal pipeline. For 15-25 users, the existing feedback dashboard plus a
person following this checklist is proportionate; a dedicated bug-tracking
system would be infrastructure this beta size doesn't justify — the same
judgment already applied to alerting (`docs/PHASE_6_BETA_PLAN.md` §3) and
to the metrics event-log question (`docs/PHASE_7_BETA_METRICS.md`).
