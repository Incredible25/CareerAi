# UX Review (Mobile-First)

Phase 5, Module 8. A live visual walkthrough — Playwright driving a real
browser at a 320px viewport (the original iPhone SE's width, the most
cramped common phone size and a reasonable stand-in for a budget Android
device too), screenshotting every screen in the full journey and actually
looking at each one, not just checking that elements exist in the DOM.
Two real defects were found and fixed; everything else held up well.

## Checklist from the Phase 5 brief

**Is the purpose immediately clear?** Yes. The landing page's headline
("Discover your direction. Build your skills. Find your opportunities.")
and one-line differentiator ("not a personality quiz, not a generic
chatbot") make the product's purpose legible in the first screen, with no
scrolling needed to understand what it is.

**Are the questions easy to understand?** Yes. Every assessment statement
is plain, concrete, first-person language ("I enjoy coming up with new
ideas...", "When something breaks or goes wrong, I want to be the one who
figures out why") — no jargon, no trait-key names leaking into the UI
(already confirmed structurally in Module 2; re-confirmed visually here).

**Is the assessment too long?** 18 questions across 4 screens is
reasonable as a total count. One real trade-off worth naming: the two
larger categories ("How you think," "How you work with others" — 5 and 6
questions respectively) make for a tall single screen requiring real
scrolling before the Next button appears. Not broken, not recommended
against — just a genuine length/scroll trade-off, noted rather than
"fixed," since the alternative (more, shorter screens) has its own cost
(more taps, more loading transitions).

**Is the recommendation page understandable?** Yes — genuinely strong.
Score, ranked list, plain-language reasons, an expandable (opt-in, not
forced) "See how this score was calculated" breakdown, clear CTAs. Nothing
overwhelms the first view.

**Can users easily understand why a career was recommended?** Yes — every
match shows 2-4 concrete reasons before any expansion is needed ("Matches
your strength in social orientation," "Your background in Biology lines up
with this field"), consistent with the Module 2 rubric's finding that
explanations are already plain-language by construction.

**Are there too many technical terms?** No jargon found anywhere in the
walkthrough — trait labels, factor labels, and skill-level labels are all
already plain English (re-confirmed visually; Module 2 confirmed this in
code).

**Is the navigation intuitive?** Yes for the core flow (linear
onboarding → assessment → matches, with a persistent step indicator on
both onboarding and assessment). The step-progress pills on
onboarding wrap onto two rows at this width (3 pills fit on row one, 2 on
row two) — visually a little uneven but functionally clear (checkmarks for
completed steps, current step highlighted, plus "Step X of 5" text
alongside it), not confusing in practice.

**Is the mobile experience good?** Now yes — see the two fixes below. One
was a genuine, confirmed-broken interaction at this exact viewport before
the fix.

**Are calls-to-action clear?** Yes throughout — one primary action per
screen almost everywhere (Continue / Create account / See my plan / See my
career matches), consistently styled, thumb-reachable at the bottom of
each card.

## Fix 1 (critical): skills step overflowed a 320px device

**Before**: the onboarding skills step lists all 74 catalog skills, each
with 4 tap-target buttons ("Not yet" / "Beginner" / "Intermediate" /
"Advanced") laid out in a non-wrapping row. Measured directly: at a true
320px device width, the page's layout width expanded to 373px to
accommodate the row, meaning **the "Advanced" button was genuinely
off-screen and unreachable** without a user discovering they could
horizontally pan a card-based list — not a control most people think to
try. This affected all 74 skill rows identically, and would have been the
first onboarding step (after the single required education dropdown)
every mobile user hits.

**Verification, not assumption**: confirmed via direct DOM measurement
(`document.documentElement.scrollWidth` at 373 vs. true device width of
320) before touching any code, and re-measured after the fix
(`scrollWidth` now exactly 320, `"Advanced"`'s bounding box fully within
the viewport). Not inferred from a screenshot alone.

**Fix**: `src/components/onboarding/steps/skills-step.tsx` — the button
group now wraps (`flex-wrap`) and takes the full row width on narrow
screens, arranging into a clean 2×2 grid instead of overflowing. Visually
confirmed clean after the fix (screenshot comparison, before/after).

**Locked in**: `e2e/mobile-ux.spec.ts`, a new permanent regression test at
a 320px viewport asserting no horizontal overflow and that every level
button is fully within the viewport bounds.

## Fix 2 (critical): stale copy told users a shipped feature didn't exist yet

**Before**: the assessment results page's "What happens next" section
read: *"Your ranked career matches... are generated from this profile in
the next part of 3Doors — coming shortly as the career recommendation
engine ships."* This is leftover placeholder copy from before the
matching engine was built. It's been fully functional and shipped for the
entire engagement — the very next screen in the walkthrough is the real,
working matches page. Telling a user their results are "coming shortly"
immediately before showing them their actual results is a real accuracy
and trust problem, not a cosmetic one: it's exactly the kind of stale
claim the whole Phase 5 audit exists to catch.

**Fix**: `src/app/assessment/results/page.tsx` — copy now accurately says
matches are ready now, and the primary CTA changed from "Go to my
dashboard" to "See my career matches" (linking directly to `/matches`),
since that's the actually-relevant next step right after finishing the
assessment, not one more hop away through the dashboard.

## Noted, not fixed (minor, not broken)

- The two access-step checkbox cards ("I have access to a laptop...",
  "...a smartphone") wrap their label text narrowly in a 2-column grid at
  320px. Legible, not cut off — a polish item, not a defect.
- The assistant page's message input placeholder text truncates at this
  width (standard input behavior across virtually every app; doesn't
  affect typing or sending).
- The portfolio page's empty state auto-opens the add-project form
  (arguably better than a static "nothing here" message) but still shows
  a "Cancel" button next to "0 projects," which reads slightly oddly with
  nothing to cancel back to. Cosmetic only.

## What this module did not re-litigate

Module 2 already confirmed explanation language is plain and
non-jargon-laden by reading the code; this module re-confirmed the same
conclusion by looking at real rendered screens, which is a different and
complementary kind of evidence, not a redundant check — code can say the
right label and still render badly, or vice versa. Both checks agreeing
is the actual confidence, not either alone.

## Verification

Full unit suite (64 tests) and E2E suite (8 specs, 1 new) pass. Both fixes
were visually re-confirmed after the code change, not just measured
numerically. All QA fixture users and scratch scripts deleted after.
