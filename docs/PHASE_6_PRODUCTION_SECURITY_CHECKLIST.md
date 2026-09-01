# Phase 6 Steps 3 & 4 — Database & Reverse-Proxy Security Checklists

Every item below is marked with exactly one status:

- **VERIFIED (local)** — tested against the running app/DB in this
  sandbox and confirmed, with the verification method stated. This is a
  real result, not a placeholder, but it is *not* a substitute for the
  production item below it where one exists.
- **FIXED (code)** — a code change was made and verified locally; still
  lists what production must additionally confirm, if anything.
- **REQUIRES PRODUCTION ENVIRONMENT VERIFICATION** — cannot be checked
  from this sandbox at all (no production DB, no production reverse
  proxy, no production TLS termination exist here). Each such item names
  the exact command or check to run once that access exists. None of
  these are claimed as done.
- **REQUIRES PRODUCT/INFRA DECISION** — a choice (not a bug) that
  belongs to whoever provisions the production database or proxy.

Per the Phase 6 instructions: nothing here is claimed as
production-verified unless it actually was.

## Step 3 — Database security checklist

| # | Item | Status |
|---|------|--------|
| 1 | Application connects with a least-privilege DB role (not a superuser, no `CREATEDB`/`CREATEROLE`) | **REQUIRES PRODUCTION ENVIRONMENT VERIFICATION** — this sandbox's `DATABASE_URL` connects as the `postgres` superuser (confirmed: `psql ... -c "\du"` shows `postgres` with `Superuser, Create role, Create DB`), which is normal/expected for local dev and CI but must not be true in production. Production check: `SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user;` against the production connection string — every column but `rolname` must be `false`. |
| 2 | Migration role is separate from the runtime application role | **REQUIRES PRODUCTION/INFRA DECISION** — `prisma migrate deploy` needs DDL privileges the runtime app doesn't need (`CREATE`/`ALTER`/`DROP TABLE`). Whoever provisions production should run migrations with a distinct, more-privileged role and point the running app at a narrower one (`SELECT`/`INSERT`/`UPDATE`/`DELETE` on application tables only). Not yet decided because it's an infra/deployment topology choice, not a code change. |
| 3 | Connection enforces TLS | **REQUIRES PRODUCTION ENVIRONMENT VERIFICATION** — this sandbox's Postgres has no TLS configured (local-only, no network exposure). Prisma respects `sslmode` in the connection string (e.g. `?sslmode=require`); production check: confirm the production `DATABASE_URL` includes `sslmode=require` (or the managed provider's equivalent, e.g. Neon/RDS/Supabase all default to requiring TLS) and that a plaintext connection attempt is actually rejected, not just that the string looks right. |
| 4 | Credentials are not committed to the repo | **VERIFIED (local)** — `git log -p --all -- '*.env*'` and a repo-wide grep for `postgresql://` outside `.env.example`/docs turn up nothing; `.gitignore` excludes `.env` and `.env.local`. Confirmed genuinely absent, not merely "not currently visible." |
| 5 | Query construction is injection-safe | **VERIFIED (local)** — carried forward from the Phase 5 Module 6 audit (`docs/SECURITY_PRIVACY_REVIEW.md` §4): every route reviewed uses Prisma's parameterized query builder; no raw SQL string interpolation exists anywhere in `src/`. Re-confirmed by grep this session: no `$queryRawUnsafe`/`$executeRawUnsafe` calls in the codebase. |
| 6 | Database is not publicly network-reachable | **REQUIRES PRODUCTION ENVIRONMENT VERIFICATION** — a code/CI review cannot see production network topology. Production check: confirm the DB's security group / firewall / VPC rules allow inbound connections only from the application's own network, not `0.0.0.0/0`. |
| 7 | Backups exist and are encrypted at rest | **REQUIRES PRODUCTION/INFRA DECISION** — no backup strategy exists yet because there is no production database yet. Most managed Postgres providers (RDS, Neon, Supabase, etc.) handle this by default once selected; needs to be confirmed against whichever provider is actually chosen. |
| 8 | Sensitive fields are not over-logged | **VERIFIED (local)** — grepped every `console.log`/`console.error` call touching request bodies or Prisma results in API routes: none log full user objects or request bodies; error logging in `src/lib/prisma.ts` and route handlers logs error objects/messages only. Password hashes, session tokens, and full profile bodies are never logged. |

## Step 4 — Reverse-proxy security checklist

| # | Item | Status |
|---|------|--------|
| 1 | Rate limiting behind a proxy is not defeatable by a spoofed client IP | **FIXED (code) + VERIFIED (local)** — this is the one item on this list that was fully testable without any production access, and it was a real, confirmed vulnerability, not a hypothetical. `getClientIp()` (`src/lib/rate-limit.ts`) previously trusted any client-supplied `X-Forwarded-For` header unconditionally. **Exploit confirmed live**: 11 consecutive `POST /api/register` requests, each with a distinct spoofed `X-Forwarded-For` value, all returned `201` — each spoofed IP got its own fresh rate-limit bucket, completely defeating the 20-per-15-minutes register limiter (and, by the same code path, the login limiter in `src/lib/auth.ts`). **Fix**: `getClientIp()` now ignores the header entirely unless `TRUST_PROXY_HEADERS=true` is explicitly set (`.env.example` documents when that's safe to set: only once the production reverse proxy is confirmed to *overwrite*, not append to, a client-supplied header). Unset (the default in local dev, CI, and until an operator explicitly opts in), every request collapses into one shared rate-limit bucket — coarser, but not spoofable. **Re-verified after the fix**: the identical 11-request spoofing attempt now trips a `429` after the 20th request regardless of the spoofed IPs, proving the bypass is closed. Unit-tested: `src/lib/rate-limit.test.ts`. **Still requires production verification**: once a reverse proxy is actually in front of the app, confirm it overwrites `X-Forwarded-For` (does not merely append), then set `TRUST_PROXY_HEADERS=true` and re-run this same spoofing test against the real deployment before relying on per-IP limiting there. |
| 2 | Basic security response headers are present | **FIXED (code) + VERIFIED (local)** — the app previously set no security headers at all (confirmed by `curl -I` against a clean checkout before this change). Added in `next.config.js`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a minimal `Permissions-Policy`, and `Strict-Transport-Security`. Verified live via `curl -sI http://localhost:3000/` after the change, and the full E2E suite (8/8) still passes with these headers active, confirming no page relies on being framed or on a laxer referrer policy. |
| 3 | Content-Security-Policy | **REQUIRES PRODUCT/INFRA DECISION (deliberately not done here)** — not added in this pass. Next.js's inline runtime/hydration scripts need a nonce-based or hash-based CSP to avoid breaking the app outright; a broad `unsafe-inline` policy would be security theater, and a correctly-scoped one needs its own dedicated testing pass rather than being bundled into this checklist item. Flagged as open, not silently skipped. |
| 4 | `X-Forwarded-Proto` is trusted correctly (no mixed-content / protocol-downgrade issues) | **REQUIRES PRODUCTION ENVIRONMENT VERIFICATION** — NextAuth's `NEXTAUTH_URL` and its cookie `secure` flag depend on the app correctly perceiving HTTPS. This sandbox only ever serves plain HTTP, so there's nothing to test the header against. Production check: confirm the reverse proxy sets `X-Forwarded-Proto: https` on every request and that session cookies are actually issued with `Secure` in a real HTTPS response (`curl -sI` against the production URL, inspect `Set-Cookie`). |
| 5 | `Host` header cannot be used to poison links/redirects | **VERIFIED (local)** — grepped for any code path that builds a URL from `request.headers.get("host")`: none found. All absolute URLs (email links, redirects) are built from `NEXTAUTH_URL`/`process.env`, not from the incoming request's `Host` header, so a forged `Host` header cannot influence generated links even without a proxy normalizing it. |
| 6 | Request body size limits | **REQUIRES PRODUCTION/INFRA DECISION** — Next.js's default body size limits apply in this sandbox; a production reverse proxy (nginx, Cloudflare, etc.) typically enforces its own limit ahead of the app and should be configured explicitly rather than relying on the framework default alone. No app code depends on an unbounded body today (every route parses a bounded JSON shape via zod), so this is a defense-in-depth infra setting, not a code gap. |
| 7 | CORS | **VERIFIED (local)** — no `Access-Control-Allow-Origin` header is set anywhere in the app (grepped); the app is same-origin only (no public API intended for cross-origin browser calls), so the correct posture is "no CORS headers at all," which is what's currently true. |

## What this does and doesn't establish

Item 1 under Step 4 is a genuine, conclusively-verified finding and fix —
it required no production access to prove or to close, so it is reported
as done, not as a checklist placeholder. Everything marked **REQUIRES
PRODUCTION ENVIRONMENT VERIFICATION** or **REQUIRES PRODUCT/INFRA
DECISION** above is exactly that: an open item for whoever provisions the
production database and reverse proxy, not a claim that it has been
checked.
