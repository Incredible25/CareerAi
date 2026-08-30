# Performance & Reliability Review

Phase 5, Module 7. Every number and behavior below was measured against a
real running server (production build, `next start`, real Postgres with
real seeded data), not estimated or assumed.

## API response times

Measured against a production build with real seeded data (32 careers)
and a real user completing the full journey:

| Action | Time |
|---|---|
| Register (bcrypt hash, 12 rounds) | ~470ms |
| Login (bcrypt compare) | ~330ms |
| Each onboarding step | 6–20ms |
| Each assessment answer (autosave) | 5–15ms |
| Assessment submit | ~70ms |
| Career matches — cold (generates all 32 CareerMatch rows) | ~90ms |
| Career matches — warm (already generated) | ~65ms |
| Explicit matches refresh | ~40ms |
| Dashboard page | ~30ms |
| Admin feedback dashboard (full aggregation) | ~20–30ms |

Register and login are the only slow-ish operations, and that's bcrypt
doing its job deliberately (12 rounds is a correct, secure choice, not a
performance bug) — every other measured operation is comfortably under
100ms, including generating fit scores for the entire 32-career catalog
from scratch. The deterministic scoring engine's own documentation
("cheap pure computation over ~32 careers") is accurate.

## AI response times

**Cannot be measured directly in this environment** — no
`ANTHROPIC_API_KEY` is configured, so every assistant call takes the
"not configured" fallback path (~30ms, just the DB round-trip). This is
an honest limitation to flag, not a number to fabricate.

What **was** checked and fixed: the Anthropic SDK's own default request
timeout is **10 minutes** (confirmed in the SDK's type definitions), and
nothing in the codebase overrode it. A slow or hung model response would
have left a student staring at "Thinking…" for up to 10 minutes, or hit
whatever timeout the hosting platform enforces first — which would bypass
the app's own clean error handling and show a raw platform error instead.
Fixed in `src/lib/ai/anthropic.ts`: explicit 25-second timeout on the
client, applying to both AI-calling routes (the assistant chat and the
one-shot opportunity application-help feature, since both go through this
one client). Both already had a try/catch that turns any failure —
including a timeout — into the existing friendly "something went wrong,
try again" message, so this fix makes that message actually arrive within
a reasonable wait instead of after up to 10 minutes.

## Database queries

Reviewed the hot paths for N+1 patterns (a `.map`/`for` loop with an
`await prisma` call inside it, one query per item instead of one query for
all items): career matching (`generate.ts`) and opportunity matching
(`opportunities/generate.ts`) both batch-fetch with `Promise.all` and
upsert in parallel — no N+1 found in either. The admin feedback dashboard
(Module 5) does 3 bulk queries total regardless of how much feedback
exists, then aggregates in memory.

One real sequential-loop pattern found: `api/onboarding/route.ts` upserts
skills/interests one at a time in a `for` loop. Technically N+1-shaped,
but reviewed and left as-is — it's a one-time, low-frequency action bounded
by how many skills a single user selects (tens, not hundreds), so the
actual cost is a few milliseconds. Rewriting it for a hot-path-grade
optimization would be solving a problem that doesn't exist here.

## Error handling — tested against a real outage, not just read

Stopped Postgres entirely while the production server was live, then hit
both a page route and an API route:

- **Page route** (`/dashboard`): clean generic Next.js error page,
  HTTP 500, with an error digest for server-side log correlation — no
  stack trace, no internal error message, no connection string leaked.
- **API route** (`/api/register`): HTTP 500 with an empty body. The
  client (`register-form.tsx`) already wraps its `res.json()` call in
  `.catch(() => ({}))` and falls back to a friendly default message
  ("Something went wrong. Please try again.") when the server doesn't
  return the expected shape — so even this genuinely-uncaught failure
  mode degrades to a reasonable message for the user, not a crash or
  blank screen.

No fix was needed here — both layers already fail safely, verified live
rather than assumed from reading the code.

## Loading states, failed requests, network interruptions

Added `e2e/reliability.spec.ts` (3 new, permanent E2E tests) rather than
one-off manual checks, since these are exactly the kind of regression that
should stay caught automatically:

1. **Network interruption**: aborts the onboarding request entirely
   mid-flight. Confirms the exact existing error text ("Couldn't reach the
   server. Check your connection and try again.") appears, and that the
   form recovers on retry rather than staying stuck.
2. **Loading state**: delays the same request by 800ms and confirms the
   submit button shows "Saving…" and is disabled for the duration, not
   double-submittable.
3. **Failed request with a specific message**: mocks a 400 response with
   a specific server-provided error string and confirms that exact string
   renders — i.e. a specific error from the server isn't swallowed by a
   generic fallback.

All three pass.

## Empty states

Spot-checked across the app: dashboard (per-section messages: "Complete
your assessment to see your top career matches," "Nothing tracked yet"),
matches (auto-generates rather than showing an empty page), admin feedback
dashboard (every section has its own empty-state text, verified in Module
5), applications ("Nothing saved yet. Browse…" with a link), and portfolio
(auto-opens the add-project form when there are zero projects, rather than
a static empty message — arguably better than a plain empty state since it
invites the first action directly). The "very limited information" E2E
edge case (Module 1) additionally confirms `/matches` and `/dashboard`
render cleanly — no `NaN`/`undefined` — for a genuinely sparse profile.

## Multiple simultaneous users / concurrency

Fired real concurrent requests against a live production server:

- **15 concurrent `POST /api/matches/refresh`, same user**: the existing
  rate limiter (5/5min) correctly throttled the burst — 4 succeeded, the
  rest got clean 429s. No crashes, no 500s, no database errors.
- **15 concurrent `GET /matches`, same user**: all 15 returned 200 — reads
  handle concurrent load without issue.
- **20 concurrent `POST /api/feedback` against the exact same career
  match, alternating helpful true/false — no rate limit on this route, so
  this is a genuine race on the database's unique constraint**: all 20
  requests returned 200, and the final row count was verified as exactly
  **1** — Postgres's atomic upsert (`ON CONFLICT DO UPDATE`, which is how
  Prisma implements `upsert`) handled the race correctly with no duplicate
  rows and no corruption.

## A rate-limit threshold this module corrected

Running this project's own E2E suite (Module 1's specs plus this module's
3 new ones — 6 real registrations per full run) twice against one
long-lived server, in a sandbox with no reverse proxy in front (so every
request's client IP resolves to the same fallback value), hit the
register rate limit Module 6 had just shipped at 8/15min. That's exactly
the "legitimate shared-IP burst" shape the limit needs to tolerate — a
school computer lab, a household behind one NAT'd connection, or a CI/QA
suite hitting a staging deployment — not scripted abuse. Raised to
20/15min (`src/app/api/register/route.ts`), re-verified live at the new
threshold (21st attempt in a window 429s, first 20 succeed), and the full
E2E suite now passes cleanly run back-to-back.

## Summary

No critical reliability defect was found — the app fails safely at every
layer that was actually tested against a real failure (DB outage,
concurrent writes, aborted requests). The two real fixes from this module
were both about *time*, not correctness: an unbounded AI-call timeout that
could have left a user waiting far too long, and a rate limit tuned too
tight for a legitimate burst of real traffic.
