import type { EducationLevel } from "@prisma/client";

/**
 * Ordinal ranking for the education hard-eligibility check (dev-order 6).
 * OTHER is deliberately left out of the order — it covers non-standard
 * paths (vocational certificates, bootcamps, etc.) that don't sit at a
 * fixed point relative to SECONDARY/UNIVERSITY/GRADUATE, so it is never
 * compared, only matched or left unflagged.
 */
const RANKED_LEVELS: Partial<Record<EducationLevel, number>> = {
  SECONDARY: 1,
  UNIVERSITY: 2,
  GRADUATE: 3,
};

/**
 * True only when both levels are rankable and the user's meets or exceeds
 * the requirement. Returns null — "unknown, don't flag" — whenever either
 * side is OTHER or missing, rather than guessing.
 */
export function meetsEducationLevel(
  current: EducationLevel | null | undefined,
  required: EducationLevel | null | undefined
): boolean | null {
  if (!required) return true; // no requirement stated
  if (!current) return null;
  const currentRank = RANKED_LEVELS[current];
  const requiredRank = RANKED_LEVELS[required];
  if (currentRank === undefined || requiredRank === undefined) return null;
  return currentRank >= requiredRank;
}
