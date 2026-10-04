import type { SiteIndex } from "@/lib/site-index";
import { createTranslator, type Translate } from "@/i18n/core";
import { slugify as slug } from "@dival-sehgal/utils/string";

// Column widths and truncation for terminal output.
const PROJECT_SUMMARY_CHARS = 60;
const COMMAND_COLUMN_WIDTH = 11;
const PERIOD_COLUMN_WIDTH = 20;

export type TerminalAction =
  | { type: "navigate"; href: string }
  | { type: "open"; href: string }
  | { type: "theme"; mode?: "light" | "dark" }
  | { type: "copy"; text: string }
  | { type: "game" }
  | { type: "clear" }
  | { type: "exit" }
  | { type: "ask"; question: string };

export type CommandResult = { lines: string[]; action?: TerminalAction };

/** Command names, in `help` order. Descriptions are translation keys `terminal.help.<name>`. */
export const COMMANDS = [
  "help", "whoami", "about", "ls", "cd", "cat", "open", "skills", "experience",
  "ask", "theme", "email", "resume", "game", "clear", "exit",
] as const;

const matches = (needle: string, hay: string) => slug(hay).includes(slug(needle)) || hay.toLowerCase().includes(needle.toLowerCase());

function findThing(index: SiteIndex, query: string) {
  const project = index.projects.find((p) => matches(query, p.name));
  if (project) {return { kind: "project" as const, project };}
  const post = index.posts.find((p) => matches(query, p.title) || matches(query, p.slug));
  if (post) {return { kind: "post" as const, post };}
  const social = index.socials.find((s) => matches(query, s.label));
  if (social) {return { kind: "social" as const, social };}
  return null;
}

function list(index: SiteIndex, what: string, t: Translate): CommandResult {
  switch (what) {
    case "":
    case "sections":
      return { lines: index.sections.map((s) => `  ${s.id}/`) };
    case "projects":
      return { lines: index.projects.map((p) => `  ${slug(p.name)}  ${p.description.slice(0, PROJECT_SUMMARY_CHARS)}…`) };
    case "posts":
    case "blog":
      return { lines: index.posts.map((p) => `  ${p.slug}`) };
    case "skills":
      return { lines: [`  ${index.skills.join(", ")}`] };
    default:
      return { lines: [t("terminal.lsUnknown", { what })] };
  }
}

function catOrOpen(command: "cat" | "open", arg: string, index: SiteIndex, t: Translate): CommandResult {
  if (!arg) {return { lines: [t("terminal.whichOne", { command })] };}
  const thing = findThing(index, arg);
  if (!thing) {return { lines: [t("terminal.notFound", { command, arg })] };}
  if (thing.kind === "post") {
    return { lines: [t("terminal.openingPost", { title: thing.post.title })], action: { type: "navigate", href: `/blogs/${thing.post.slug}` } };
  }
  if (thing.kind === "social") {
    return { lines: [t("terminal.opening", { name: thing.social.label })], action: { type: "open", href: thing.social.href } };
  }
  const { project } = thing;
  if (command === "open" && project.href) {
    return { lines: [t("terminal.opening", { name: project.name })], action: { type: "open", href: project.href } };
  }
  return { lines: [project.name, project.description, ...(project.href ? [`  ${project.href}`] : [])] };
}

type Handler = (arg: string, index: SiteIndex, t: Translate) => CommandResult;

const HANDLERS: Record<string, Handler> = {
  help: (_arg, _index, t) => ({
    lines: [t("terminal.commandsHeading"), ...COMMANDS.map((name) => `  ${name.padEnd(COMMAND_COLUMN_WIDTH)}${t(`terminal.help.${name}`)}`)],
  }),
  whoami: (_arg, index) => ({ lines: [`${index.name}, ${index.role}.`] }),
  about: (_arg, index, t) => ({ lines: index.about.length ? index.about : [t("terminal.noBio")] }),
  ls: (arg, index, t) => list(index, arg.toLowerCase(), t),
  cd: (arg, index, t) => {
    const section = index.sections.find((s) => s.id === arg.toLowerCase().replace(/\/$/, ""));
    if (!section) {return { lines: [t("terminal.cdUnknown", { arg: arg || t("terminal.none") })] };}
    return { lines: [`→ ${section.label}`], action: { type: "navigate", href: section.href } };
  },
  cat: (arg, index, t) => catOrOpen("cat", arg, index, t),
  open: (arg, index, t) => catOrOpen("open", arg, index, t),
  skills: (arg, index, t) => {
    const found = arg ? index.skills.filter((s) => s.toLowerCase().includes(arg.toLowerCase())) : index.skills;
    return { lines: found.length ? [`  ${found.join(", ")}`] : [t("terminal.noSkills", { query: arg })] };
  },
  experience: (_arg, index) => ({ lines: index.experience.map((e) => `  ${e.period.padEnd(PERIOD_COLUMN_WIDTH)}${e.role} @ ${e.company}`) }),
  ask: (arg, _index, t) => (arg ? { lines: [], action: { type: "ask", question: arg } } : { lines: [t("terminal.askWhat")] }),
  theme: (arg, _index, t) => {
    const mode = arg === "dark" || arg === "light" ? arg : undefined;
    return { lines: [mode ? t("terminal.themeSet", { mode }) : t("terminal.themeToggled")], action: { type: "theme", mode } };
  },
  email: (_arg, index, t) =>
    index.email
      ? { lines: [t("terminal.copied", { email: index.email })], action: { type: "copy", text: index.email } }
      : { lines: [t("terminal.noEmail")] },
  resume: (_arg, index, t) =>
    index.resumeUrl
      ? { lines: [t("terminal.openingResume")], action: { type: "open", href: index.resumeUrl } }
      : { lines: [t("terminal.noResume")] },
  game: (_arg, _index, t) => ({ lines: [t("terminal.launchingGame")], action: { type: "game" } }),
  clear: () => ({ lines: [], action: { type: "clear" } }),
  exit: () => ({ lines: [], action: { type: "exit" } }),
  quit: () => ({ lines: [], action: { type: "exit" } }),
  sudo: (_arg, _index, t) => ({ lines: [t("terminal.sudo")] }),
};

/** Runs one command line against the site index. Pure: side effects come back as an action. */
export function runCommand(input: string, index: SiteIndex, t: Translate = createTranslator()): CommandResult {
  const [rawCommand = "", ...rest] = input.trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  if (!command) {return { lines: [] };}
  const handler = HANDLERS[command];
  return handler ? handler(rest.join(" "), index, t) : { lines: [t("terminal.unknown", { command })] };
}

/** Tab completion over command names and, for the first argument, known targets. */
export function complete(input: string, index: SiteIndex): string {
  const parts = input.split(" ");
  if (parts.length === 1) {
    const hit = COMMANDS.find((name) => name.startsWith(parts[0].toLowerCase()));
    return hit ? `${hit} ` : input;
  }
  const [command, partial = ""] = parts;
  const pool =
    command === "cd"
      ? index.sections.map((s) => s.id)
      : [...index.projects.map((p) => slug(p.name)), ...index.posts.map((p) => p.slug), ...index.socials.map((s) => slug(s.label))];
  const hit = pool.find((candidate) => candidate.startsWith(partial.toLowerCase()));
  return hit ? `${command} ${hit}` : input;
}
