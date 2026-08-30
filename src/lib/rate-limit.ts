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
 * has no `.ip` property, so this reads the standard proxy header. Falls
 * back to a constant key if absent (e.g. local dev with no proxy in
 * front) — rate limiting degrades to "shared across all direct
 * connections" rather than failing open.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
