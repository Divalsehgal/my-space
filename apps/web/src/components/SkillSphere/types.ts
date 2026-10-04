import type { SkillDepth } from "@/features/portfolio/skillLevel";

export type SphereSkill = { name: string; group: number; depth: SkillDepth; sub?: string };
export type SphereGroup = { key: string; label: string };
/** A skill with its position on the unit sphere. */
export type Point = SphereSkill & { x: number; y: number; z: number };
