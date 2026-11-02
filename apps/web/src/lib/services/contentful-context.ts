import "server-only";

import { fetchContentful, type ContentfulCollectionResponse, type ContentfulPostItem } from "./contentful";
import { getPostDescription } from "@/lib/contentful/mappers";
import type { ContentfulRichText } from "@/types/contentful";

/**
 * Simple helper to convert Contentful Rich Text JSON to plain text.
 * Useful for providing context to AI/Chatbots.
 */
export function contentfulToPlainText(richText: ContentfulRichText): string {
  if (!richText?.json?.content) {
    return "";
  }

  interface RichTextNode {
    nodeType: string;
    value?: string;
    content?: RichTextNode[];
  }

  const extractText = (nodes: RichTextNode[]): string => {
    return nodes
      .map((node) => {
        if (node.nodeType === "text") {
          return node.value || "";
        }
        if (node.content) {
          return extractText(node.content);
        }
        return "";
      })
      .join(" ");
  };

  return extractText(richText.json.content as unknown as RichTextNode[])
    .replace(/\s+/g, " ")
    .trim();
}

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
