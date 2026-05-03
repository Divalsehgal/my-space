import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { PageObjectResponse, BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { NotionBlogPost, ContactSubmission } from "@/types";

// Types are defined in @/types/blog.ts and @/types/contact.ts
// Re-export for backwards compatibility if needed by other files in this directory
export type { NotionBlogPost, ContactSubmission };

const notionDbId = process.env.NOTION_DATABASE_ID!;
const notionContactDbId = process.env.NOTION_CONTACT_DB_ID!;
const notionApiKey = process.env.NOTION_API_KEY;

const NOTION_VERSION = "2022-06-28";

/**
 * Helper to make direct Fetch requests to Notion API to bypass SDK resolution issues
 */
async function notionFetch(path: string, options: RequestInit = {}) {
    const url = `https://api.notion.com/v1${path}`;
    const headers = {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(`Notion API Error: ${response.status} - ${JSON.stringify(error)}`);
    }

    return response.json();
}

/**
 * Creates a new row in the Notion contact submissions database.
 */
export const createContactSubmission = async (submission: ContactSubmission): Promise<void> => {
    if (!notionApiKey || !notionContactDbId) {
        console.warn("Notion API key or Contact Database ID missing. Skipping submission.");
        return;
    }

    try {
        await notionFetch("/pages", {
            method: "POST",
            body: JSON.stringify({
                parent: { database_id: notionContactDbId },
                properties: {
                    Name: {
                        title: [
                            { text: { content: submission.name } }
                        ]
                    },
                    Email: {
                        email: submission.email
                    },
                    Message: {
                        rich_text: [
                            { text: { content: submission.message } }
                        ]
                    }
                }
            }),
        });
    } catch (error) {
        console.error("Error submitting to Notion:", error);
        throw error;
    }
};

const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const getSlug = (props: Record<string, any>, title: string, pageId: string): string => {
    const slugProp = props.Slug;
    if (slugProp?.type === 'rich_text' && slugProp.rich_text[0]) {
        return slugProp.rich_text[0].plain_text.trim();
    }
    return slugify(title) || pageId;
};

const getCover = (page: any): string | null => {
    if (!page.cover) {
        return null;
    }
    if (page.cover.type === 'external') {
        return page.cover.external.url;
    }
    if (page.cover.type === 'file') {
        return page.cover.file.url;
    }
    return null;
};

const mapNotionPageToBlogPost = (page: any): NotionBlogPost => {
    const props = (page as PageObjectResponse).properties;
    const title = props.Title?.type === 'title'
        ? props.Title.title[0]?.plain_text || "Untitled"
        : "Untitled";
        
    return {
        id: page.id,
        title,
        cover: getCover(page),
        date: page.created_time,
        slug: getSlug(props, title, page.id),
        description: props.Excerpt?.type === 'rich_text'
            ? props.Excerpt.rich_text[0]?.plain_text || ""
            : "",
        tags: props.Tags?.type === 'multi_select'
            ? props.Tags.multi_select.map((t: any) => t.name)
            : [],
    };
};

/**
 * Fetches all published blog posts from Notion.
 */
export async function getNotionPosts(): Promise<NotionBlogPost[]> {
    if (!notionApiKey || !notionDbId) {
        console.warn("Notion API key or Database ID missing.");
        return [];
    }

    try {
        console.log("Fetching Notion posts...", { dbId: notionDbId, hasKey: !!notionApiKey });
        const response = await fetchWithRetry(() => notionFetch(`/databases/${notionDbId}/query`, {
            method: "POST",
            body: JSON.stringify({
                sorts: [
                    {
                        timestamp: "created_time",
                        direction: "descending",
                    },
                ],
            }),
        }));

        console.log("Notion response results count:", (response as any).results?.length);
        return (response as any).results.map(mapNotionPageToBlogPost);
    } catch (error) {
        console.error("Error fetching Notion posts:", error);
        return [];
    }
}

/**
 * Fetches a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<NotionBlogPost | null> {
    const posts = await getNotionPosts();
    return posts.find((p) => p.slug === slug) || null;
}

/**
 * Fetches blocks (content) for a specific page.
 */
export async function getPageContent(pageId: string): Promise<BlockObjectResponse[]> {
    const blocks: BlockObjectResponse[] = [];
    let cursor: string | undefined = undefined;

    try {
        while (true) {
            const queryParams = new URLSearchParams();
            if (cursor) {
                queryParams.append("start_cursor", cursor);
            }
            const queryString = queryParams.toString();
            const url = `/blocks/${pageId}/children${queryString ? `?${queryString}` : ""}`;

            const response = await fetchWithRetry((signal) => notionFetch(url, { signal })) as any;

            blocks.push(...(response.results as BlockObjectResponse[]));

            if (!response.has_more) {
                break;
            }
            cursor = response.next_cursor || undefined;
        }
    } catch (error) {
        console.error("Error fetching Notion post content:", error);
    }

    return blocks;
}
