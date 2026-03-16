import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { Client } from "@notionhq/client";
import type { PageObjectResponse, BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export type NotionBlogPost = {
    id: string;
    title: string;
    slug: string;
    tags: string[];
    date: string | null;
    description: string | null;
    cover: string | null;
}

export type ContactSubmission = {
    name: string;
    email: string;
    message: string;
};

// Notion setup
const notionClient = new Client({ auth: process.env.NOTION_API_KEY });
const notionDbId = process.env.NOTION_DATABASE_ID!;
const notionContactDbId = process.env.NOTION_CONTACT_DB_ID!;

/**
 * Creates a new row in the Notion contact submissions database.
 * Required DB columns: Name (title), Email (email), Message (rich_text)
 */
export const createContactSubmission = async (submission: ContactSubmission): Promise<void> => {
    if (!process.env.NOTION_API_KEY || !notionContactDbId) {
        throw new Error("NOTION_API_KEY or NOTION_CONTACT_DB_ID env var is missing");
    }

    await notionClient.pages.create({
        parent: { database_id: notionContactDbId },
        properties: {
            "Doc name": {
                title: [{ text: { content: submission.name } }],
            },
            Email: {
                email: submission.email,
            },
            Message: {
                rich_text: [{ text: { content: submission.message } }],
            },
        },
    });
};

// Cache for Data Source IDs
let cachedDataSourceId: string | null = null;

/**
 * Resolves the Data Source ID from a Database ID.
 * In Notion v5.7.0, a "database" is a container that holds one or more "data sources".
 */
const resolveDataSourceId = async (dbId: string): Promise<string> => {
    if (cachedDataSourceId) return cachedDataSourceId;

    try {
        // Try to retrieve the object to see what it is
        const db = await notionClient.databases.retrieve({ database_id: dbId }) as any;
        
        // If it has data_sources, use the first one
        if (db.data_sources && db.data_sources.length > 0) {
            cachedDataSourceId = db.data_sources[0].id;
            return cachedDataSourceId!;
        }
        
        // If it doesn't have data_sources, it might already be a data_source_id
        // or a legacy database that the new SDK treats as a data source.
        return dbId;
    } catch (error) {
        // If retrieve fails, it might be because dbId is already a Data Source ID
        // and databases.retrieve doesn't find it.
        return dbId;
    }
}

/**
 * Converts a string into a URL-friendly slug.
 */
const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')        // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Fetch Notion blog posts (metadata only)
 */
export const getNotionPosts = async (): Promise<NotionBlogPost[]> => {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
        console.warn("Notion API key or Database ID missing");
        return [];
    }

    try {
        const dataSourceId = await resolveDataSourceId(notionDbId);

        // In SDK v5.7.0 (API version 2025-09-03), databases are queried via dataSources
        const response = await fetchWithRetry(() =>
            (notionClient as any).dataSources.query({
                data_source_id: dataSourceId,
                filter: {
                    property: "Status",
                    status: { equals: "Published" },
                },
                sorts: [{ property: "Publish Date", direction: "descending" }],
            })
        ) as any;

        return response.results.map((page: any) => {
            const props = (page as PageObjectResponse).properties;
            const title = props.Title?.type === 'title'
                ? props.Title.title[0]?.plain_text || "Untitled"
                : "Untitled";
                
            return {
                id: page.id,
                title,
                slug: props.Slug?.type === 'rich_text' && props.Slug.rich_text[0]
                    ? props.Slug.rich_text[0].plain_text.trim()
                    : slugify(title) || page.id,
                tags: props.Tags?.type === 'multi_select'
                    ? props.Tags.multi_select.map(tag => tag.name)
                    : [],
                date: props["Publish Date"]?.type === 'date'
                    ? props["Publish Date"].date?.start || null
                    : null,
                description: props.Description?.type === 'rich_text'
                    ? props.Description.rich_text[0]?.plain_text || null
                    : null,
                cover: page.cover?.type === 'external'
                    ? page.cover.external.url
                    : page.cover?.type === 'file'
                        ? page.cover.file.url
                        : null,
            };
        });
    } catch (error) {
        console.error("Error fetching Notion posts:", error);
        return [];
    }
}

/**
 * Fetch full content (blocks) of one blog post
 */
export const getNotionPostContent = async (pageId: string): Promise<BlockObjectResponse[]> => {
    const blocks: BlockObjectResponse[] = [];
    let cursor: string | undefined = undefined;

    try {
        while (true) {
            const response = await fetchWithRetry(() =>
                notionClient.blocks.children.list({
                    block_id: pageId,
                    start_cursor: cursor,
                })
            ) as any;

            blocks.push(...(response.results as BlockObjectResponse[]));

            if (!response.has_more) break;
            cursor = response.next_cursor || undefined;
        }
    } catch (error) {
        console.error("Error fetching Notion post content:", error);
    }

    return blocks;
}
