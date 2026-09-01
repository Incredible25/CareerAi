/**
 * Phase 6 — centralized Cameroon-time date formatting.
 *
 * Before this file, every date shown in the product (`.toLocaleDateString()`
 * with no explicit timezone) rendered in whatever timezone the *runtime*
 * happened to be in: the server's system timezone for a Server Component
 * (typically UTC on most hosts), or the viewer's own device timezone for a
 * Client Component. Two dates on the same page could legitimately disagree
 * near a day boundary, and neither was guaranteed to match Cameroon time —
 * the one timezone that actually matters for the product's stated market
 * (docs/PRODUCT_STRATEGY.md: "for students... in Africa, starting in
 * Cameroon").
 *
 * Every user-facing date in the product should go through this module
 * instead of calling `.toLocaleDateString()`/`.toLocaleString()` directly,
 * so there is exactly one place that decides what timezone and format a
 * date displays in.
 *
 * `Africa/Douala` is Cameroon's IANA timezone (West Africa Time, UTC+1,
 * no daylight saving — a fixed offset year-round, so this never drifts).
 */

export const CAMEROON_TIME_ZONE = "Africa/Douala";

/** "30 August 2026" — day/month/year order reads naturally in Cameroon's bilingual (FR/EN) context, unlike US-style month/day. */
export function formatCameroonDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CAMEROON_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** "30 August 2026, 14:05" — for contexts where the time of day matters, not just the date. */
export function formatCameroonDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CAMEROON_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
