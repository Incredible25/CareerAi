# Phase 6 Step 10 — Beta Launch Plan

Builds directly on `docs/BETA_READINESS.md` (Phase 5 Module 9), which
already defined most of the measurable success criteria and named the two
outstanding product decisions. This document adds what Module 9 didn't
cover: who the beta users are, how many, the monitoring/feedback
mechanics end-to-end, and explicit failure-severity definitions with a
triage process. It does not re-litigate the recommendation-mechanism
validation — that's Step 6 — or re-derive the metrics Module 9 already
defined; it operationalizes them.

**Core validation question this beta exists to answer** (as instructed):
*Does CareerAI give students career recommendations that feel relevant,
understandable, trustworthy, and actionable?* Everything below is in
service of answering that — not opportunity/job-scraping, which stays out
of scope for this phase as instructed.

---

## 1. Beta user profile

Drawing directly from the product's own stated audience
(`docs/PRODUCT_STRATEGY.md`) and what the app actually supports today:

- **Who**: secondary-school and early-tertiary students in Cameroon,
  spanning the app's own supported age ranges (`UNDER_16` through
  `AGE_19_24` — the ranges `isMinor` is computed from). A deliberately
  mixed group, not all-minor or all-adult, so both branches of the
  Step 2B `isMinor` behavior get exercised by real usage, not just tests.
- **Device/connectivity mix**: the onboarding Access step already asks
  about laptop/smartphone access and internet reliability — recruit
  across that spectrum (not only reliable-daily-internet, laptop-owning
  testers), since that's the realistic range the product claims to serve
  and Module 2's rubric dimension 11 already flagged that this data isn't
  yet *used* by the engine — beta usage from this range is also the
  cheapest way to observe whether that gap actually matters in practice.
- **How recruited**: invited, opted-in (per `docs/BETA_READINESS.md`
  Part 4's completion-rate reasoning, which assumes an opted-in cohort,
  not cold traffic). Recruitment channel itself (school partnership,
  personal network, etc.) is a business decision outside this document's
  scope.

## 2. Initial beta size

**Recommend starting at 15-25 users**, not a larger number, for reasons
specific to this product's current state, not a generic "start small"
rule:

- The one still-open product decision that most affects beta risk
  (Cameroon content depth, `docs/PHASE_6_PRODUCTION_READINESS.md` #3) is
  a *trust* risk that compounds with visibility — a small first cohort
  limits exposure while that's still an open decision, whatever the
  decision-maker chooses (frame-and-proceed, or content-pass-first).
- The rate limiter is explicitly documented as in-memory,
  single-instance (`docs/SECURITY_PRIVACY_REVIEW.md` §9) — untested at
  any real concurrency beyond Module 7's synthetic checks. 15-25 real
  people is a safe first real-world data point without betting the
  limiter's untested edges against a large cohort.
- Metric 2 in `docs/BETA_READINESS.md` (completion rate) and metric 6
  (critical bug count, defined below) both need enough users to be
  meaningful but not so many that a real defect affects a large group
  before it's caught — 15-25 gives a workable signal (Metric 1's reasoned
  floor already assumes "~20 pieces of feedback" as a meaningful sample).

**Expansion**: only after zero critical bugs (§4 below) across the first
1-2 weeks, and only in increments (e.g., next batch of 25-50), not a jump
to full public availability — this stays a controlled beta, not a soft
launch, until the two outstanding product decisions are actually made.

## 3. Monitoring during beta

What already exists and is READY today (`docs/PHASE_6_PRODUCTION_READINESS.md`
#16, #10):

- CI runs the full test suite on every push — a regression introduced
  during beta (if any code changes are made) won't ship silently.
- The admin feedback dashboard (`/admin/feedback`, Module 5) already
  shows positive-rate and feedback-rate live — this is the primary
  signal to watch daily during beta, not a new build.
- Rate-limit 429 responses and the AI assistant's error fallback are
  already the honest, non-leaking failure paths (`docs/
  SECURITY_PRIVACY_REVIEW.md` §12) — if either fires unexpectedly often,
  that's itself a monitoring signal worth noticing, even without a
  dedicated metrics dashboard.

**What's genuinely not built and is a real gap, named rather than
glossed over**: there's no automated alerting (e.g., "critical bug rate
exceeded threshold, notify someone") — during a 15-25 person controlled
beta, a human checking `/admin/feedback` and the bug-intake channel (§5)
daily is a reasonable, proportionate substitute, not a corner cut. Building
real alerting infrastructure for a 15-25 person beta would be premature
scope, consistent with the phase's instruction not to add speculative
infrastructure.

## 4. Failure severity definitions

Extends `docs/BETA_READINESS.md` Part 4 metric 6's critical-bug definition
with an explicit second tier, since the brief asks for both:

**Critical failure** (target: zero, always; pause expanding the beta
group until fixed):
- Blocks completing registration, onboarding, or the assessment.
- Blocks seeing career matches after a completed assessment.
- Loses or corrupts a user's own data.
- Any security or privacy issue (data exposure, auth bypass, an isMinor
  restriction failing to apply, etc.).
- The AI assistant or application-help feature producing a fabricated
  claim about the user's own history (the exact thing `ASSISTANT_SYSTEM_
  PROMPT`'s hard rules exist to prevent) — a rules failure, not just a
  bad user experience.

**Quality failure** (tracked, triaged, not an automatic pause):
- A recommendation that a real user reports as confusing, generic, or
  not useful (this is exactly what the existing thumbs-down + structured
  reason feedback already captures — no new mechanism needed, see §5).
- A UI/UX issue that degrades but doesn't block the journey (e.g., a
  layout quirk `docs/UX_REVIEW.md`'s "noted, not fixed" items already
  named — the same bar, applied prospectively).
- Slower-than-expected response time that doesn't time out (metric 7's
  already-set ~2× baseline threshold).
- A missing or unclear explanation for a specific match, without the
  match itself being wrong.

The dividing line: **critical failures break the product's basic promise
or safety; quality failures affect how good the experience is** — the
same distinction the core validation question draws between "does it
work" and "does it feel relevant, understandable, trustworthy, and
actionable."

## 5. Feedback collection pipeline

**Already built, READY, nothing new required**: the thumbs up/down plus
structured reason codes on career matches (Phase 5 Module 4) flow
directly into `/admin/feedback` (Module 5), which already aggregates
positive rate, feedback rate, and reason breakdowns with zero exposed
user identifiers (`docs/SECURITY_PRIVACY_REVIEW.md` §7). This is the
primary channel for **quality failures** specifically, since it's
purpose-built to capture "was this recommendation good," which is exactly
what a quality failure is.

**For critical failures and anything the structured feedback widget
can't capture** (a broken page, a confusing flow, a trust concern): needs
a lightweight intake channel that doesn't exist in-app today — an email
address or shared inbox is sufficient for 15-25 users; building an
in-app bug-report form would be more infrastructure than this beta size
justifies. This is a decision for whoever runs the beta (which inbox,
who monitors it), not a code change.

## 6. Bug prioritization

1. **Critical failures (§4) are fixed before anything else**, and beta
   expansion pauses until they are — no exceptions, consistent with
   metric 6's "zero critical bugs, always" bar in `docs/BETA_READINESS.md`.
2. **Quality failures are triaged by frequency and by which of the four
   trust adjectives they undermine** (relevant / understandable /
   trustworthy / actionable — the core validation question's own
   language): a quality issue that multiple testers independently report,
   or one that undermines *trust* specifically (since trust, once lost,
   is the hardest of the four to recover), is prioritized over a
   one-off cosmetic note.
3. **Anything that would require touching the deterministic scoring
   algorithm** follows the engagement's standing rule: only after a
   concrete, proven input/output inconsistency is demonstrated — a
   single subjective "this felt wrong" report is a prompt to *investigate*
   with real data (the same way Module 10's evaluation harness was used
   throughout this engagement), not license to change the formula on a
   hunch.
4. **Opportunity/job-related feedback is captured but not acted on as a
   priority this phase** — consistent with the explicit instruction that
   the opportunity layer stays separate from this phase's focus. If a
   critical bug happens to be in that layer, it's still fixed under rule
   1; a quality note about it is logged, not chased.

---

## Summary

The beta *mechanism* — feedback capture, admin visibility, test coverage,
core-journey reliability — is READY today and required no new building
this step. What this document adds is the human process around it: a
right-sized cohort (15-25, mixed device/connectivity/age), a monitoring
routine proportionate to that size, explicit severity definitions with a
concrete example set, and a prioritization order that keeps the beta
focused on its actual question — recommendation quality and trust — not
on the opportunity layer or on speculative infrastructure this size
doesn't need.
