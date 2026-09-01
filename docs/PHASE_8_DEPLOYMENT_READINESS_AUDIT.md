# Phase 8 Step 1 — Deployment Readiness Audit

Audit only — nothing was changed to produce this. Covers the repo's
actual architecture, what Phase 6/7 already left as open production
items, and exactly what this session cannot do without external
credentials it doesn't have.

## Architecture (as it actually exists in this repo)

| Layer | What it is |
|---|---|
| Frontend | Next.js 14.2.35, App Router, React 18.3.1, TypeScript, Tailwind CSS — server-rendered pages + client components, no separate SPA build. |
| Backend/API | The **same** Next.js app — API routes under `src/app/api/**` (`route.ts` handlers). Not a separate service; this is a single deployable unit, monolithic by design. |
| Database | PostgreSQL, accessed via Prisma ORM 5.20/5.22 (`prisma/schema.prisma`), connection via a single `DATABASE_URL` env var. 11 migrations exist, in clean chronological order, no gaps (`prisma/migrations/`, newest: `20260901113404_add_beta_feedback_reasons`). |
| Authentication | NextAuth v4.24.8, credentials provider only (no OAuth), bcrypt (12 rounds) password hashing, JWT session strategy — no `Session`/`Account` tables needed. |
| AI provider | Anthropic, via `@anthropic-ai/sdk` — `ANTHROPIC_API_KEY` (optional: the app degrades to a clear "not configured" message everywhere it's used, never a crash) and `ANTHROPIC_MODEL` (optional, defaults to `claude-haiku-4-5-20251001`). |
| Build system | Next.js's own (`next build`) — no custom bundler config. |
| Package manager | npm — `package-lock.json` present, no yarn/pnpm lockfile. |
| Current hosting/deployment config | **None exists.** No `vercel.json`, `Dockerfile`, `fly.toml`, `Procfile`, or any other hosting-specific file anywhere in the repo. This application has never been deployed anywhere outside local dev and this sandbox. |
| Migration system | Prisma Migrate — `prisma migrate deploy` (confirmed as the production-safe, non-interactive command; CI already uses it). |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) — runs on push to `main` and on PRs: `npm ci` → `prisma migrate deploy` → lint → typecheck → unit tests → seed → recommendation eval → build → Playwright install → E2E. **CI only — no deployment step exists.** Nothing in this repo currently deploys anywhere automatically. |

## Environment variables (as declared in `.env.example`, the only source of truth for what the app reads)

| Variable | Required? | Purpose |
|---|---|---|
| `DATABASE_URL` | **Required** | Postgres connection string. |
| `NEXTAUTH_SECRET` | **Required** | Session/JWT signing secret. |
| `NEXTAUTH_URL` | **Required** | The app's own public URL — NextAuth needs this to issue correct callback/redirect URLs and secure cookies. |
| `ANTHROPIC_API_KEY` | Optional | AI assistant chat + application-help. App works fully without it (deterministic scoring, matches, roadmaps are unaffected); only the AI chat features degrade to a clear notice. |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-haiku-4-5-20251001` if unset. |
| `DEPLOYMENT_STAGE` | Optional | `development`/`staging`/`beta`/`production` (Phase 7). Unset infers from `NODE_ENV`. **Must be explicitly `beta` for the beta kill switch to do anything.** |
| `BETA_ACCESS_ENABLED` | Optional | Beta kill switch, only meaningful when `DEPLOYMENT_STAGE=beta`. Defaults enabled. |
| `TRUST_PROXY_HEADERS` | Optional | **Must stay unset/false until the production reverse proxy is confirmed to overwrite `X-Forwarded-For`** — this is the exact vulnerability Phase 6 found and fixed. Setting it prematurely reopens that bypass. |

No `NEXT_PUBLIC_*` variable exists anywhere in the codebase — confirmed by grep — so there is no client-exposed-secret risk to check.

## What Phase 6/7 already left open for production (not duplicated here)

Read from `docs/PHASE_6_INDEX.md`, `docs/PHASE_7_INDEX.md`, and the
documents they point to. Three items, unchanged status, not re-litigated:

1. **Database role least-privilege + TLS-in-transit** — exact commands
   and pass/fail criteria already written:
   `docs/PHASE_7_PRODUCTION_VERIFICATION.md` §A. Not verifiable without a
   real production database.
2. **Reverse-proxy `X-Forwarded-For` behavior** — exact commands already
   written: `docs/PHASE_7_PRODUCTION_VERIFICATION.md` §B (the same
   spoofing test that found and closed the original vulnerability in
   Phase 6, re-run against the real production URL). Not verifiable
   without a real deployed reverse proxy in front of the app.
3. **Live-model prompt-injection test** — exact payload, API calls, and
   pass/fail language already written:
   `docs/PHASE_7_PRODUCTION_VERIFICATION.md` §C. Not verifiable without a
   real `ANTHROPIC_API_KEY`.

Two product decisions also remain open (`docs/PHASE_6_BETA_PLAN.md` §1/§9):
Cameroon content-depth timing, and who operates the beta day-to-day.
Neither blocks a technical deployment; both are named again here only
because Phase 8's "beta configuration" step depends on the second one
being answered by a person, not inferred.

## What this session can and cannot do from here

**Can do without anything new**: everything code-level — a production
build (`next build`), running the full test suite, writing the
environment-variable checklist (Step 3), reviewing migration order
(Step 4's non-destructive parts), the security re-audit of what's in the
code (parts of Step 5), and documenting the AI system's code-level
behavior (parts of Step 6).

**Cannot do without external resources this session does not have and
cannot create**:
- A hosting platform account and its deploy credentials (Vercel, Railway,
  Render, Fly.io, a VPS, etc. — none is configured, and none can be
  provisioned from inside this sandbox).
- A registered domain and DNS access to point it at that host.
- A production PostgreSQL instance and its connection string.
- A production `NEXTAUTH_SECRET` (must be freshly generated for
  production, never reused from dev/CI — this session can generate the
  *value* with `openssl rand -base64 32` but cannot decide it's "the"
  production secret without somewhere real to put it).
- A real `ANTHROPIC_API_KEY`, if AI assistant functionality is wanted in
  the beta (the app runs fully without one, per the table above).
- Confirmation that the chosen host's reverse proxy overwrites
  `X-Forwarded-For` — this can only be tested after a real deployment
  exists to test against.

Per your own explicit instruction not to fabricate a deployment or
assume production configuration: **Steps 2 (choosing/provisioning a
platform) through 9 (production smoke tests) cannot proceed until you
provide the hosting platform choice and its access, a database, and a
production `NEXTAUTH_SECRET` at minimum** — see the chat response for the
exact, itemized list.
