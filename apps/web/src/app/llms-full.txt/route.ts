import { portfolioService } from "@/features/portfolio";
import { getContentfulPostsForContext } from "@/lib/services/contentful-context";
import { buildSiteIndex } from "@/lib/site-index";
import { buildLlmsFullTxt } from "@/lib/seo/llms";

/** Every post, not just the chatbot's recent few. */
const POST_LIMIT = 100;

export const revalidate = 3600;

export async function GET() {
  const [{ config }, posts] = await Promise.all([portfolioService.getConfig(), getContentfulPostsForContext(POST_LIMIT)]);
  const body = buildLlmsFullTxt(buildSiteIndex(config, posts), posts);
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
