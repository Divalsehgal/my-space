import type { ContactSubmission } from "@/types";

export type { ContactSubmission };

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

    if (!notionContactDbId) {        throw new Error("NOTION_CONTACT_DB_ID is not configured. Unable to submit contact form.");
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
