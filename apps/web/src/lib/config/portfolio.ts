import { z } from "zod";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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

const CONFIG_URL =
    "https://raw.githubusercontent.com/Divalsehgal/portfolio-config/main/config.json";

import localConfig from "./portfolio.json";

export const getPortfolioConfig = async () => {
    // Favor local configuration for immediate updates as requested
    try {
        const validatedConfig = PortfolioConfigSchema.parse(localConfig);
        return { config: validatedConfig };
    } catch (localError) {
        console.warn("Local config validation failed, falling back to GitHub:", localError);
        
        try {
            const res = await fetchWithRetry(() =>
                fetch(CONFIG_URL, {
                    next: { revalidate: 60 },
                })
            );

            if (!res.ok) {
                throw new Error("Failed to fetch GitHub JSON");
            }

            const json = await res.json();
            const validatedConfig = PortfolioConfigSchema.parse(json);
            return { config: validatedConfig };
        } catch (githubError) {
            console.error("Both local and GitHub config failed:", githubError);
            // Return local config anyway as last resort if it's mostly valid
            return { config: localConfig as PortfolioConfig };
        }
    }
};
