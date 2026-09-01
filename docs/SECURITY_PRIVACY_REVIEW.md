# Security & Privacy Review

Phase 5, Module 6. Covers the 12 areas named in the Phase 5 brief, plus a
data-minimization pass on what CareerAI collects. Findings are grounded in
the Phase 5 Step 1 audit (independently re-verified where cited) and this
module's own live testing — every fix below was exercised against a
running server, not just read and assumed correct.

## 1. Authentication

NextAuth credentials provider, bcrypt (12 rounds), JWT session strategy.
**This module added brute-force protection that didn't exist before**:
login attempts are now rate-limited per normalized email
(`src/lib/auth.ts` — 10 attempts / 15 minutes), returning the exact same
generic "email and password don't match" response whether the block is a
wrong password or the rate limit itself, so a rate-limited response is
never a distinguishable signal to an attacker. Verified live: 10 wrong
attempts against one account, then an 11th attempt *with the correct
password*, still failed — confirming the limiter engages, not just the
password check — while a second, untouched account logged in normally in
the same window, confirming the block is scoped per-email and doesn't
collaterally lock out other users.

## 2. Authorization

Every route that touches a user-owned resource by id verifies ownership
before acting (`applications/[id]`, `portfolio/[id]`, `assessment/answer`,
`roadmap/tasks/[taskId]`, and `feedback`'s polymorphic
`subjectBelongsToUser()` check) — this was already true pre-Module 6 and
remains a genuine strength of the codebase.

## 3. Database permissions

Out of code's reach to fix directly: this dev/CI environment uses a single
`postgres` superuser connection string. **Before a real deployment**,
provision a least-privilege application DB role (no `CREATEDB`/superuser)
separate from whatever role runs `prisma migrate deploy`, and confirm the
connection enforces TLS. Expanded into a full item-by-item checklist in
Phase 6 Step 3 (`docs/PHASE_6_PRODUCTION_SECURITY_CHECKLIST.md`), with
each item marked either verified now (credential hygiene, injection
surface, logging) or explicitly requiring production access — still a
deploy-time item, not something a code change here can verify.

## 4. API security

25+ routes reviewed in the original audit: consistent zod validation on
every route that accepts a body, no route found passing a raw request body
into Prisma. This module closed the one real gap found —
`admin/reports/[id]` was the sole `[id]` route skipping the
existence-check-before-mutate pattern every other one follows, which meant
a bad id fell through to an uncaught Prisma `P2025` instead of a clean
404. Fixed and verified live: `PATCH` against a nonexistent report id now
returns `{"error":"Report not found."}` at 404, not a raw 500.

## 5. Admin access

`src/app/admin/layout.tsx` calls `requireAdmin()` (a fresh DB lookup, not
the JWT role claim) and redirects non-admins — this wraps every page under
`/admin/**`, confirmed in the original audit as a real, working gate (one
of the four parallel research passes in that audit incorrectly reported
this as broken by checking individual page files instead of the shared
layout; corrected before it was reported to you). Every admin API route
independently re-checks via the same `requireAdmin()`. No self-serve
promotion path exists — only `prisma/promote-admin.ts`, run with direct DB
access.

## 6. Environment variables / secrets

`DATABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXTAUTH_SECRET`,
`NEXTAUTH_URL` — all read from `process.env`, none hardcoded anywhere in
source. `.env` is gitignored and not committed; `.env.example` holds only
placeholders. No change needed here; re-confirmed, not re-audited from
scratch.

## 7. User data exposure

The admin feedback dashboard (Module 5) was built and verified to expose
zero user identifiers — direct grep of its rendered output against known
test users' emails/names found no matches. The admin reports queue
legitimately shows reporter name/email (needed for abuse-handling
follow-up) — a deliberate, justified exception, not an oversight.

## 8. Input validation

Confirmed consistent across every route in the original audit: zod
`safeParse` before any Prisma call, `.catch(() => null)` around body
parsing so a malformed JSON body never throws unhandled. No changes
needed.

## 9. Rate limiting — the main fix in this module

Before Module 6: only 5 of 27 routes were rate-limited, and critically,
**neither registration nor login had any protection at all**. Both are now
covered:

- `POST /api/register`: 20 attempts / 15 minutes, keyed by client IP
  (`getClientIp()`, reading `x-forwarded-for`/`x-real-ip`). Originally
  shipped at 8/15min in Module 6; Module 7's own live testing (see below)
  hit that limit for real running this project's E2E suite twice against
  one long-lived server, which is exactly the "legitimate shared-IP
  burst" shape (a school computer lab, a CI/QA runner) the limit needs to
  tolerate — raised to 20, still far below what a scripted flood would
  attempt. Verified live at the new threshold the same way: the 21st
  attempt in a window returns 429, the first 20 succeed normally.
- Login: see §1.

**Known limitation, unchanged from before this module and out of scope to
fully fix here**: the limiter is in-memory (`src/lib/rate-limit.ts`),
documented in its own header as not surviving redeploys or working across
multiple server instances — acceptable for a single-instance controlled
beta, a real gap before any horizontally-scaled or serverless production
deployment (would need a shared store, e.g. Redis).

**A second limitation, found here and closed in Phase 6**: `getClientIp()`
originally trusted `x-forwarded-for` unconditionally, with no way to tell
a value a real proxy set from one a client spoofed directly. Phase 6
Step 4 turned this from a theoretical gap into a confirmed exploit: 11
consecutive registration requests, each with a distinct spoofed header
value, all succeeded past the 20-per-15-minutes limit — trivially
defeating it. **Fixed**: `getClientIp()` now ignores the header entirely
unless `TRUST_PROXY_HEADERS=true` is explicitly set, which should only
happen once the production reverse proxy is confirmed to overwrite
(not forward) a client-supplied value. Full writeup and re-verification:
`docs/PHASE_6_PRODUCTION_SECURITY_CHECKLIST.md` Step 4 item 1.

## 10. Database security

Postgres via Prisma, parameterized queries throughout (no raw SQL string
concatenation found anywhere in the codebase) — SQL injection surface is
effectively zero by construction. TLS-in-transit and least-privilege role
separation are deployment-environment concerns, covered under §3.

## 11. Logging

Re-confirmed from the original audit: exactly two `console.error` calls in
the entire `src/` tree, both inside AI-call try/catch blocks, both logging
only the caught `Error` object — no passwords, tokens, session objects, or
full user records logged anywhere. No admin action produces an audit trail
beyond the `createdBy`/`updatedBy` fields already on `Opportunity` rows —
a real gap for "who did what when" during a future incident, but building
an audit-log system is a feature addition beyond this review's scope;
noted for later, not built here.

## 12. Error handling

Every route handles its *expected* failure modes (no session → 401, bad
input → 400, missing/foreign record → 404) with clean JSON. The one
inconsistent route (`admin/reports/[id]`) is fixed in §4. Genuinely
unexpected failures (a DB connection error, a race condition) still fall
through to Next's default handler everywhere else, same as before this
module — acceptable for now since it degrades to a generic 500 rather than
leaking internals, but a global error boundary would be a reasonable
future hardening step.

---

## Data minimization — what CareerAI collects, and why

| Field | Collected at | Actually used? | Assessment |
|---|---|---|---|
| `name`, `email`, `passwordHash` | Registration | Yes — auth, display | Necessary. |
| `ageRange` | Registration | Yes — derives `isMinor`; feeds `MINOR_AGE_RANGES` check | Necessary, minimal (a range, not a birthdate). |
| `country` | Registration | Not yet read anywhere beyond storage | Justified despite non-use: the product strategy's Cameroon-first, per-market localization plan (already flagged as a launch blocker in the Module 2 rubric) directly needs this field — it's a near-term, already-documented requirement, not "might be useful someday." Kept. |
| `city` (optional) | Registration | Not read anywhere beyond storage | Same justification as `country` — hyper-local matching is the named future use, not a hypothetical one. Low sensitivity (self-reported, optional, no more precise than city-level). Kept, but flagged: if the localization work doesn't materialize within a reasonable window, this should be revisited and dropped rather than left collected-forever "just in case." |
| `isMinor` (derived) | Registration | **Yes, as of Phase 6** | At the time this review was written: computed and stored, read nowhere — a misleading schema comment claimed it "gates minor-safeguarding defaults," which was never true, and was fixed to say so. **Resolved in Phase 6 Step 2B** (`docs/PHASE_6_DECISIONS.md`): now enforced server-side in `POST /api/onboarding` to strip LinkedIn/portfolio URLs for minor accounts regardless of client input, verified live via a direct API bypass attempt. |
| `Assessment.traitScores` / `AssessmentAnswer.value` | Assessment | Yes — the core matching input | Necessary; already explicitly disclaimed in-app as non-clinical, non-diagnostic. |
| `Profile.linkedinUrl` / `portfolioUrl` (optional) | Onboarding | Displayed back to the user only | User-supplied, optional, self-describing — fine. |
| `hasLaptop` / `hasSmartphone` / `internetAccess` | Onboarding | Not read by the matching/roadmap engine (Module 2 finding) — `internetAccess` alone reaches the optional AI assistant's context | Not a privacy risk (low sensitivity), but a *product* gap already routed to a future scoring-engine decision in the Module 2 rubric — repeated here only for completeness, not re-litigated. |

**No new field was added anywhere in Phase 5** (Modules 4/5 added a
`Feedback.reason` enum, which is opinion data about a career match, not
personal information). **No sensitive category is collected that isn't
already named above** — no phone number, no financial data, no precise
geolocation, no biometric data, no photo.

---

## Summary of what changed in this module

- `src/lib/auth.ts` — login rate-limited per email (10/15min)
- `src/lib/rate-limit.ts` — added `getClientIp()`
- `src/app/api/register/route.ts` — registration rate-limited per IP (originally 8/15min, raised to 20/15min in Module 7 — see §9 above)
- `src/app/api/admin/reports/[id]/route.ts` — existence check before update, clean 404
- `prisma/schema.prisma` — corrected the misleading `isMinor` comment

All four code changes were exercised against a live server (not just
typechecked): register's 9th attempt in a window 429s, login's 11th
attempt still fails after 10 wrong ones (even with the right password),
a different account logs in normally in the same window, and a bad
report id now 404s cleanly. Full unit (64) and E2E (4) suites pass with
no regressions.
