# Phase 6 — Product Decisions

Documents the two product decisions Phase 5 left open, resolved in Phase 6
Step 2. Both implement behavior the architecture already defined
(`docs/PRODUCT_STRATEGY.md`) — neither invents new policy.

## Cameroon time

**Finding**: 5 call sites rendered dates via `.toLocaleDateString()`/
`.toLocaleString()` with no explicit timezone — some in Server Components
(the server's runtime timezone, typically UTC on most hosts), one in a
Client Component (the viewer's own device timezone). Two dates on the same
page could legitimately disagree near a day boundary, and neither was
guaranteed to match Cameroon time.

**Decision**: every user-facing date goes through one centralized module,
`src/lib/cameroon-time.ts`, formatting in `Africa/Douala` (West Africa
Time, UTC+1, no daylight saving — a fixed offset year-round). Two
functions: `formatCameroonDate()` (date only) and `formatCameroonDateTime()`
(date + time), both using `Intl.DateTimeFormat` with an explicit
`timeZone`, which works identically in Server and Client Components and in
any browser.

**Call sites updated** (all 5 found in the audit):
- `src/app/matches/page.tsx` — "Last calculated" date
- `src/app/admin/reports/page.tsx` — report submission date
- `src/app/admin/opportunities/[id]/page.tsx` — report submission date
- `src/lib/opportunities/format.ts` — `formatDeadline()`, used everywhere an opportunity deadline is shown
- `src/components/applications/application-tracker.tsx` — "Applied" date

**Verified**: `src/lib/cameroon-time.test.ts` — 4 unit tests, including a
boundary case (23:30 UTC on Jan 1 is already 00:30 WAT on Jan 2) that
would fail if the implementation silently used UTC instead of Cameroon
time. All pass.

**Scope note**: this resolves the *time-display* consistency question. It
is a separate concern from the *career-catalog content depth* question
Module 2 raised (generic vs. Cameroon-specific pathway content) — that one
remains open and is a content decision, not a code fix; not addressed
here.

## `isMinor`

**Finding**: computed once at registration, read nowhere in the app —
confirmed by grep before any change (`src/app/api/register/route.ts:56`
was the only reference in `src/`).

**Decision, implementing `docs/PRODUCT_STRATEGY.md` §13 exactly as
written** ("any user in a secondary-school age range is flagged; profile
fields default to the minimum necessary... no behavioral marketing"), not
inventing anything beyond it:

- **Where created**: unchanged — `MINOR_AGE_RANGES.has(ageRange)` at
  registration (`src/lib/validation/auth.ts`).
- **Where stored**: unchanged — `User.isMinor`.
- **What now depends on it**: the onboarding Access step. LinkedIn and
  portfolio-website URLs are the one field pair §13's "minimum necessary"
  language actually reaches — professional-networking links the
  recommendation engine never reads (`UserProfileInput` has no such
  field) and not an appropriate ask for a secondary-school-age user.
- **What's restricted**: those two fields only. **What's explicitly not
  restricted**: the assessment, the recommendations themselves, or any
  other onboarding field — §13 doesn't define restricting those, and
  doing so would be inventing policy, which these instructions say not to
  do.
- **Unknown case**: every real registration always computes `isMinor`
  explicitly (`ageRange` is a required field), so "unknown" isn't a
  reachable state in practice. As a defensive default for a hypothetical
  row inserted outside the normal flow, the schema default changed from
  `false` to `true` — unknown now defaults to the more protective
  assumption, not the more permissive one (migration
  `20260901104755_isminor_default_true`).
- **Enforcement, not just UI**: `src/lib/minors.ts` exports
  `applyMinorFieldRestrictions()`, called server-side in
  `POST /api/onboarding`'s `access` case — the fields are stripped
  regardless of what a client submits, verified live (below), not just
  hidden in the form.

**What was deliberately not built**: restricted recommendations,
age-gated careers, a parental-consent flow, or a separate minor-specific
copy system. §13 explicitly defers a consent mechanism to "if the
business later wants to collect anything beyond baseline account data" —
that's a future decision, not one made here.

**Verified, not assumed**:
- `src/lib/minors.test.ts` — 4 unit tests on the pure restriction function.
- Live end-to-end: registered a real `AGE_16_18` account and a real
  `AGE_19_24` account, confirmed `isMinor` computed correctly in the
  database for both, then had **both** submit the access step with real
  LinkedIn/portfolio URLs via a direct API call (bypassing the UI
  entirely, as a client attempting to circumvent the hidden fields
  would). Result: the minor's values were stripped to `null` in the
  database; the adult's were saved exactly as submitted.
- Live UI check: a fresh `UNDER_16` registration walked to the real
  Access step — confirmed the LinkedIn/portfolio inputs are entirely
  absent from the rendered DOM, not just visually hidden.
- All QA fixture accounts deleted after.
