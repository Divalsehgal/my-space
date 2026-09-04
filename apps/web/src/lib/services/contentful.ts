import { GraphQLClient } from 'graphql-request';
import type { ContentfulPost, ContentfulQuiz, ContentfulRichText } from '@/types/contentful';

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
    publishedAt?: string;
  };
  title: string;
  slug: string;
  excerpt?: string;
  body: ContentfulRichText;
  quiz?: {
    sys: { id: string };
    title: string;
    questionEntriesCollection?: {
      items: Array<{
        sys: { id: string };
        questionText: ContentfulRichText;
        explanation: ContentfulRichText;
        correctAnswer: { sys: { id: string } };
        optionsCollection?: {
          items: Array<{ sys: { id: string }; text: ContentfulRichText } | null>;
        };
      } | null>;
    };
  } | null;
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
    // BlogPage does not define a cover-image field in the Contentful model.
    cover: null,
    date: item.sys.firstPublishedAt,
    publishedAt: item.sys.publishedAt,
    slug: item.slug,
    description: getPostDescription(item.body),
    tags: [],
    content: item.body,
    quiz: mapContentfulQuiz(item.quiz),
  };
}

function mapContentfulQuiz(quiz?: ContentfulPostItem['quiz']): ContentfulQuiz | null {
  if (!quiz) {
    return null;
  }

  return {
    id: quiz.sys.id,
    title: quiz.title,
    questions: (quiz.questionEntriesCollection?.items || []).flatMap((question) => {
      if (!question || !question.questionText || !question.explanation || !question.correctAnswer) {
        return [];
      }
      return [{
        id: question.sys.id,
        questionText: question.questionText,
        explanation: question.explanation,
        correctAnswerId: question.correctAnswer.sys.id,
        options: (question.optionsCollection?.items || []).flatMap((option) => option ? [{
          id: option.sys.id,
          text: option.text,
        }] : []),
      }];
    }),
  };
}

export interface ContentfulCollectionResponse<T> {
  blogPageCollection: {
    items: T[];
  };
}

function getPostDescription(body?: ContentfulRichText): string {
  if (!body?.json?.content) {
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

  return extractText(body.json.content as unknown as RichTextNode[])
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/**
 * Fetches all blog posts from Contentful
 */
export async function getContentfulPosts(limit = 10, preview = false): Promise<ContentfulPost[]> {
  const query = `
    query GetBlogPosts($limit: Int, $preview: Boolean) {
      blogPageCollection(limit: $limit, preview: $preview) {
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
  const query = `query GetBlogPostBySlug($slug: String!, $preview: Boolean = false) {
  blogPageCollection(where: {slug: $slug}, limit: 1, preview: $preview) {
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
        links {
          assets {
            block {
              sys {
                id
              }
              url
              title
              width
              height
            }
          }
        }
      }
      quiz {
        sys { id }
        title
        questionEntriesCollection(limit: 50) {
          items {
            sys { id }
            questionText { json }
            explanation { json }
            correctAnswer { sys { id } }
            optionsCollection(limit: 4) {
              items { sys { id } text { json } }
            }
          }
        }
      }
    }
  }
}`


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
