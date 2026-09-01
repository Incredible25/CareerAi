# Phase 7 Step 5 — Failure Level Definitions

Refines `docs/PHASE_6_BETA_PLAN.md` §4's critical/quality split with the
exact example set the Phase 7 brief specifies, and — where one exists —
names the real mechanism in the app that would surface or catch each
example, rather than leaving the definitions abstract.

## CRITICAL FAILURES

Anything in this category pauses expanding the beta cohort until fixed
(`docs/PHASE_6_BETA_PLAN.md` §6, rule 1) — no exceptions, whatever else is
in flight.

| Example | What it looks like in this app / how it's caught |
|---|---|
| Privacy/security issue | Data exposed to a user or admin view that shouldn't be (`docs/SECURITY_PRIVACY_REVIEW.md`'s per-route review is the baseline; a beta report here reopens that review for the specific route). |
| Unauthorized access | A route's ownership check (`docs/SECURITY_PRIVACY_REVIEW.md` §2) fails to stop a user acting on another user's resource. |
| Minor-safety issue | The `isMinor` restriction (`docs/PHASE_6_DECISIONS.md`) is bypassed — e.g. a minor's LinkedIn/portfolio URL is saved despite `applyMinorFieldRestrictions()`. |
| Incorrect account access | Session/auth failure — one account's session resolves to a different account's data, or a signed-out session still reaches a protected route. |
| Data leakage | Any response (UI or API) includes another user's personal data, or the admin dashboard's aggregate-only guarantee (`docs/SECURITY_PRIVACY_REVIEW.md` §7) is violated. |
| System failure preventing the core journey | Any of the six journey steps validated in Step 1 (register → onboarding → assessment → matches → explanation → feedback) stops working for a real user. |
| Dangerous or seriously inappropriate recommendation | A career recommendation that is genuinely harmful or inappropriate content, not merely a bad fit — **now has a direct reporting path**: the `INAPPROPRIATE` feedback reason added in Step 4. A report using that specific reason should be treated as critical by default and triaged first, not queued behind ordinary quality feedback. |
| Recommendation generated from clearly incorrect user information | Not a "the algorithm is wrong" case — this is specifically when the *input* was clearly bad (e.g. a data-entry or state bug fed the scoring engine stale, corrupted, or mismatched profile data) and the output reflects that corrupted input faithfully. Distinguish this from a quality failure by checking the input first: if the profile data the engine received was itself wrong, it's critical (a data-integrity bug); if the input was correct and the output is just an unconvincing match, it's a quality failure. |

## QUALITY FAILURES

Tracked and triaged by pattern (`docs/PHASE_6_BETA_PLAN.md` §6, rule 2),
not an automatic pause.

| Example | Reporting path |
|---|---|
| Generic recommendation | `TOO_GENERIC` feedback reason (Step 4). |
| Weak explanation | `INSUFFICIENT_EXPLANATION` feedback reason (Step 4). |
| Irrelevant career | `NOT_RELEVANT` / `DOESNT_MATCH_INTERESTS` / `DOESNT_MATCH_SUBJECTS` (existing reasons). |
| Duplicate recommendation | Structurally shouldn't be reachable (`docs/RECOMMENDATION_QUALITY_RUBRIC.md`'s Phase 6 re-validation confirmed this) — a real beta report of this specific shape would actually be surprising enough to warrant immediate investigation as a possible critical data-integrity bug, not routine quality triage. |
| Unclear wording | `CONFUSING` feedback reason (Step 4). |
| Poor UX | No dedicated feedback reason (UX issues aren't tied to one recommendation) — reported via the general intake channel named in `docs/PHASE_6_BETA_PLAN.md` §5, not the structured widget. |
| Confusing AI response | Applies to the AI assistant chat specifically (thumbs down on a message, `MessageFeedback` — no structured reason there today, see "Known limitation" below). |
| Inaccurate but non-dangerous information | `CONTRADICTORY` feedback reason if it's a specific contradiction (Step 4), otherwise general intake. |

## The dividing line

Same principle as `docs/PHASE_6_BETA_PLAN.md` §4: **critical failures
break the product's basic promise or safety** (privacy, access control,
minor safeguarding, or the core journey simply not working) — **quality
failures affect how good the experience is**, assuming the product is
fundamentally working and safe. A critical failure is never "we'll get to
it eventually"; a quality failure is triaged by how many people hit it
and which of the four trust adjectives (relevant/understandable/
trustworthy/actionable) it undermines.

## Known limitation: AI assistant chat has no structured reason

`MessageFeedback` (`src/components/assistant/message-feedback.tsx`)
only captures thumbs up/down, no reason picker — it was never extended
with the A-J set in Step 4 because those reasons are specifically about
*recommendations*, and the assistant's open-ended chat isn't a
recommendation in that sense. If beta feedback surfaces a real pattern of
confusing or wrong assistant replies, that's tracked qualitatively via the
general intake channel for now — extending the assistant's feedback
mechanism would be a real, scoped follow-up if the pattern warrants it,
not something to build speculatively here.
