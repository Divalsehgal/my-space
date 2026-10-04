import type { PortfolioConfig } from "@/features/portfolio";
import { flattenSkillNames } from "@/features/portfolio/skills";
import { createTranslator, type Translate, type TranslationKey } from "@/i18n/core";
import { splitParagraphs } from "@dival-sehgal/utils/string";

/** A compact, serialisable index of the site for the command palette and terminal. */
export type SiteIndex = {
  name: string;
  role: string;
  email?: string;
  resumeUrl?: string;
  about: string[];
  socials: { label: string; href: string }[];
  /** Home sections, plus pages like /architecture that have their own `href`. */
  sections: { id: string; label: string; href: string }[];
  skills: string[];
  experience: { role: string; company: string; period: string }[];
  projects: { name: string; description: string; href?: string }[];
  posts: { title: string; slug: string }[];
};

const SECTIONS: { id: string; labelKey: TranslationKey; href?: string }[] = [
  { id: "home", labelKey: "nav.home" },
  { id: "about", labelKey: "nav.about" },
  { id: "skills", labelKey: "nav.skills" },
  { id: "architecture", labelKey: "nav.architecture", href: "/architecture" },
  { id: "experience", labelKey: "nav.experience" },
  { id: "projects", labelKey: "nav.projects" },
  { id: "contact", labelKey: "nav.contact" },
];

export function buildSiteIndex(
  config: PortfolioConfig,
  posts: { title: string; slug: string }[],
  t: Translate = createTranslator(),
): SiteIndex {
  return {
    name: t("common.siteName"),
    role: config.experience[0]?.role ?? t("common.defaultRole"),
    email: config.contact?.email,
    resumeUrl: config.hero?.resumeUrl ?? config.about?.resumeUrl,
    about: splitParagraphs(t("about.body")),
    socials: config.socials.map(({ label, href }) => ({ label, href })),
    sections: SECTIONS.map(({ id, labelKey, href }) => ({ id, label: t(labelKey), href: href ?? `/#${id}` })),
    skills: flattenSkillNames(config.skills),
    experience: config.experience.map(({ role, company, period }) => ({ role, company, period })),
    projects: config.projects.map(({ name, description, link, repo }) => ({ name, description, href: link ?? repo })),
    posts: posts.map(({ title, slug }) => ({ title, slug })),
  };
}
