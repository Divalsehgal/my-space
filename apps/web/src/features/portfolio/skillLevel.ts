/** Depth of experience on a 1-4 scale. */
export type SkillDepth = 1 | 2 | 3 | 4;

/** The top of the scale ("deep expertise"). */
export const MAX_SKILL_DEPTH: SkillDepth = 4;

const DEPTH_BY_LEVEL: Record<string, SkillDepth> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};
const DEFAULT_DEPTH: SkillDepth = 2;

/** Maps the config's free-text level ("Expert", "advanced"…) to a depth. */
export function skillDepth(level?: string): SkillDepth {
  return DEPTH_BY_LEVEL[level?.trim().toLowerCase() ?? ""] ?? DEFAULT_DEPTH;
}

/** Translation keys for each depth; resolve with `t(DEPTH_LABEL[depth])`. */
export const DEPTH_LABEL = {
  1: "skills.depth.1",
  2: "skills.depth.2",
  3: "skills.depth.3",
  4: "skills.depth.4",
} as const satisfies Record<SkillDepth, string>;

/** Every depth, shallowest first — e.g. one bar per step in a depth meter. */
export const SKILL_DEPTHS = Object.keys(DEPTH_LABEL).map(Number) as SkillDepth[];
