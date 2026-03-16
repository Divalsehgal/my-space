
import { z } from "zod";

export const ExperienceDescriptionItemSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const ExperienceConfigSchema = z.object({
  company: z.string(),
  role: z.string(),
  period: z.string(),
  location: z.string().optional(),
  description: z.array(ExperienceDescriptionItemSchema),
  techStack: z.array(z.string()).optional(),
});

export const ProjectConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  techStack: z.array(z.string()).optional(),
  link: z.string().optional(),
  repo: z.string().optional(),
  image: z.string().optional(),
});

export const PortfolioConfigSchema = z.object({
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
    facts: z.array(z.object({ label: z.string(), value: z.string() })),
    resumeUrl: z.string().optional(),
  }),
  experience: z.array(ExperienceConfigSchema),
  projects: z.array(ProjectConfigSchema),
  metadata: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
  }),
  socials: z.array(z.object({
    label: z.string(),
    href: z.string(),
    icon: z.string().optional(),
  })),
  contact: z.object({
    title: z.string(),
    subtitle: z.string(),
    email: z.string().email(),
  }),
});

export type PortfolioConfigInput = z.infer<typeof PortfolioConfigSchema>;
