import { GraphQLClient } from 'graphql-request';
import type { ContentfulPost, ContentfulRichText } from '@/types/contentful';

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
const previewToken = process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN;

if (!spaceId || (!accessToken && !previewToken)) {
  console.warn('Contentful environment variables are missing. GraphQL client may not work.');
}

const endpoint = `https://graphql.contentful.com/content/v1/spaces/${spaceId}`;

/**
 * Production client for Contentful Delivery API
 */
export const client = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
  // Custom fetch allows Next.js to track GraphQL requests for caching
  fetch: (url, options) => fetch(url, { 
    ...options, 
    next: { 
      // Tags allow us to clear the cache instantly via webhooks
      tags: ['contentful'], 
      // 1-hour fallback revalidation (Safety net)
      revalidate: 3600 
    } 
  }),
});

/**
 * Preview client for Contentful Preview API
 */
export const previewClient = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${previewToken}`,
  },
  // Preview API bypasses caching to show draft content immediately
  fetch: (url, options) => fetch(url, { 
    ...options, 
    next: { 
      tags: ['contentful-preview'], 
      revalidate: 0 // No cache for preview
    } 
  }),
});

/**
 * Raw item structure from Contentful GraphQL API
 */
export interface ContentfulPostItem {
  sys: { 
    id: string;
    firstPublishedAt: string;
  };
  title: string;
  slug: string;
  excerpt?: string;
  image?: { url: string };
  body: ContentfulRichText;
}

/**
 * Utility to fetch data from Contentful using the GraphQL client
 */
export async function fetchContentful<T>(
  query: string,
  variables?: Record<string, unknown>,
  preview = false
): Promise<T> {
  const activeClient = preview ? previewClient : client;
  return activeClient.request<T>(query, variables);
}

/**
 * Mapping function to convert Contentful data to our shared Blog Post format
 */
export function mapContentfulPost(item: ContentfulPostItem): ContentfulPost {
  return {
    id: item.sys.id,
    title: item.title,
    cover: item.image?.url || null,
    date: item.sys.firstPublishedAt,
    slug: item.slug,
    description: item.excerpt || "",
    tags: [],
    content: item.body,
  };
}

export interface ContentfulCollectionResponse<T> {
  blogPageCollection: {
    items: T[];
  };
}

/**
 * Fetches all blog posts from Contentful
 */
export async function getContentfulPosts(limit = 10, preview = false): Promise<ContentfulPost[]> {
  const query = `
    query GetBlogPosts($limit: Int, $preview: Boolean) {
      blogPageCollection(limit: $limit, preview: $preview) {
        items {
          sys { id, firstPublishedAt }
          title
          slug
          image { url }
        }
      }
    }
  `;

  try {
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem>>(query, { limit, preview }, preview);
    
    if (!data?.blogPageCollection?.items) {
      return [];
    }

    return data.blogPageCollection.items.map(mapContentfulPost);
  } catch (error) {
    console.error('Error fetching Contentful posts collection:', error);
    return [];
  }
}


/**
 * Fetches a single blog post by slug from Contentful
 */
export async function getContentfulPostBySlug(slug: string, preview = false): Promise<ContentfulPost | null> {
  const query = `
    query GetBlogPostBySlug($slug: String, $preview: Boolean) {
      blogPageCollection(where: { slug: $slug }, limit: 1, preview: $preview) {
        items {
          sys { id, firstPublishedAt }
          title
          slug
          image { url }
          body { 
            json
            links {
              assets {
                block {
                  sys { id }
                  url
                  title
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem>>(query, { slug, preview }, preview);
    
    if (!data?.blogPageCollection?.items) {
      return null;
    }

    const item = data.blogPageCollection.items[0];
    return item ? mapContentfulPost(item) : null;
  } catch (error) {
    console.error(`Error fetching Contentful post by slug ${slug}:`, error);
    return null;
  }
}
