import { fetchContentful, type ContentfulCollectionResponse, type ContentfulPostItem } from "./contentful";
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
export async function getContentfulPostsForContext(limit = 5): Promise<Array<{ title: string; content: string; slug: string }>> {
  const query = `
    query GetBlogPostsForContext($limit: Int) {
      blogPageCollection(limit: $limit) {
        items {
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
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem>>(query, { limit });
    
    if (!data?.blogPageCollection?.items) {
      return [];
    }

    return data.blogPageCollection.items.map(item => ({
      title: item.title,
      slug: item.slug,
      content: contentfulToPlainText(item.body)
    }));
  } catch (error) {
    console.error('Error fetching Contentful posts for context:', error);
    return [];
  }
}
