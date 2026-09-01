/**
 * Minimal in-memory sliding-window rate limiter for AI-invoking endpoints
 * (docs/PRODUCT_STRATEGY.md §12/§13) and, as of Phase 5 Module 6, the
 * pre-auth register/login paths. In-memory is a known limitation — it
 * resets on redeploy and doesn't share state across instances — but is
 * enough to stop a single runaway client in this MVP; swap for a shared
 * store (e.g. Redis) before running more than one server instance.
 */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > limit;
}

/**
 * Best-effort client IP for rate-limiting requests that happen before
 * authentication (register, login), where there's no userId to key on
 * yet. Plain `Request` (used by these route handlers, not `NextRequest`)
 * has no `.ip` property, so this reads the standard proxy header.
 *
 * `X-Forwarded-For` is only trustworthy when a proxy sitting in front of
 * this server overwrites (not appends to) any value the client sent —
 * otherwise any client can set it directly and rotate it per request to
 * get a fresh rate-limit bucket every time (Phase 6 Step 4, verified
 * locally: 11 consecutive spoofed-header registration requests all
 * succeeded past a 20-per-window limit). So this only reads the header
 * once the deployment has explicitly confirmed its reverse proxy does
 * that overwrite, via `TRUST_PROXY_HEADERS=true`. Until then — including
 * local dev, and CI — every request collapses to the same constant key,
 * which is the same "shared across all direct connections" degradation
 * this module already uses when no proxy header is present at all. It's
 * coarser (one client hitting the limit throttles everyone), but it
 * cannot be defeated by a spoofed header, which a false sense of
 * per-client isolation could be.
 */
export function getClientIp(request: Request): string {
  if (process.env.TRUST_PROXY_HEADERS !== "true") return "unknown";
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
