import type { SkillLevel } from "@prisma/client";

export const SKILL_LEVEL_ORDER: Record<SkillLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

export function meetsLevel(current: SkillLevel | null | undefined, required: SkillLevel): boolean {
  if (!current) return false;
  return SKILL_LEVEL_ORDER[current] >= SKILL_LEVEL_ORDER[required];
}
