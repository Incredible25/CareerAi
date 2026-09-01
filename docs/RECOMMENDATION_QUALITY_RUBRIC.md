# Recommendation Quality Rubric

Phase 5, Module 2. A structured framework for evaluating what
`computeCareerFit()` (`src/lib/career-engine/scoring.ts`) actually produces,
applied against real evidence: the Module 10 evaluation harness output
(`npm run eval:recommendations`, 10 fictional profiles scored against the
real 32-career catalog) and the Module 1 Playwright golden-path run.

Each dimension below is scored **Pass / Partial / Fail**, with the specific
evidence cited (file:line, or a quote from a real eval run) — never a
general impression. "Partial" means the mechanism exists and works but has
a specific, named gap; "Fail" means the mechanism doesn't exist at all.

This document evaluates. It does not fix. Findings route to the module
already scoped to own that kind of fix (Module 3 for trust/copy, Module 6
for security, Module 9 for beta-readiness go/no-go) — consistent with the
approved Phase 5 plan, and with the standing instruction not to touch the
scoring algorithm without first proving a concrete input/output
inconsistency, not just a stylistic disagreement.

---

## 1. Relevance — Pass

Every one of the 10 fictional profiles' top matches in the Module 10 report
draws on the profile's actual stated interests/subjects/traits, never a
generic or unrelated top pick. Concretely: Emmanuel (STEM interests, high
analytical/technology trait scores) top-matched Software Development (73%,
Technology industry); Grace (community/health interests, high social
orientation) top-matched Nursing & Community Health (61%, Health industry).
No profile's top match came from an industry unconnected to its stated
signal.

**Mechanism**: `scoreInterestMatch`/`scoreSubjectMatch`/`scoreStrengthMatch`
(`scoring.ts:82-146`) all require actual overlap between profile and career
data — there's no fallback path that can surface an unrelated career at the
top unless every real career scores equally low, which the eval report
never showed.

## 2. Personalization — Pass

Scores visibly differ by profile, not by a flat "everyone sees the same
top 5." Compare Divine (scattered interests) — top score 45%, no dominant
winner — against Emmanuel (focused STEM signal) — top score 73%, clear
separation from #2 (72%) and #5 (51%). The `reasons[]` array is also
per-profile: it names the specific interests/skills/traits/subjects that
actually matched *that* profile (`scoring.ts:207-232`), not a templated
sentence with the career name swapped in.

## 3. Consistency — Pass

Confirmed twice, independently: (a) `scoring.test.ts` — "returns identical
output for identical input, called twice" — and (b) the engine has zero
code path into `src/lib/ai/anthropic.ts` (grep confirmed empty in the prior
audit). Same inputs always produce the same score, breakdown, and reasons.
The only way a user's score changes is a real change to their own data, the
catalog, or a formula version bump (`CAREER_ENGINE_VERSION`,
`scoring.ts:42`) — never sampling noise.

## 4. Explanation quality — Pass, with one contradiction (fixed in Module 3)

The `reasons[]` strings are plain-language and specific: "Strong interest in
technology & software," "You already have JavaScript," "Matches your
strength in analytical thinking," "Your background in Mathematics lines up
with this field." No jargon, no trait-key names leaking into user-facing
text (`TRAIT_LABELS` maps `analyticalThinking` → "analytical thinking",
never showing the raw key). The `FitBreakdownDetails` component
(`src/components/matches/fit-breakdown.tsx:4-12`) labels every scored
factor in plain words too ("Interests," "Skills," "Subjects," "Strengths,"
"Work style," "Your stated goal," "Learning feasibility") — readable by a
secondary-school student without a glossary.

**The one real defect**: `fit-breakdown.tsx:58-59` states *"nothing here is
generated or estimated by AI,"* while the badge directly above it on the
same page (`src/app/matches/page.tsx:49`) reads *"AI-assisted guidance, not
a guarantee."* Both can't be true about the same score, and the code proves
the first one is correct — this was stale/wrong copy on the badge, not an
engine defect. **Fixed in Module 3**: the badge now reads "calculated from
your answers, not a guarantee" (`src/app/matches/page.tsx:49`); the same
false claim on `/assessment/results` ("AI-assisted guidance tool") was
fixed to "Self-discovery guidance tool"
(`src/app/assessment/results/page.tsx:35`). Module 3 also strengthened the
breakdown disclosure itself to acknowledge the neutral-default behavior
from finding #11 below: a factor sitting near 50% "usually means we don't
have enough information yet... not that it's a middling match"
(`src/components/matches/fit-breakdown.tsx:58-61`).

## 5. Academic fit — Pass

`scoreSubjectMatch` (`scoring.ts:89-98`) does real (if blunt) fuzzy overlap
between the user's actual `Education.subjects` and each career's
`relevantSubjects`. Verified in the eval report: Ngozi's mismatched subject
combination (Fine Art, Biology, Economics) produced consistently modest
subject-driven scores (33-41% overall) rather than a falsely confident
match — the formula doesn't manufacture academic fit that isn't there.

## 6. Interest fit — Pass

`scoreInterestMatch` (`scoring.ts:82-87`) is a direct overlap calculation.
Verified: Amina's profile (zero selected interests) never once produced a
"Strong interest in X" reason string in the eval output, because there was
nothing to match — the system doesn't fabricate an interest signal the user
never gave it.

## 7. Skill fit — Pass

Three-tier credit system, not binary: full credit at/above the required
level, partial credit (60%) if owned-but-below-level (a real gap, not a
zero), zero if unowned entirely (`scoring.ts:107-118`). Verified directly
in `scoring.test.ts` ("gives partial credit... and flags it as a gap") and
in the eval report's Fabrice profile (wants Software Development, has no
matching skills) — the system surfaced the career with an honest 5-skill
gap count rather than hiding the gap behind a smoothed-over score.

## 8. Personality/strength fit — Pass

`scoreStrengthMatch` (`scoring.ts:127-146`) does a real weighted average
against each career's admin-authored `traitWeights`, and separately extracts
up to 2 "top traits" (≥65) for the reasons list — so the explanation reflects
the same numbers driving the score, not a separate narrative. Verified: every
STEM/creative/social archetype in the eval report surfaced a strength-based
reason matching its designed trait profile (e.g., Cynthia's "Matches your
strength in creativity").

## 9. Career diversity — Pass

32 seeded careers span 5 broad groupings with no single category dominating:
STEM/tech (7), business/entrepreneurship (7), creative (5), trades/hands-on
(5), social/community (3), plus adjacent engineering/hospitality/legal
categories. Confirmed by direct enumeration of `seed-careers.ts` in the
Phase 5 audit — not assumed.

## 10. African/Cameroonian context — **Fail** (routed to Module 9, beta go/no-go)

`docs/PRODUCT_STRATEGY.md:413,418` names Cameroon-specific career content a
**launch blocker**: *"no career profile ships without local pathway/
opportunity context."* Direct inspection of all 32 seeded careers found
only two incidental markers — French-language content on the translation
career (`seed-careers.ts:397,402`) and a generic, uncapitalized "local"
reference in a handful of beginner-project prompts (no country named). No
career profile names a Cameroonian institution, certification body, or
labor-market context. Certifications cited are global brands (Google
Career Certificates, CompTIA, HubSpot). This is a genuine content gap
against the product's own stated requirement, not a scoring-engine defect
— the formula correctly surfaces whatever `relevantSubjects`/
`relevantInterests`/pathway text exists, it's the seeded *content* that
isn't localized. Authoring local context for 32 careers is a content
project, not a Module 2 code fix; flagged here with severity **launch
blocker** (the strategy doc's own word) for the Module 9 beta-readiness
checklist to decide on explicitly rather than silently ship past it.

## 11. Realistic accessibility — **Fail** (new finding this module)

Onboarding's Access step collects `hasLaptop`, `hasSmartphone`, and
`internetAccess` (`src/components/onboarding/steps/access-step.tsx`), and
they're persisted to `Profile`. But `UserProfileInput`
(`src/lib/career-engine/types.ts:7-18`) — the only shape the scoring engine
reads — has no field for any of them. Confirmed by grep: `hasLaptop` and
`hasSmartphone` are referenced nowhere outside the onboarding form and the
raw DB write; `internetAccess` appears in exactly one place beyond that —
`src/lib/ai/context.ts:78` — as one line of free text shown to the AI chat
assistant, which a user may never open. The deterministic scoring and
roadmap engines that every user actually sees never factor in device or
connectivity access at all. A student who told the product they have
"limited, occasional" internet gets scored and routed through a roadmap
identically to one with reliable daily access — "realistic accessibility"
is asked about at signup and then never used. This doesn't require an
algorithm rewrite to fix (no existing factor needs to change), but it is a
real, previously-undocumented gap in what "personalized to your actual
circumstances" means for this product; recommending it as a candidate for
a future scoring-engine module rather than fixing inline here, since
changing `UserProfileInput` and the weighting touches the core algorithm
and the standing instruction is not to do that without a scoped, tested
change — flagged for a decision, not fixed silently.

## 12. Actionability — Pass

Every match links to a career-specific plan page with concrete, ordered
roadmap tasks (`buildRoadmapTasks`, `src/lib/career-engine/roadmap.ts`) —
never just a score with nowhere to go. Roadmap tasks are titled as concrete
actions ("Learn the basics of JavaScript," not "improve technical skills"),
and the dashboard's `getNextAction()` always resolves to exactly one
concrete next step with a real link, confirmed in the Module 1 golden-path
run (matches → career detail → plan, each with clear "Explore this career"
/ "See my plan" calls to action).

---

## Scorecard

| # | Dimension | Result |
|---|---|---|
| 1 | Relevance | Pass |
| 2 | Personalization | Pass |
| 3 | Consistency | Pass |
| 4 | Explanation quality | Pass (1 contradiction, fixed in Module 3) |
| 5 | Academic fit | Pass |
| 6 | Interest fit | Pass |
| 7 | Skill fit | Pass |
| 8 | Personality/strength fit | Pass |
| 9 | Career diversity | Pass |
| 10 | African/Cameroonian context | **Fail** → Module 9 go/no-go |
| 11 | Realistic accessibility | **Fail** → flagged for a scoped future module |
| 12 | Actionability | Pass |

**10 of 12 dimensions pass on direct evidence.** The two failures are both
real and both already have an owner: Cameroon-context content is an
explicit, named launch blocker for Module 9 to decide on; the unused
accessibility fields are a new finding that needs a scoping decision before
any engine change, not a Module 2 fix.

---

## Phase 6 Step 6 — re-validation

Re-ran `npm run eval:recommendations` fresh against the current codebase
(no scoring-engine code changed since Module 2 — Phase 6 touched only date
formatting, `isMinor`, and rate-limiting) to confirm nothing regressed, and
checked specifically for the failure modes named in the Phase 6 brief that
the original 12-dimension pass didn't separately call out.

**Fresh run: 27/27 automated sanity checks pass**, and the top-match
scores/reasons for every one of the 10 fictional profiles are byte-for-byte
consistent with what's cited above (Emmanuel → Software Development 73%,
Grace → Nursing & Community Health 61%, etc.) — confirming dimensions 1-9
and 12 still hold, not re-asserting them from memory.

| Failure mode | Checked | Result |
|---|---|---|
| Generic recommendations | Dimension 1/2 (Relevance/Personalization) | Still Pass — see above, re-confirmed this run. |
| Contradictory recommendations | N/A — structurally impossible: each career is scored once from a `findMany()` with no fan-out join, so the same career id cannot appear twice in one user's ranked list, and the ranking is a total order (no career can simultaneously outrank and be outranked by another in the same run — confirmed by the "identical input → identical output" consistency test). | Pass |
| Unsupported / weak-evidence recommendations | Every `reasons[]` string is generated only from an actual matched field (interest/skill/trait/subject/goal overlap that exists in the data) — grepped `scoring.ts`: no reason string is emitted unconditionally. Fabrice's aspirational-gap profile (dimension 7) is the sharpest test of this: the system still surfaces Software Development but reports the gap honestly rather than inventing supporting evidence that isn't there. | Pass |
| Overconfident / absolute language | Grepped all user-facing copy in `src/app` and `src/components` for absolute claims ("guarantee," "definitely," "certainly," "perfect fit," "will get you," "promise") — none found. | Pass |
| Inappropriate recommendations | Grepped the seeded career catalog for age-inappropriate categories (alcohol, gambling, tobacco, adult content, nightlife) — none found; all 32 careers are the same professional/vocational set already enumerated in dimension 9. Separately: the recommendation engine has no `isMinor`-aware branching at all (`UserProfileInput` carries no such field, confirmed in `docs/PHASE_6_DECISIONS.md`), so there is no code path that could serve a minor a *different*, unreviewed set of careers — every user sees recommendations drawn from the same reviewed catalog. | Pass |
| Unexplained recommendations | Every scored career in every eval run carries at least one `reasons[]` string (structurally guaranteed: `scoring.ts:207-232` only omits a reason category when there's genuinely no signal to name, never emits an empty `reasons[]` for a career that made the top 5). | Pass |
| Duplicate recommendations | See "Contradictory," above — same structural guarantee. | Pass |
| Mismatched recommendations (career doesn't fit the stated signal) | This is dimension 1/2/9's territory (industry-alignment checks in the eval harness itself: `entrepreneurship-oriented`→Business, `creative-careers`→Creative & Media, `technical-stem`→Technology, `social-community`→Health, all re-confirmed passing this run). | Pass |
| Misleading AI language | Grepped for "AI-generated"/"AI-powered"/"AI-assisted"/"AI-driven" across `src/app` and `src/components`: the one hit (`match-breakdown.tsx:45`) explicitly *disclaims* AI involvement in the deterministic score ("Nothing here is AI-generated") — this is the Module 3 fix holding, not a new instance of the problem it fixed. No page claims AI authorship of a score or roadmap that is, in fact, deterministic. | Pass |

**No new defect found.** The two open items from the original 12-dimension
pass (Cameroon/African context — dimension 10; unused accessibility
fields — dimension 11) remain open with the same owners named above; Phase
6 did not change either, and neither is a candidate for a quiet code fix
per the phase's own instruction not to touch the algorithm without a
concrete, proven inconsistency.
