import { z } from "zod";

export const ExperienceConfigSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string().optional(),
  description: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })),
  techStack: z.array(z.string()).optional(),
});

export const ProjectConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  techStack: z.array(z.string()).optional(),
  link: z.string().url().optional(),
  repo: z.string().url().optional(),
  image: z.string().optional(),
});

export const PortfolioConfigSchema = z.object({
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
    verification: z.object({
      google: z.string().optional(),
    }).optional(),
  }).optional(),
  socials: z.array(z.object({
    label: z.string(),
    href: z.string(),
    icon: z.string().optional(),
  })).optional().default([]),
  navbar: z.object({
    brand: z.string(),
  }).optional(),
  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    primaryCtaLabel: z.string().optional(),
    primaryCtaHref: z.string().optional(),
    secondaryCtaLabel: z.string().optional(),
    secondaryCtaHref: z.string().optional(),
    resumeUrl: z.string().optional(),
    resumeLabel: z.string().optional(),
    badge: z.string().optional(),
  }),
  about: z.object({
    title: z.string(),
    paragraphs: z.array(z.string()),
    facts: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })),
    resumeUrl: z.string().optional(),
  }),
  experience: z.array(ExperienceConfigSchema),
  projects: z.array(ProjectConfigSchema),
  contact: z.object({
    title: z.string(),
    subtitle: z.string(),
    email: z.string().email(),
  }).optional(),
});

export type PortfolioConfig = z.infer<typeof PortfolioConfigSchema>;
export type ExperienceConfig = z.infer<typeof ExperienceConfigSchema>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
