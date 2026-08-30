# Beta Readiness Checklist

Phase 5, Module 9 — the final module. Pulls together every finding from
Modules 1–8 into one checklist for whether CareerAI is ready for a
controlled beta with a small group of real students, plus measurable
success criteria for that beta. Every "computable today" claim below was
verified against the real schema, not assumed.

---

## Part 1 — The six-step beta journey

The brief's minimum bar: can a real student create an account, complete
the assessment, receive recommendations, understand the reasoning,
explore career information, and give feedback.

| # | Step | Status | Evidence |
|---|---|---|---|
| 1 | Create an account | ✅ Ready | `e2e/golden-path.spec.ts` (Module 1), rate-limited against abuse (Module 6), password hashed with bcrypt |
| 2 | Complete the assessment | ✅ Ready | Golden path + 3 edge-case journeys (minimal info, onboarding/assessment abandonment-and-resume) all pass (Module 1) |
| 3 | Receive career recommendations | ✅ Ready | Deterministic, consistent, no false-confidence on sparse data (Modules 2, 10) |
| 4 | Understand the reasoning | ✅ Ready | Plain-language reasons and breakdown confirmed both in code (Module 2) and on real rendered screens (Module 8); the one messaging contradiction found is fixed (Module 3) |
| 5 | Explore career information | ✅ Ready | Career detail + plan pages reviewed directly, mobile-verified (Module 8) |
| 6 | Provide feedback | ✅ Ready | Thumbs up/down plus structured reasons (Module 4), reaching a real admin view (Module 5) |

All six are demonstrated working end-to-end, live, with automated
regression coverage — not just "the code looks right."

---

## Part 2 — Technical & operational readiness

| Area | Status | Notes |
|---|---|---|
| Automated test coverage | ✅ | 64 unit tests + 8 E2E specs (Modules 10, 1, 7, 8), all passing |
| CI runs tests on every push | ✅ | `.github/workflows/ci.yml` runs lint, typecheck, unit tests, the recommendation eval harness, and the full E2E suite |
| Recommendation quality | ✅ | 10/12 rubric dimensions pass on cited evidence (Module 2) |
| Trust/safety messaging | ✅ | Fixed (Module 3) |
| Structured feedback + admin visibility | ✅ | Built and live-verified (Modules 4, 5) |
| Login/registration abuse protection | ✅ | Rate limiting added and verified live (Module 6) |
| DB-outage / network-failure behavior | ✅ | Tested against a real outage; fails safely at every layer checked (Module 7) |
| AI-call timeout | ✅ | Fixed — was unbounded at 10 minutes (Module 7) |
| Mobile experience | ✅ | Two confirmed defects found and fixed (Module 8) |
| **Least-privilege DB role + TLS-in-transit** | ⚠️ **Verify at deploy time** | This dev/CI environment uses a single superuser connection string — not fixable from code, must be checked against the actual production database provider before launch (Module 6) |
| **Reverse proxy sets `x-forwarded-for`** | ⚠️ **Verify at deploy time** | The register rate limiter depends on this; confirmed working logically but only testable against a real proxy in front of production (Module 6/7) |
| Admin audit trail | ⚠️ Known gap | No log of "which admin verified/rejected/edited what, when" beyond the raw `createdBy`/`updatedBy` fields already on `Opportunity` rows. Not a beta blocker (the opportunity layer isn't being built further per your explicit instruction) but worth planning for whenever admin usage grows beyond one or two trusted people. |

---

## Part 3 — Decisions for you, not resolved unilaterally

Two items were explicitly flagged across Modules 2 and 6 as needing a
product decision, not a silent code fix. Repeating them here because
Module 9 is where they actually get decided, not just noted:

### Cameroon/Africa content depth (Module 2 finding, strategy doc's own launch blocker)

The seeded 32-career catalog is almost entirely generic/global content.
`docs/PRODUCT_STRATEGY.md` calls Cameroon-specific pathway content a
launch blocker in its own words. For a **controlled beta with a small,
invited group**, there are two defensible paths, and this document isn't
choosing between them for you:

- **(a) Beta now, scoped as a mechanism test.** Recruit beta testers with
  the explicit framing that content localization comes after the core
  loop (assessment → matches → feedback) is validated. Lower risk if
  testers are told this upfront; higher risk if they're not and notice
  the generic content themselves.
- **(b) Content pass first.** Delay beta until at least a meaningful
  subset of the catalog has real Cameroon-specific pathway/institution
  content. Slower, but avoids the exact trust problem the strategy doc
  is worried about, on the audience most likely to notice it.

### `isMinor` field (Module 6 finding)

Computed and stored at registration, read nowhere. The schema comment
used to claim it "gates minor-safeguarding defaults" — it doesn't, and
that comment is now corrected to say so. If beta testers will include
anyone under 18 (the product explicitly supports `UNDER_16`/`AGE_16_18`
age ranges), **decide before beta**: either wire this into real
minor-specific handling, or consciously accept that today there is none
beyond what applies to every user equally. Silence on this isn't a safe
default — it's an unmade decision about how minors' data is actually
treated.

---

## Part 4 — Measurable beta success criteria

For each metric named in the Phase 5 brief: how it's actually computed
(verified against the real schema, not hypothetical), whether it's
instrumented today, and a target — with the reasoning shown, or an
explicit statement that no target is set yet because there's no baseline
to justify one. A first controlled beta's real job is often to *produce*
that baseline, not hit a number pulled from nowhere.

### 1. Recommendation usefulness rating
**Measured as**: % of `CAREER_MATCH` feedback where `helpful = true` —
exactly what `/admin/feedback`'s "Positive rate" tile already shows
(Module 5), live today.
**Target**: none set pre-beta — no prior cohort to benchmark against.
**Reasoned floor**: if positive rate falls below 50% (worse than a
coin flip) once there are at least ~20 pieces of feedback, treat it as a
signal the matching experience is fundamentally off and investigate
before inviting more testers — not a target to hit, a threshold below
which something is likely broken.

### 2. User completion rate (registered → completed the assessment)
**Measured as**: `COUNT(User WHERE EXISTS completed Assessment) /
COUNT(User)`. Verified as a valid, running query against the real schema.
**Target**: none set pre-beta.
**Reasoned floor**: this is an *invited, opted-in* cohort, not cold
traffic — people who agreed to try a career-guidance tool specifically.
A completion rate below 50% for that kind of audience, given the flow is
E2E-verified to work and the landing page itself sets a ~10-minute
expectation, would suggest friction Module 8's review didn't catch.
Investigate, don't just note, if it lands there.

### 3. Assessment abandonment rate
**Measured as**: `Assessment` rows with `status = IN_PROGRESS` and
`startedAt` more than 48 hours in the past (a grace window — someone
mid-assessment right now isn't "abandoned" yet), divided by all
assessments started. Verified computable against the real schema.
**Target**: none set pre-beta; track alongside completion rate above —
together they show *where* in the 18-question flow people stop, which
matters more than either number alone.

### 4. Feedback rate
**Measured as**: already live — `/admin/feedback`'s "Feedback rate" tile,
`feedbackRatePercent` in `src/lib/feedback/aggregate.ts` (Module 5).
**Target**: none set pre-beta. This is inherently an opt-in action layered
on top of an already-opt-in beta, so a modest rate is expected and not
itself concerning — useful mainly as a trend to watch, not a pass/fail bar.

### 5. Recommendation acceptance rate
**Measured as**: deliberately *not* the same as usefulness rating (a
thumbs-up costs nothing; acting on a match is a real signal). Defined
here as `COUNT(User WHERE EXISTS Roadmap) / COUNT(User WHERE EXISTS
completed Assessment)` — the share of users who, after seeing their
matches, chose to build a plan around at least one. Verified computable
against the real schema.
**Target**: none set pre-beta.

### 6. Critical bug count
**Not a live query** — this needs an actual intake mechanism during beta
(a feedback form, an email, a shared inbox — whatever's lightest for a
small group). Define severity before beta starts, not during it:
**critical** = blocks completing the assessment, blocks seeing matches,
loses a user's data, or is a security issue; everything else is not
critical for this purpose.
**Target: zero critical bugs, always.** This is the one metric in this
document with a hard, justified number: Phase 5 already exercised the
golden path, several edge-case profiles, DB-outage behavior, concurrency,
and mobile at 320px width. A new critical bug surfacing in beta means
something that testing didn't cover — valuable to learn, but it should
pause expanding the beta group until fixed, not something to tolerate at
a "low enough" rate.

### 7. Average response time
**Already measured** (Module 7, against a real production build with real
seeded data): every operation under 100ms except register (~470ms) and
login (~330ms), both bcrypt-bound by design, not a performance defect.
**Target**: no regression beyond roughly 2× these figures under real beta
load — a threshold to notice a problem, not a number invented from
nothing, since it's anchored to an already-measured baseline.

### 8. User trust score
**Honest answer: not instrumented anywhere today**, and it's the one
metric in the brief's list that can't be pulled from existing data the
way the other seven can — there's no in-app question that asks a user
whether they trust the guidance. Two options, not resolved here:
- Add one lightweight post-results question (e.g., "Do you trust this
  guidance so far? Yes / Somewhat / No") — new, small scope, a real
  product decision about adding a UI element, not something to build
  silently under a "measurement" module.
- In the meantime, the closest available *proxy* from existing data is a
  composite of positive feedback rate + recommendation acceptance rate
  (metric 5) + whether a user returns after their first session — but
  flagging clearly that a proxy is not the same as actually asking, and
  shouldn't be reported to stakeholders as if it were a direct trust
  measurement.

---

## Part 5 — Overall recommendation

**The product mechanism is ready.** All six steps of the beta journey
work, are tested, and degrade gracefully under real failure conditions —
none of that is aspirational, all of it was verified live against a
running server across Modules 1–8.

**Two decisions are outstanding, both named above, neither resolved
unilaterally**: the Cameroon-content timing question, and the `isMinor`
field. Both are genuine product/policy calls, not engineering ones — this
document's job is to put them in front of you clearly, not guess.

**Two operational items need a deploy-time check** (DB role
least-privilege + TLS, and the reverse proxy's `x-forwarded-for` header)
that can't be verified from this sandbox — they need the actual
production environment to confirm.

Once those four items are addressed, there is no remaining reason found
across this entire Phase 5 review to hold back a small, controlled beta.
