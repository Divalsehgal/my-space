import { z } from "zod";

export const ExperienceConfigSchema = z.object({
  id: z.string().optional(),
  company: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string().optional(),
  description: z.array(z.object({
    id: z.string().optional(),
    text: z.string(),
  })),
  techStack: z.array(z.string()).optional(),
});

export const SkillItemConfigSchema = z.object({
  name: z.string(),
  level: z.string().optional(),
});

const SkillItemListSchema = z.array(SkillItemConfigSchema);

/**
 * A top-level skills category is either a flat list of skills (e.g.
 * `languages`, `aiEngineering`) or a nested object of named sub-groups,
 * each a flat list (e.g. `frontend.frameworks`, `cloud.aws`). `z.record`
 * preserves the source object's key order, which the UI relies on to
 * render categories in the exact order the config defines them.
 */
export const SkillGroupConfigSchema = z.union([
  SkillItemListSchema,
  z.record(z.string(), SkillItemListSchema),
]);

export const SkillsConfigSchema = z.record(z.string(), SkillGroupConfigSchema);

export const ProjectConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  techStack: z.array(z.string()).optional(),
  link: z.url().optional(),
  repo: z.url().optional(),
  image: z.string().optional(),
});

/**
 * Shape deliberately mirrors React Flow's own Node/Edge types (id, position,
 * data, type) so mapping config -> <ReactFlow> props is a near pass-through
 * rather than a transform. See containers/Home/Architecture.
 */
export const ArchitectureNodeConfigSchema = z.object({
  id: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  type: z.enum(["frontend", "backend", "external", "data"]).optional(),
  /** Layer used by the stacked mobile layout (generated diagrams set it). */
  tier: z.enum(["client", "compute", "data"]).optional(),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
  }),
});

export const ArchitectureEdgeConfigSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  animated: z.boolean().optional(),
  // Bows the default bezier path away from its straight line - mainly useful
  // to pull a pair of edges between the same two nodes (e.g. a request and
  // its response) apart so their paths and labels don't sit on top of each other.
  curvature: z.number().optional(),
});

export const ArchitectureConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  nodes: z.array(ArchitectureNodeConfigSchema).optional().default([]),
  edges: z.array(ArchitectureEdgeConfigSchema).optional().default([]),
});

/**
 * The GitHub `portfolio-config` JSON now holds data only: links, contact email,
 * socials and the structured lists (skills, experience, projects). All copy —
 * name, subtitle, about text, SEO title/description, UI labels — comes from the
 * Contentful `translation` model (src/i18n). Fields not listed here are ignored
 * (zod strips unknown keys), so old copy left in the JSON is harmless.
 */
export const PortfolioConfigSchema = z.object({
  socials: z.array(z.object({
    label: z.string(),
    href: z.string(),
    icon: z.string().optional(),
  })).optional().default([]),
  hero: z.object({
    primaryCtaHref: z.string().optional(),
    secondaryCtaHref: z.string().optional(),
    resumeUrl: z.string().optional(),
  }).optional().default({}),
  about: z.object({
    facts: z.array(z.string()).optional().default([]),
    resumeUrl: z.string().optional(),
  }).optional().default({ facts: [] }),
  experience: z.array(ExperienceConfigSchema).optional().default([]),
  skills: SkillsConfigSchema.optional().default({}),
  projects: z.array(ProjectConfigSchema).optional().default([]),
  architecture: ArchitectureConfigSchema.optional().default({ nodes: [], edges: [] }),
  contact: z.object({
    email: z.email(),
  }).optional(),
});

export type PortfolioConfig = z.infer<typeof PortfolioConfigSchema>;
export type ExperienceConfig = z.infer<typeof ExperienceConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
export type SkillItemConfig = z.infer<typeof SkillItemConfigSchema>;
export type SkillGroupConfig = z.infer<typeof SkillGroupConfigSchema>;
export type SkillsConfig = z.infer<typeof SkillsConfigSchema>;
export type ArchitectureNodeConfig = z.infer<typeof ArchitectureNodeConfigSchema>;
export type ArchitectureEdgeConfig = z.infer<typeof ArchitectureEdgeConfigSchema>;
export type ArchitectureConfig = z.infer<typeof ArchitectureConfigSchema>;
