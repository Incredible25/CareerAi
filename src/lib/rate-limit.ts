/**
 * Minimal in-memory sliding-window rate limiter for AI-invoking endpoints
 * (docs/PRODUCT_STRATEGY.md §12/§13). In-memory is a known limitation —
 * it resets on redeploy and doesn't share state across instances — but is
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
