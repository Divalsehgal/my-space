import "server-only";

import { GraphQLClient } from 'graphql-request';
import type { ContentfulPost } from '@/types/contentful';
import { mapContentfulPost, type ContentfulCollectionResponse, type ContentfulPostItem } from '@/lib/contentful/mappers';
import { BLOG_POST_BY_SLUG_QUERY } from '@/lib/contentful/queries';

export { mapContentfulPost, type ContentfulCollectionResponse, type ContentfulPostItem };

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
const previewToken = process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN;

if (!spaceId || (!accessToken && !previewToken)) {
  console.warn('Contentful environment variables are missing. GraphQL client may not work.');
}

// Personal access tokens (Management API, read/write) start with "CFPAT-".
// The site must only ever hold read-only Delivery/Preview tokens.
const MANAGEMENT_TOKEN_PREFIX = 'CFPAT-';
for (const [name, token] of Object.entries({ CONTENTFUL_ACCESS_TOKEN: accessToken, CONTENTFUL_PREVIEW_ACCESS_TOKEN: previewToken })) {
  if (token?.startsWith(MANAGEMENT_TOKEN_PREFIX)) {
    throw new Error(`${name} is a Contentful management (read/write) token. Use the read-only Delivery/Preview API token instead.`);
  }
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
 * Utility to fetch data from Contentful using the GraphQL client
 */
export function fetchContentful<T>(
  query: string,
  variables?: Record<string, unknown>,
  preview = false
): Promise<T> {
  const activeClient = preview ? previewClient : client;
  return activeClient.request<T>(query, variables);
}

/**
 * Fetches the blog post list (index cards, related posts, sitemap, static
 * params). Only `body { json }` is requested, for the card description:
 * `body.links.assets` costs ~1000 per item against Contentful's 11,000
 * query-complexity cap, which limited this to ~10 posts. Rendering a single
 * post with its embedded assets goes through getContentfulPostBySlug.
 */
export async function getContentfulPosts(limit = 100, preview = false): Promise<ContentfulPost[]> {
  const query = `
    query GetBlogPosts($limit: Int, $preview: Boolean) {
      blogPageCollection(limit: $limit, order: [sys_firstPublishedAt_DESC], preview: $preview) {
        items {
          sys {
            id
            firstPublishedAt
            publishedAt
          }
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
 * Titles and slugs only, for the command palette / terminal index. Skipping
 * the rich-text body keeps this well under Contentful's query-cost limit.
 */
export async function getContentfulPostTitles(limit = 100, preview = false): Promise<Array<{ title: string; slug: string }>> {
  const query = `
    query GetBlogPostTitles($limit: Int, $preview: Boolean) {
      blogPageCollection(limit: $limit, order: [sys_firstPublishedAt_DESC], preview: $preview) {
        items {
          title
          slug
        }
      }
    }
  `;

  try {
    const data = await fetchContentful<{ blogPageCollection?: { items?: Array<{ title: string; slug: string } | null> } }>(
      query,
      { limit, preview },
      preview,
    );
    return (data?.blogPageCollection?.items ?? []).flatMap((item) => (item?.slug ? [{ title: item.title, slug: item.slug }] : []));
  } catch (error) {
    console.error('Error fetching Contentful post titles:', error);
    return [];
  }
}

/**
 * Fetches the most recently published blog post, for surfacing "new post"
 * notifications. Ordered server-side so we don't depend on collection
 * response order matching publish date.
 */
export async function getLatestContentfulPost(preview = false): Promise<ContentfulPost | null> {
  const query = `
    query GetLatestBlogPost($preview: Boolean) {
      blogPageCollection(limit: 1, order: [sys_firstPublishedAt_DESC], preview: $preview) {
        items {
          sys {
            id
            firstPublishedAt
            publishedAt
          }
          title
          slug
        }
      }
    }
  `;

  try {
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem>>(query, { preview }, preview);
    const item = data?.blogPageCollection?.items?.[0];
    return item ? mapContentfulPost(item) : null;
  } catch (error) {
    console.error('Error fetching latest Contentful post:', error);
    return null;
  }
}

/**
 * Fetches the raw GraphQL item for a single blog post. The preview page needs
 * the unmapped shape (with `__typename`) to feed Contentful's live updates.
 */
export async function getContentfulPostItemBySlug(slug: string, preview = false): Promise<ContentfulPostItem | null> {
  try {
    const data = await fetchContentful<ContentfulCollectionResponse<ContentfulPostItem>>(BLOG_POST_BY_SLUG_QUERY, { slug, preview }, preview);
    return data?.blogPageCollection?.items?.[0] ?? null;
  } catch (error) {
    console.error(`Error fetching Contentful post by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetches a single blog post by slug from Contentful
 */
export async function getContentfulPostBySlug(slug: string, preview = false): Promise<ContentfulPost | null> {
  const item = await getContentfulPostItemBySlug(slug, preview);
  return item ? mapContentfulPost(item) : null;
}
