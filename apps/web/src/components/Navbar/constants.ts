import type { TranslationKey } from "@/i18n/core";

// `id` stays in English so analytics labels don't change with the locale.
export const navLinks: { id: string; labelKey: TranslationKey; href: string; cta?: boolean }[] = [
  { id: "Home", labelKey: "nav.home", href: "/#home" },
  { id: "Blogs", labelKey: "nav.blogs", href: "/blogs" },
  { id: "Skills", labelKey: "nav.skills", href: "/#skills" },
  { id: "Projects", labelKey: "nav.projects", href: "/#projects" },
  { id: "Experience", labelKey: "nav.experience", href: "/#experience" },
  { id: "Contact", labelKey: "nav.contact", href: "/#contact", cta: true },
];
