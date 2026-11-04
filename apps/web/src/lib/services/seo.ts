import { MetadataRoute } from "next";
import { getContentfulPosts } from "@/lib/services/contentful";
import { SITE_URL as BASE_URL } from "@/lib/config/site";

export async function generateSitemap(): Promise<MetadataRoute.Sitemap> {
  // Dynamic routes (Blogs)
  const posts = await getContentfulPosts();
  const blogUrls = posts.map((post) => ({
    url: `${BASE_URL}/blogs/${post.slug}`,
    lastModified: new Date(post.publishedAt || post.date || Date.now()),
  }));

  // Listing pages change when a post does. Using the build time instead made
  // every lastmod "now" on each deploy, which teaches Google to ignore them.
  const latestPostTime = Math.max(0, ...blogUrls.map((entry) => entry.lastModified.getTime()));
  const contentUpdated = latestPostTime ? new Date(latestPostTime) : undefined;

  // Google ignores changefreq/priority, so they're omitted. /architecture is
  // left out: it's a thin auto-generated page that would dilute crawl budget.
  const staticUrls = [
    { url: BASE_URL, lastModified: contentUpdated },
    { url: `${BASE_URL}/blogs`, lastModified: contentUpdated },
  ];

  return [...staticUrls, ...blogUrls];
}

// Draft previews 404 for the public anyway; keep crawlers off them too.
const DISALLOW = ["/private/", "/preview/", "/api/preview"];

/**
 * Answer-engine and LLM crawlers. "*" already allows them; naming them makes
 * the opt-in explicit and survives a future tightening of the "*" group. A
 * bot that matches a named group ignores "*", so the disallow list repeats.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export function generateRobots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
