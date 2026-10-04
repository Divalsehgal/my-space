import type { SiteIndex } from "@/lib/site-index";
import { createTranslator, type Translate } from "@/i18n/core";
import { fuzzyScore } from "@dival-sehgal/utils/fuzzy";

export type PaletteAction =
  | { type: "navigate"; href: string }
  | { type: "open"; href: string }
  | { type: "theme" }
  | { type: "copy"; text: string }
  | { type: "game" }
  | { type: "chat" }
  | { type: "terminal" };

export type PaletteItem = { id: string; group: string; label: string; hint?: string; keywords?: string; action: PaletteAction };

/** Everything the palette can jump to or do, built from the site index. */
export function buildItems(index: SiteIndex, t: Translate = createTranslator()): PaletteItem[] {
  const actions = t("palette.group.actions");
  const goTo = t("palette.group.goTo");
  return [
    { id: "a-terminal", group: actions, label: t("palette.openTerminal"), hint: "`", keywords: t("palette.keywords.terminal"), action: { type: "terminal" } },
    { id: "a-ask", group: actions, label: t("palette.ask"), hint: "AI", keywords: t("palette.keywords.ask"), action: { type: "chat" } },
    { id: "a-theme", group: actions, label: t("palette.toggleTheme"), keywords: t("palette.keywords.theme"), action: { type: "theme" } },
    ...(index.email ? [{ id: "a-email", group: actions, label: t("palette.copyEmail"), hint: index.email, keywords: t("palette.keywords.email"), action: { type: "copy" as const, text: index.email } }] : []),
    ...(index.resumeUrl ? [{ id: "a-resume", group: actions, label: t("palette.openResume"), keywords: t("palette.keywords.resume"), action: { type: "open" as const, href: index.resumeUrl } }] : []),
    { id: "a-game", group: actions, label: t("palette.playGame"), keywords: t("palette.keywords.game"), action: { type: "game" } },
    ...index.sections.map((s) => ({ id: `s-${s.id}`, group: goTo, label: s.label, action: { type: "navigate" as const, href: s.href } })),
    { id: "s-blogs", group: goTo, label: t("palette.blog"), action: { type: "navigate", href: "/blogs" } },
    ...index.posts.map((p) => ({ id: `p-${p.slug}`, group: t("palette.group.posts"), label: p.title, action: { type: "navigate" as const, href: `/blogs/${p.slug}` } })),
    ...index.projects
      .filter((p) => p.href)
      .map((p) => ({ id: `pr-${p.name}`, group: t("palette.group.projects"), label: p.name, hint: p.description, action: { type: "open" as const, href: p.href as string } })),
    ...index.socials.map((s) => ({ id: `so-${s.label}`, group: t("palette.group.social"), label: s.label, action: { type: "open" as const, href: s.href } })),
  ];
}

/** Fuzzy rank of an item by its label and keywords; null = no match. */
export function score(query: string, item: PaletteItem): number | null {
  return fuzzyScore(query, `${item.label} ${item.keywords ?? ""}`);
}
