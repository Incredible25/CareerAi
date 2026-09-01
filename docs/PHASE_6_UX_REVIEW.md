# Phase 6 Step 8 — Mobile/UX Re-Review

Not a fresh ground-up UX pass — `docs/UX_REVIEW.md` (Phase 5 Module 8) already
did that, live, at a 320px viewport, and found/fixed two real defects. This
step re-checks only what Phase 6 actually touched, using the same
verify-don't-assume method (live screenshot + DOM measurement, not code
reading alone). No redesign; only genuine usability problems are in scope,
per the phase's own instruction.

## What Phase 6 touched that could affect layout or copy

1. **Access step — LinkedIn/portfolio fields hidden for minors**
   (`src/components/onboarding/steps/access-step.tsx`, Step 2B).
2. **Five call sites now render dates via `formatCameroonDate()`** instead
   of `.toLocaleDateString()` (Step 2A) — same general string shape
   ("30 August 2026"), different formatting path.

Nothing else in Phase 6 (rate-limit fix, security headers, prompt-injection
framing, docs) touches any rendered UI.

## Check 1 — minor account, access step, 320px viewport

Live-verified, not assumed: registered a real `UNDER_16` account, walked
onboarding to the access step (step 5 of 5) at a true 320px viewport,
screenshotted, and measured `document.documentElement.scrollWidth`.

**Result**: `scrollWidth` is exactly 320 (no overflow), the LinkedIn/
portfolio block is cleanly absent — no leftover gap, no empty grid, no
layout jump. The "Finish profile" button sits directly after the
Languages field, exactly where it would if the hidden block were never
there. The parent form's `space-y-5` vertical rhythm handles the
conditional block correctly by construction (confirmed visually, not just
assumed from the Tailwind class). Screenshot reviewed directly.

**Fixture cleanup**: the one test account created for this check was
deleted from the database immediately after.

## Check 2 — Cameroon-date call sites

Not re-screenshotted individually this session — lower risk and already
covered by existing evidence: `formatCameroonDate()` produces the same
general string shape ("30 August 2026") as the `.toLocaleDateString()`
calls it replaced, just via a different (correct, timezone-explicit) code
path, and every one of the five call sites is exercised by the existing
E2E suite (the golden-path spec renders `/matches`'s "Last calculated"
line; the full suite's 8/8 pass confirms none of the five call sites
throw or render visibly broken text). Re-screenshotting five short date
strings that already render inside passing E2E runs would be re-verifying
the same fact a second, redundant way rather than checking something new.

## No other UI changes this phase

Confirmed by reviewing this session's full diff (`git log` since the
Phase 5 Module 9 commit): no other component, page, or style file was
touched. `docs/UX_REVIEW.md`'s findings — including the two "noted, not
fixed" cosmetic items (access-step checkbox label wrapping, portfolio
empty-state Cancel button) — stand unchanged; none were in scope for
Phase 6 since fixing them wasn't a genuine usability problem introduced or
surfaced by this phase's own changes.

## Verification

Full unit suite (76 tests) and E2E suite (8 specs) both pass, unchanged
from Step 5's numbers — no new UI-facing test was needed since the
existing `mobile-ux.spec.ts` and `golden-path.spec.ts` specs already
exercise the pages Phase 6 touched. One live manual fixture created and
deleted for Check 1.
