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
    if (!notionApiKey) {
        throw new Error("NOTION_API_KEY is not configured. Unable to submit contact form.");
    }

    if (!notionContactDbId) {
        throw new Error("NOTION_CONTACT_DB_ID is not configured. Unable to submit contact form.");
    }

    try {
        // Fetch database schema to detect property names dynamically
        const db = await notionFetch(`/databases/${notionContactDbId}`);
        const properties = db.properties;

        // Find property names by type
        const titlePropName = Object.keys(properties).find(key => properties[key].type === 'title');
        const emailPropName = Object.keys(properties).find(key => properties[key].type === 'email');
        const messagePropName = Object.keys(properties).find(key => 
            properties[key].type === 'rich_text' && (key.toLowerCase().includes('message') || key.toLowerCase().includes('content'))
        ) || Object.keys(properties).find(key => properties[key].type === 'rich_text');

        if (!titlePropName) {
            throw new Error(`No 'title' property found in Notion database ${notionContactDbId}`);
        }

        const notionPageProperties: Record<string, unknown> = {
            [titlePropName]: {
                title: [
                    { text: { content: submission.name } }
                ]
            }
        };

        if (emailPropName) {
            notionPageProperties[emailPropName] = {
                email: submission.email
            };
        }

        if (messagePropName) {
            notionPageProperties[messagePropName] = {
                rich_text: [
                    { text: { content: submission.message } }
                ]
            };
        }

        await notionFetch("/pages", {
            method: "POST",
            body: JSON.stringify({
                parent: { database_id: notionContactDbId },
                properties: notionPageProperties
            }),
        });
    } catch (error) {
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

const getSlug = (props: PageObjectResponse['properties'], title: string, pageId: string): string => {
    const slugProp = props.Slug;
    if (slugProp?.type === 'rich_text' && slugProp.rich_text[0]) {
        return slugProp.rich_text[0].plain_text.trim();
    }
    return slugify(title) || pageId;
};

const getCover = (page: PageObjectResponse): string | null => {
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

const mapNotionPageToBlogPost = (page: PageObjectResponse): NotionBlogPost => {
    const props = page.properties;
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
            ? props.Tags.multi_select.map((t) => t.name)
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

        return (response as { results: PageObjectResponse[] }).results.map(mapNotionPageToBlogPost);
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

            const response = await fetchWithRetry((signal) => notionFetch(url, { signal })) as { results: unknown[], has_more: boolean, next_cursor: string | null };

            blocks.push(...(response.results as BlockObjectResponse[]));

            if (!response.has_more) {
                break;
            }
            cursor = response.next_cursor || undefined;
        }
    } catch {
        // Silently fail or handle error appropriately
    }

    return blocks;
}
