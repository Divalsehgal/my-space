import "server-only";

import { fetchContentful, type ContentfulCollectionResponse, type ContentfulPostItem } from "./contentful";
import { getPostDescription } from "@/lib/contentful/mappers";
import { contentfulToPlainText } from "@/lib/contentful/plain-text";
export { contentfulToPlainText } from "@/lib/contentful/plain-text";

/**
 * Fetches latest blog posts with their full content for AI context purposes.
 */
export async function getContentfulPostsForContext(limit = 10): Promise<Array<{ title: string; content: string; slug: string; description: string; date: string }>> {
  const query = `
    query GetBlogPostsForContext($limit: Int) {
      blogPageCollection(limit: $limit, order: [sys_firstPublishedAt_DESC]) {
        items {
          sys { firstPublishedAt }
          title
          slug
          body { 
            json 
          }
        }
      }
    }
  `;

  try {
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem & { excerpt?: string }>>(query, { limit });

    if (!data?.blogPageCollection?.items) {
      return [];
    }

    return data.blogPageCollection.items.map(item => ({
      title: item.title,
      slug: item.slug,
      // Same sentence-cut description the site's cards and meta tags use.
      description: getPostDescription(item.body),
      date: item.sys.firstPublishedAt,
      content: contentfulToPlainText(item.body)
    }));
  } catch (error) {
    console.error('Error fetching Contentful posts for context:', error);
    return [];
  }
}
