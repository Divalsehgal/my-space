import { portfolioService } from "@/features/portfolio";
import { getContentfulPosts } from "@/lib/services/contentful";
import { buildSiteIndex } from "@/lib/site-index";
import { buildLlmsTxt } from "@/lib/seo/llms";

// Contentful fetches are tagged, so a publish webhook refreshes this too.
export const revalidate = 3600;

export async function GET() {
  const [{ config }, posts] = await Promise.all([portfolioService.getConfig(), getContentfulPosts()]);
  const body = buildLlmsTxt(
    buildSiteIndex(config, posts),
    posts.map(({ title, slug, description, date }) => ({ title, slug, description, date })),
  );
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
