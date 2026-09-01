/**
 * Phase 6 — minor-safeguarding behavior.
 *
 * Implements the policy already defined in docs/PRODUCT_STRATEGY.md §13
 * ("any user in a secondary-school age range is flagged; profile fields
 * default to the minimum necessary") — this file doesn't invent new
 * policy, it makes that one existing sentence enforceable and testable.
 *
 * `isMinor` itself is derived once at registration from `ageRange`
 * (MINOR_AGE_RANGES, src/lib/validation/auth.ts) and stored on `User`;
 * this module only decides what follows from that flag being true.
 *
 * Scope is deliberately narrow. The one profile-field pair the "minimum
 * necessary" language actually reaches is LinkedIn/portfolio URLs —
 * professional-networking links the recommendation engine never reads
 * (UserProfileInput has no such field) and not an appropriate ask for a
 * secondary-school-age user. Nothing about the assessment, the
 * recommendations themselves, or any other onboarding field is
 * restricted — §13 doesn't define that, and inventing it here would be
 * exactly the kind of unapproved policy this phase's instructions say
 * not to add. If a genuine legal/consent requirement is identified later,
 * it belongs in a real product-policy decision, not a silent code change.
 */

export const MINOR_RESTRICTED_ACCESS_FIELDS = ["linkedinUrl", "portfolioUrl"] as const;

/**
 * Strips the minor-restricted fields, regardless of what was submitted.
 * The onboarding UI also hides these fields for a known-minor user, but
 * this is the actual enforcement — a client can't bypass it by editing
 * the request.
 */
export function applyMinorFieldRestrictions<T extends { linkedinUrl?: string | null; portfolioUrl?: string | null }>(
  isMinor: boolean,
  data: T
): T {
  if (!isMinor) return data;
  return { ...data, linkedinUrl: "", portfolioUrl: "" };
}
