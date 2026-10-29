import type { SiteIndex } from "@/lib/site-index";
import { SITE_URL } from "@/lib/config/site";

export type LlmsPost = {
  title: string;
  slug: string;
  description?: string;
  date?: string;
  /** Plain-text body; only llms-full.txt includes it. */
  content?: string;
};

const absolute = (href: string) => (href.startsWith("http") ? href : `${SITE_URL}${href}`);
/** Length of an ISO date's YYYY-MM-DD prefix. */
const ISO_DAY_LENGTH = 10;
const day = (date?: string) => date?.slice(0, ISO_DAY_LENGTH);

/**
 * /llms.txt (https://llmstxt.org): a Markdown summary of the site for answer
 * engines and LLM crawlers - who this is, what they do, and links to the pages
 * worth citing. Built from the same site index as the command palette, so it
 * never drifts from the visible content.
 */
export function buildLlmsTxt(site: SiteIndex, posts: LlmsPost[]): string {
  const [summary, ...about] = site.about;
  // The about copy opens by naming the role, so it alone is the summary.
  const lines = [`# ${site.name}`, "", `> ${summary ?? `${site.role}.`}`, ""];
  if (about.length) {
    lines.push(...about.flatMap((paragraph) => [paragraph, ""]));
  }

  lines.push("## Profile", "", `- Role: ${site.role}`);
  if (site.skills.length) {lines.push(`- Skills: ${site.skills.join(", ")}`);}
  if (site.email) {lines.push(`- Email: ${site.email}`);}
  if (site.resumeUrl) {lines.push(`- [Resume](${site.resumeUrl})`);}
  lines.push(...site.socials.map((social) => `- [${social.label}](${social.href})`), "");

  if (site.experience.length) {
    lines.push("## Experience", "", ...site.experience.map((job) => `- ${job.role}, ${job.company} (${job.period})`), "");
  }

  if (site.projects.length) {
    lines.push(
      "## Projects",
      "",
      ...site.projects.map((project) =>
        project.href ? `- [${project.name}](${project.href}): ${project.description}` : `- ${project.name}: ${project.description}`,
      ),
      "",
    );
  }

  if (posts.length) {
    lines.push(
      "## Blog posts",
      "",
      ...posts.map((post) => {
        const notes = [day(post.date), post.description].filter(Boolean).join(" - ");
        return `- [${post.title}](${SITE_URL}/blogs/${post.slug})${notes ? `: ${notes}` : ""}`;
      }),
      "",
    );
  }

  lines.push("## Pages", "", ...site.sections.map((section) => `- [${section.label}](${absolute(section.href)})`), "");
  lines.push("## Optional", "", `- [Full text of every blog post](${SITE_URL}/llms-full.txt)`, "");
  return lines.join("\n");
}

/** /llms-full.txt: the llms.txt summary followed by the full text of every post. */
export function buildLlmsFullTxt(site: SiteIndex, posts: LlmsPost[]): string {
  const bodies = posts
    .filter((post) => post.content)
    .map((post) =>
      [`## ${post.title}`, "", `URL: ${SITE_URL}/blogs/${post.slug}`, ...(post.date ? [`Published: ${day(post.date)}`] : []), "", post.content, ""].join("\n"),
    );
  return [buildLlmsTxt(site, posts), "# Blog posts (full text)", "", ...bodies].join("\n");
}
